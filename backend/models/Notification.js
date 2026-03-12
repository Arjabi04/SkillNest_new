import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'event_join',
      'event_leave', 
      'event_invitation',
      'event_reminder',
      'event_starting',
      'event_updated',
      'event_cancelled',
      'community_join',
      'community_post_report',
      'community_ban',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  relatedCommunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community', 
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }); // For cleanup of old notifications

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  return await this.create({
    recipient: data.recipient,
    sender: data.sender,
    type: data.type,
    title: data.title,
    message: data.message,
    relatedEvent: data.relatedEvent || null,
    relatedCommunity: data.relatedCommunity || null,
    actionUrl: data.actionUrl || null,
    metadata: data.metadata || {}
  });
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return await this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;