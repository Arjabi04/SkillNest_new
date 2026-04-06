import React, { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, addMinutes, differenceInMinutes } from 'date-fns';
import { BellRing as Bell, Calendar, Clock, X, Check, Settings } from 'lucide-react';

// Notification types
const NOTIFICATION_TYPES = {
  EVENT_REMINDER: 'event_reminder',
  EVENT_STARTING: 'event_starting',
  EVENT_INVITATION: 'event_invitation',
  CALENDAR_SYNC: 'calendar_sync',
  SYSTEM: 'system'
};

// Placeholder notifications
const placeholderNotifications = [
  {
    id: '1',
    type: NOTIFICATION_TYPES.EVENT_REMINDER,
    title: 'Event Reminder',
    message: 'Web Development Workshop starts in 1 hour',
    eventId: '1',
    eventTitle: 'Web Development Workshop',
    eventStartTime: new Date(Date.now() + 3600000), // 1 hour from now
    isRead: false,
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
    actions: [
      { label: 'Join Event', action: 'join', primary: true },
      { label: 'Remind Later', action: 'snooze' }
    ]
  },
  {
    id: '2',
    type: NOTIFICATION_TYPES.EVENT_STARTING,
    title: 'Event Starting Soon',
    message: 'AI/ML Networking Event starts in 15 minutes',
    eventId: '2',
    eventTitle: 'AI/ML Networking Event',
    eventStartTime: new Date(Date.now() + 900000), // 15 minutes from now
    isRead: false,
    createdAt: new Date(Date.now() - 60000), // 1 minute ago
    actions: [
      { label: 'View Location', action: 'location', primary: true },
      { label: 'Dismiss', action: 'dismiss' }
    ]
  },
  {
    id: '3',
    type: NOTIFICATION_TYPES.EVENT_INVITATION,
    title: 'Event Invitation',
    message: 'You\'ve been invited to Design Systems Masterclass',
    eventId: '3',
    eventTitle: 'Design Systems Masterclass',
    eventStartTime: new Date(Date.now() + 172800000), // 2 days from now
    isRead: true,
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    actions: [
      { label: 'Accept', action: 'accept', primary: true },
      { label: 'Decline', action: 'decline' }
    ]
  }
];

const NotificationCenter = ({ className = "", onNotificationAction }) => {
  const [notifications, setNotifications] = useState(placeholderNotifications);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: true,
    pushNotifications: true,
    reminderTiming: {
      '1_hour': true,
      '15_minutes': true,
      '5_minutes': false
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  // Auto-refresh notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would fetch new notifications from the server
      console.log('Checking for new notifications...');
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const handleNotificationAction = (notificationId, action, eventId) => {
    console.log(`Action ${action} for notification ${notificationId}, event ${eventId}`);
    
    // Mark notification as read when action is taken
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );

    // Handle different actions
    switch (action) {
      case 'join':
        // Navigate to event or open meeting link
        onNotificationAction?.('join', eventId);
        break;
      case 'snooze':
        // Reschedule reminder for later
        handleSnoozeNotification(notificationId);
        break;
      case 'location':
        // Show event location details
        onNotificationAction?.('location', eventId);
        break;
      case 'accept':
        // Accept event invitation
        onNotificationAction?.('accept', eventId);
        removeNotification(notificationId);
        break;
      case 'decline':
        // Decline event invitation
        onNotificationAction?.('decline', eventId);
        removeNotification(notificationId);
        break;
      case 'dismiss':
        // Simply remove notification
        removeNotification(notificationId);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleSnoozeNotification = (notificationId) => {
    // Remove current notification and create a new one for later
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (!notification) return prev;

      // Create new notification for 15 minutes later
      const snoozeTime = addMinutes(new Date(), 15);
      const newNotification = {
        ...notification,
        id: `${notificationId}_snooze_${Date.now()}`,
        message: `${notification.message} (Snoozed)`,
        createdAt: snoozeTime,
        isRead: false
      };

      return prev
        .filter(n => n.id !== notificationId)
        .concat(newNotification);
    });
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.EVENT_REMINDER:
      case NOTIFICATION_TYPES.EVENT_STARTING:
        return <Clock className="w-5 h-5 text-blue-500" />;
      case NOTIFICATION_TYPES.EVENT_INVITATION:
        return <Calendar className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.CALENDAR_SYNC:
        return <Calendar className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTimeDisplay = (date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isTomorrow(date)) {
      return `Tomorrow ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const getTimeUntilEvent = (eventTime) => {
    const now = new Date();
    const minutes = differenceInMinutes(eventTime, now);
    
    if (minutes <= 0) return 'Starting now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-6 h-6 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <p className="text-sm text-slate-500">
              {unreadCount} unread
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h4 className="font-medium text-slate-900 mb-3">Notification Settings</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notificationSettings.emailReminders}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  emailReminders: e.target.checked
                }))}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Email reminders</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  pushNotifications: e.target.checked
                }))}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Push notifications</span>
            </label>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Reminder timing:</p>
              <div className="space-y-2">
                {Object.entries(notificationSettings.reminderTiming).map(([key, enabled]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        reminderTiming: {
                          ...prev.reminderTiming,
                          [key]: e.target.checked
                        }
                      }))}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-600">
                      {key.replace('_', ' ')} before
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.eventStartTime && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>
                              {getTimeDisplay(notification.eventStartTime)} 
                              {' • '}
                              {getTimeUntilEvent(notification.eventStartTime)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">
                          {getTimeDisplay(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                          >
                            <Check className="w-3 h-3 text-slate-500" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {notification.actions.map((actionBtn, index) => (
                          <button
                            key={index}
                            onClick={() => handleNotificationAction(
                              notification.id, 
                              actionBtn.action, 
                              notification.eventId
                            )}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                              actionBtn.primary 
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {actionBtn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 text-center">
          💡 <strong>Coming Soon:</strong> Calendar sync, SMS reminders, and advanced notification scheduling
        </p>
      </div>
    </div>
  );
};

export default NotificationCenter;