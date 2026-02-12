import { Router } from "express";
const router = Router();
import auth from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// GET notifications for authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'username profileImage')
      .populate('relatedEvent', 'title startDate location eventType category')
      .populate('relatedCommunity', 'name coverImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      unreadCount
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET unread count only
router.get("/count", auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    
    res.json({ unreadCount });
  } catch (err) {
    console.error('Get notification count error:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// MARK notification as read
router.put("/:notificationId/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    await notification.markAsRead();
    res.json({ msg: "Notification marked as read" });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// MARK ALL notifications as read
router.put("/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ msg: "All notifications marked as read" });
  } catch (err) {
    console.error('Mark all notifications as read error:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE notification
router.delete("/:notificationId", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    res.json({ msg: "Notification deleted" });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ msg: "Server error" });
  }
});

// HELPER FUNCTION: Create event join notification
export const createEventJoinNotification = async (eventId, joinerUserId, eventOrganizerUserId, eventTitle) => {
  try {
    // Get user details for more personalized message
    const joinerUser = await User.findById(joinerUserId).select('username');
    const joinerName = joinerUser ? joinerUser.username : 'Someone';
    
    await Notification.createNotification({
      recipient: eventOrganizerUserId,
      sender: joinerUserId,
      type: 'event_join',
      title: '🎉 New Event Registration',
      message: `${joinerName} joined your event "${eventTitle}"`,
      relatedEvent: eventId,
      actionUrl: `/events/${eventId}`
    });
  } catch (err) {
    console.error('Error creating event join notification:', err);
  }
};

// HELPER FUNCTION: Create event leave notification  
export const createEventLeaveNotification = async (eventId, leaverUserId, eventOrganizerUserId, eventTitle) => {
  try {
    // Get user details for more personalized message
    const leaverUser = await User.findById(leaverUserId).select('username');
    const leaverName = leaverUser ? leaverUser.username : 'Someone';
    
    await Notification.createNotification({
      recipient: eventOrganizerUserId,
      sender: leaverUserId,
      type: 'event_leave',
      title: '👋 Event Registration Cancelled',
      message: `${leaverName} left your event "${eventTitle}"`,
      relatedEvent: eventId,
      actionUrl: `/events/${eventId}`
    });
  } catch (err) {
    console.error('Error creating event leave notification:', err);
  }
};

// HELPER FUNCTION: Notify all participants when someone joins
export const notifyParticipantsOfNewJoiner = async (eventId, joinerUserId, eventTitle, participantIds) => {
  try {
    const joinerUser = await User.findById(joinerUserId).select('username');
    const joinerName = joinerUser ? joinerUser.username : 'Someone';
    
    // Create notifications for all existing participants (excluding the joiner)
    const notificationPromises = participantIds
      .filter(participantId => participantId.toString() !== joinerUserId.toString())
      .map(participantId => 
        Notification.createNotification({
          recipient: participantId,
          sender: joinerUserId,
          type: 'event_new_participant',
          title: '👥 New Event Member',
          message: `${joinerName} joined "${eventTitle}"`,
          relatedEvent: eventId,
          actionUrl: `/events/${eventId}`
        })
      );
    
    await Promise.all(notificationPromises);
  } catch (err) {
    console.error('Error notifying participants of new joiner:', err);
  }
};

// HELPER FUNCTION: Notify all participants when someone leaves
export const notifyParticipantsOfLeaver = async (eventId, leaverUserId, eventTitle, participantIds) => {
  try {
    const leaverUser = await User.findById(leaverUserId).select('username');
    const leaverName = leaverUser ? leaverUser.username : 'Someone';
    
    // Create notifications for all remaining participants (excluding the leaver)
    const notificationPromises = participantIds
      .filter(participantId => participantId.toString() !== leaverUserId.toString())
      .map(participantId => 
        Notification.createNotification({
          recipient: participantId,
          sender: leaverUserId,
          type: 'event_participant_left',
          title: '👋 Member Left Event',
          message: `${leaverName} left "${eventTitle}"`,
          relatedEvent: eventId,
          actionUrl: `/events/${eventId}`
        })
      );
    
    await Promise.all(notificationPromises);
  } catch (err) {
    console.error('Error notifying participants of leaver:', err);
  }
};

export default router;