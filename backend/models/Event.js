import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null // Can be null for personal events
  },
  eventType: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    required: true,
    default: 'online'
  },
  category: {
    type: String,
    enum: ['workshop', 'seminar', 'networking', 'conference', 'meetup', 'social', 'training', 'other'],
    default: 'other'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  location: {
    // For offline events
    venue: { type: String },
    address: { type: String },
    city: { type: String },
    country: { type: String },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  onlineDetails: {
    // For online events
    platform: { type: String }, // Zoom, Teams, Google Meet, etc.
    meetingLink: { type: String },
    meetingId: { type: String },
    password: { type: String }
  },
  capacity: {
    type: Number,
    default: null // null means unlimited
  },
  price: {
    type: Number,
    default: 0 // 0 means free
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  approvalReviewedAt: {
    type: Date,
    default: null
  },
  approvalReviewedBy: {
    type: String,
    default: null
  },
  visibility: {
    type: String,
    enum: ['public', 'community', 'private', 'invite-only'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true
  }],
  coverImage: {
    type: String,
    default: null
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'invited', 'declined'],
      default: 'invited'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  invitations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String, // For inviting non-users
    status: {
      type: String,
      enum: ['sent', 'accepted', 'declined', 'pending'],
      default: 'pending'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms'],
      default: 'email'
    },
    timeBeforeEvent: {
      type: Number, // minutes before event
      default: 60 // 1 hour before
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  agenda: [{
    time: String,
    title: String,
    description: String,
    speaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  requirements: {
    type: String,
    maxlength: 1000
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'image'],
      default: 'link'
    }
  }],
  allowRegistration: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date,
    default: null
  },
  waitlist: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    interval: Number, // Every X days/weeks/months/years
    endDate: Date,
    occurrences: Number // Alternative to endDate
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ startDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ community: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ tags: 1 });

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.filter(a => a.status === 'going').length;
});

// Virtual for availability
eventSchema.virtual('spotsAvailable').get(function() {
  if (!this.capacity) return null;
  return this.capacity - this.attendeeCount;
});

export default mongoose.model('Event', eventSchema);