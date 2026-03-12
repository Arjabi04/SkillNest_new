import { Router } from "express";
const router = Router();
import multer, { memoryStorage } from "multer";
import { createReadStream } from "streamifier";
import { createTransport } from "nodemailer";
import cloudinary from "../config/cloudinary.js";
import auth from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/adminAuth.js";
import { createEventJoinNotification, createEventLeaveNotification, notifyParticipantsOfNewJoiner, notifyParticipantsOfLeaver } from "./notifications.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Community from "../models/Community.js";
import Notification from "../models/Notification.js";

const storage = memoryStorage();
const upload = multer({ storage });

const sendEventJoinConfirmationEmail = async ({ toEmail, username, event }) => {
  if (!toEmail) return;

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email configuration missing. Skipping join confirmation email.');
    return;
  }

  try {
    const transporter = createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const startDateText = event?.startDate
      ? new Date(event.startDate).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'TBA';

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `Event Registration Confirmed: ${event?.title || 'SkillNest Event'}`,
      html: `
        <p>Hi ${username || 'there'},</p>
        <p>Your registration is confirmed for <strong>${event?.title || 'the event'}</strong>.</p>
        <p><strong>Start:</strong> ${startDateText}</p>
        <p>Thanks for joining via SkillNest.</p>
      `
    });
  } catch (emailError) {
    console.error('Error sending join confirmation email:', emailError);
  }
};

// ============================================================
// EVENT CRUD OPERATIONS
// ============================================================

// GET ALL EVENTS (with filtering and pagination)
router.get("/", auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      eventType, 
      category, 
      startDate, 
      endDate, 
      organizerId, 
      communityId,
      search,
      visibility = 'public',
      userId
    } = req.query;

    // Build query
    const query = {
      status: 'published',
      $and: [
        {
          $or: [
            { approvalStatus: 'approved' },
            { approvalStatus: { $exists: false } },
            { organizer: req.user._id }
          ]
        },
        {
          $or: [
            { endDate: { $gte: new Date() } },
            { organizer: req.user._id }
          ]
        }
      ]
    };
    
    // Filter by event type
    if (eventType) query.eventType = eventType;
    
    // Filter by category
    if (category) query.category = category;
    
    // Filter by date range
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    // Filter by organizer
    if (organizerId) query.organizer = organizerId;
    
    // Filter by community
    if (communityId) query.community = communityId;
    
    // Filter by visibility
    if (visibility !== 'all') {
      query.visibility = visibility;
    }
    
    // Search functionality
    if (search) {
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    const events = await Event.find(query)
      .populate('organizer', 'username profileImage')
      .populate('community', 'name coverImage')
      .populate('attendees.user', 'username profileImage')
      .sort({ startDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET PENDING EVENT CREATIONS (Site Admin only)
router.get("/pending/all", verifyAdmin, async (req, res) => {
  try {
    const pendingEventCreations = await Event.find({ approvalStatus: 'pending' })
      .populate('organizer', 'username profileImage email')
      .populate('community', 'name coverImage')
      .sort({ createdAt: -1 });

    res.json({ pendingEventCreations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// APPROVE EVENT (Site Admin only)
router.post("/:eventId/approve", verifyAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    event.approvalStatus = 'approved';
    event.approvalReviewedAt = new Date();
    event.approvalReviewedBy = req.admin?.username || 'admin';
    await event.save();

    res.json({ msg: "Event approved successfully", event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// REJECT EVENT (Site Admin only)
router.post("/:eventId/reject", verifyAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    event.approvalStatus = 'rejected';
    event.approvalReviewedAt = new Date();
    event.approvalReviewedBy = req.admin?.username || 'admin';
    await event.save();

    res.json({ msg: "Event rejected", event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET SINGLE EVENT
router.get("/:eventId", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('organizer', 'username profileImage email')
      .populate('community', 'name description coverImage')
      .populate('attendees.user', 'username profileImage')
      .populate('invitations.user', 'username profileImage email')
      .populate('agenda.speaker', 'username profileImage')
      .populate('feedback.user', 'username profileImage');

    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    const isOrganizer = event.organizer?._id?.toString() === req.user._id.toString();
    const isApproved = event.approvalStatus === 'approved' || !event.approvalStatus;
    if (!isApproved && !isOrganizer) {
      return res.status(403).json({ msg: "Event is pending admin approval" });
    }

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// CREATE EVENT
router.post("/", auth, upload.single("coverImage"), async (req, res) => {
  try {
    const {
      title,
      description,
      community,
      eventType,
      category,
      startDate,
      endDate,
      timezone,
      location,
      onlineDetails,
      capacity,
      price,
      currency,
      visibility,
      tags,
      requirements,
      allowRegistration,
      registrationDeadline
    } = req.body;

    // Use authenticated user as organizer
    const organizer = req.user._id;

    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ msg: "End date must be after start date" });
    }

    // Upload cover image if provided
    let coverImageUrl = "";
    if (req.file) {
      try {
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "skillnest_events" },
            (err, result) => {
              if (err) reject(err);
              else resolve(result.secure_url);
            }
          );
          createReadStream(req.file.buffer).pipe(uploadStream);
        });
        coverImageUrl = await uploadPromise;
      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr);
      }
    }

    const event = new Event({
      title,
      description,
      organizer,
      community: community || null,
      eventType: eventType || 'online',
      category: category || 'other',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timezone: timezone || 'UTC',
      location: location || {},
      onlineDetails: onlineDetails || {},
      capacity: capacity ? parseInt(capacity) : null,
      price: price ? parseFloat(price) : 0,
      currency: currency || 'USD',
      visibility: visibility || 'public',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []),
      requirements,
      allowRegistration: allowRegistration === true || allowRegistration === 'true',
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      coverImage: coverImageUrl,
      status: 'published',
      approvalStatus: 'pending'
    });

    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'username profileImage')
      .populate('community', 'name coverImage');

    res.status(201).json({
      msg: "Event creation request submitted. Waiting for admin approval.",
      event: populatedEvent
    });
  } catch (err) {
    console.error('Event creation error:', err);
    console.error('Request body:', req.body);
    console.error('User:', req.user);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// UPDATE EVENT
router.put("/:eventId", upload.single("coverImage"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    const isOrganizer = event.organizer?._id?.toString() === userId.toString();
    const isApproved = event.approvalStatus === 'approved' || !event.approvalStatus;
    if (!isApproved && !isOrganizer) {
      return res.status(403).json({ msg: "Event is pending admin approval" });
    }

    // Check if user is organizer (basic auth check)
    if (event.organizer.toString() !== req.body.userId) {
      return res.status(403).json({ msg: "Not authorized to update this event" });
    }

    // Handle image upload
    if (req.file) {
      try {
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "skillnest_events" },
            (err, result) => {
              if (err) reject(err);
              else resolve(result.secure_url);
            }
          );
          createReadStream(req.file.buffer).pipe(uploadStream);
        });
        req.body.coverImage = await uploadPromise;
      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr);
      }
    }

    // Parse JSON fields
    if (req.body.location) req.body.location = JSON.parse(req.body.location);
    if (req.body.onlineDetails) req.body.onlineDetails = JSON.parse(req.body.onlineDetails);
    if (req.body.tags) req.body.tags = req.body.tags.split(',').map(tag => tag.trim());

    // Update event
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId' && req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    });

    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'username profileImage')
      .populate('community', 'name coverImage');

    res.json(populatedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE EVENT
router.delete("/:eventId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const event = await Event.findById(req.params.eventId).populate('attendees.user', 'username');
    
    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    // Check if user is organizer
    if (event.organizer.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "Not authorized to delete this event" });
    }

    // Notify all attendees that the event was cancelled
    for (const attendee of event.attendees) {
      if (attendee.status === 'going' && attendee.user._id.toString() !== userId.toString()) {
        try {
          await Notification.createNotification({
            recipient: attendee.user._id,
            sender: userId,
            type: 'event_cancelled',
            title: 'Event Cancelled',
            message: `The event "${event.title}" has been cancelled by the organizer`,
            relatedEvent: event._id
          });
        } catch (notifErr) {
          console.error('Error sending cancellation notification:', notifErr);
        }
      }
    }

    await Event.findByIdAndDelete(req.params.eventId);
    res.json({ msg: "Event deleted successfully" });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// EVENT ATTENDANCE & INVITATIONS
// ============================================================

// REGISTER FOR EVENT / UPDATE ATTENDANCE STATUS
router.post("/:eventId/attend", auth, async (req, res) => {
  try {
    const { status = 'going' } = req.body; // going, maybe, declined
    const userId = req.user._id;
    const event = await Event.findById(req.params.eventId).populate('organizer', 'username');

    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    // Check if registration is still open
    if (!event.allowRegistration) {
      return res.status(400).json({ msg: "Registration is closed for this event" });
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ msg: "Registration deadline has passed" });
    }

    // Check capacity
    const currentAttendees = event.attendees.filter(a => a.status === 'going').length;
    if (event.capacity && currentAttendees >= event.capacity && status === 'going') {
      // Add to waitlist instead
      const existingWaitlist = event.waitlist?.find(w => w.user.toString() === userId.toString());
      if (!existingWaitlist) {
        if (!event.waitlist) event.waitlist = [];
        event.waitlist.push({ user: userId });
        await event.save();
        return res.json({ msg: "Event is full. You've been added to the waitlist.", waitlisted: true });
      }
      return res.status(400).json({ msg: "Event is full and you're already on the waitlist" });
    }

    // Check if user is already registered
    const existingAttendee = event.attendees.find(a => a.user.toString() === userId.toString());
    const wasJoining = existingAttendee && existingAttendee.status === 'going';
    const isNowJoining = status === 'going';

    if (existingAttendee) {
      existingAttendee.status = status;
    } else {
      event.attendees.push({ user: userId, status });
    }

    await event.save();

    // Send notifications
    if (!wasJoining && isNowJoining) {
      const joiner = await User.findById(userId).select('username email');

      // User joined the event

      // Notify joiner with an in-app confirmation
      await Notification.createNotification({
        recipient: userId,
        sender: event.organizer._id,
        type: 'system',
        title: 'Event Registration Confirmed',
        message: `You joined "${event.title}" successfully.`,
        relatedEvent: event._id,
        actionUrl: `/events/${event._id}`
      });

      // Email joiner with registration confirmation
      await sendEventJoinConfirmationEmail({
        toEmail: joiner?.email,
        username: joiner?.username,
        event
      });
      
      // Notify organizer (but not if organizer is joining their own event)
      if (event.organizer._id.toString() !== userId.toString()) {
        await createEventJoinNotification(
          event._id,
          userId,
          event.organizer._id,
          event.title
        );
      }
      
      // Notify all existing participants (excluding the organizer and new joiner)
      const existingParticipants = event.attendees
        .filter(attendee => 
          attendee.status === 'going' && 
          attendee.user.toString() !== userId.toString() && 
          attendee.user.toString() !== event.organizer._id.toString()
        )
        .map(attendee => attendee.user);
      
      if (existingParticipants.length > 0) {
        await notifyParticipantsOfNewJoiner(
          event._id,
          userId,
          event.title,
          existingParticipants
        );
      }
      
    } else if (wasJoining && !isNowJoining && status === 'declined') {
      // User left the event
      
      // Notify organizer (but not if organizer is leaving their own event)
      if (event.organizer._id.toString() !== userId.toString()) {
        await createEventLeaveNotification(
          event._id,
          userId,
          event.organizer._id,
          event.title
        );
      }
      
      // Notify all remaining participants (excluding the organizer and leaver)
      const remainingParticipants = event.attendees
        .filter(attendee => 
          attendee.status === 'going' && 
          attendee.user.toString() !== userId.toString() && 
          attendee.user.toString() !== event.organizer._id.toString()
        )
        .map(attendee => attendee.user);
      
      if (remainingParticipants.length > 0) {
        await notifyParticipantsOfLeaver(
          event._id,
          userId,
          event.title,
          remainingParticipants
        );
      }
    }

    const populatedEvent = await Event.findById(event._id)
      .populate('attendees.user', 'username profileImage');

    res.json({ 
      msg: `Successfully ${status === 'going' ? 'registered for' : 'updated status for'} event`,
      event: populatedEvent 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UNJOIN EVENT (Remove user from event)
router.delete("/:eventId/attend", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const event = await Event.findById(req.params.eventId).populate('organizer', 'username');

    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    // Find and remove user from attendees
    const attendeeIndex = event.attendees.findIndex(a => a.user.toString() === userId.toString());
    
    if (attendeeIndex === -1) {
      return res.status(400).json({ msg: "You are not registered for this event" });
    }

    const wasGoing = event.attendees[attendeeIndex].status === 'going';
    event.attendees.splice(attendeeIndex, 1);
    await event.save();

    // Send notifications if user was actually attending
    if (wasGoing) {
      // Notify organizer (but not if organizer is leaving their own event)
      if (event.organizer._id.toString() !== userId.toString()) {
        await createEventLeaveNotification(
          event._id,
          userId,
          event.organizer._id,
          event.title
        );
      }
      
      // Notify all remaining participants (excluding the organizer and leaver)
      const remainingParticipants = event.attendees
        .filter(attendee => 
          attendee.status === 'going' && 
          attendee.user.toString() !== event.organizer._id.toString()
        )
        .map(attendee => attendee.user);
      
      if (remainingParticipants.length > 0) {
        await notifyParticipantsOfLeaver(
          event._id,
          userId,
          event.title,
          remainingParticipants
        );
      }
    }

    res.json({ msg: "Successfully left the event" });
  } catch (err) {
    console.error('Unjoin event error:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// SEND INVITATIONS
router.post("/:eventId/invite", async (req, res) => {
  try {
    const { userId, invitees } = req.body; // invitees: [{ email?, userId? }]
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    // Check if user is organizer
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({ msg: "Only organizers can send invitations" });
    }

    // Process invitations
    for (const invitee of invitees) {
      if (invitee.userId) {
        // Invite existing user
        const existingInvitation = event.invitations.find(i => 
          i.user && i.user.toString() === invitee.userId
        );
        if (!existingInvitation) {
          event.invitations.push({
            user: invitee.userId,
            status: 'sent'
          });
        }
      } else if (invitee.email) {
        // Invite by email
        const existingInvitation = event.invitations.find(i => i.email === invitee.email);
        if (!existingInvitation) {
          event.invitations.push({
            email: invitee.email,
            status: 'sent'
          });
        }
      }
    }

    await event.save();

    // TODO: Send actual email invitations here
    // This would integrate with your email service

    res.json({ msg: `Invitations sent to ${invitees.length} people` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET USER'S EVENTS (attending, organizing, invited)
router.get("/user/:userId", async (req, res) => {
  try {
    const { type = 'all' } = req.query; // attending, organizing, invited, all
    const userId = req.params.userId;

    let query = {};
    
    switch (type) {
      case 'organizing':
        query = { organizer: userId };
        break;
      case 'attending':
        query = {
          'attendees.user': userId,
          'attendees.status': 'going',
          $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }]
        };
        break;
      case 'invited':
        query = {
          'invitations.user': userId,
          'invitations.status': 'sent',
          $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }]
        };
        break;
      default:
        query = {
          $or: [
            { organizer: userId },
            { 'attendees.user': userId, approvalStatus: 'approved' },
            { 'attendees.user': userId, approvalStatus: { $exists: false } },
            { 'invitations.user': userId, approvalStatus: 'approved' },
            { 'invitations.user': userId, approvalStatus: { $exists: false } }
          ]
        };
    }

    const events = await Event.find(query)
      .populate('organizer', 'username profileImage')
      .populate('community', 'name coverImage')
      .sort({ startDate: 1 });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ADD FEEDBACK TO EVENT
router.post("/:eventId/feedback", async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    // Check if event has ended
    if (new Date() < event.endDate) {
      return res.status(400).json({ msg: "Cannot provide feedback until event has ended" });
    }

    // Check if user attended the event
    const attended = event.attendees.find(a => 
      a.user.toString() === userId && a.status === 'going'
    );

    if (!attended) {
      return res.status(400).json({ msg: "Only attendees can provide feedback" });
    }

    // Check if user already provided feedback
    const existingFeedback = event.feedback.find(f => f.user.toString() === userId);
    if (existingFeedback) {
      existingFeedback.rating = rating;
      existingFeedback.comment = comment;
    } else {
      event.feedback.push({ user: userId, rating, comment });
    }

    await event.save();
    res.json({ msg: "Feedback submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// CALENDAR & DISCOVERY ENDPOINTS
// ============================================================

// GET EVENTS FOR CALENDAR VIEW
router.get("/calendar/:userId", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.params.userId;

    const query = {
      $and: [
        {
          $or: [
            { organizer: userId },
            { 'attendees.user': userId, 'attendees.status': 'going' }
          ]
        },
        { status: 'published' },
        { $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] },
        { startDate: { $gte: new Date(startDate) } },
        { endDate: { $lte: new Date(endDate) } }
      ]
    };

    const events = await Event.find(query)
      .populate('organizer', 'username')
      .populate('community', 'name')
      .select('title startDate endDate eventType organizer community');

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DISCOVER EVENTS (recommendations)
router.get("/discover/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Get events based on user interests and communities
    let query = {
      status: 'published',
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
      startDate: { $gte: new Date() },
      // Exclude events user is already attending or organizing
      $and: [
        { organizer: { $ne: userId } },
        { 'attendees.user': { $ne: userId } }
      ]
    };

    // If user has interests, prioritize events with matching tags
    let events;
    if (user.interests && user.interests.length > 0) {
      events = await Event.find({
        ...query,
        tags: { $in: user.interests }
      })
      .populate('organizer', 'username profileImage')
      .populate('community', 'name coverImage')
      .limit(10)
      .sort({ startDate: 1 });

      // If not enough events found, get more general events
      if (events.length < 5) {
        const additionalEvents = await Event.find(query)
          .populate('organizer', 'username profileImage')
          .populate('community', 'name coverImage')
          .limit(10 - events.length)
          .sort({ startDate: 1 });
        
        events = [...events, ...additionalEvents];
      }
    } else {
      events = await Event.find(query)
        .populate('organizer', 'username profileImage')
        .populate('community', 'name coverImage')
        .limit(10)
        .sort({ startDate: 1 });
    }

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;