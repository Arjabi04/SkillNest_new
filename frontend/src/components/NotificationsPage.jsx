import React, { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import Sidebar from './Sidebar';
import useSidebarLayout from '../hooks/useSidebarLayout';
import { clearAuth } from '../utils/tokenUtils';
import { useNavigate } from 'react-router-dom';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { mainContentClass } = useSidebarLayout();
  
  const { 
    notifications = [], 
    unreadCount = 0, 
    loading = true, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications 
  } = useNotifications() || {};

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInMs = now - notifTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_join':
        return '👥';
      case 'event_leave':
        return '👋';
      case 'event_new_participant':
        return '🆕';
      case 'event_participant_left':
        return '📤';
      case 'event_deleted':
        return '🗑️';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
  };

  const handleDelete = async (notificationId, event) => {
    if (event) event.stopPropagation();
    if (!notificationId) return;
    if (window.confirm('Are you sure you want to delete this notification?')) {
      await deleteNotification(notificationId);
    }
  };

  const renderNotification = (notification) => {
    try {
      return (
        <div
          key={notification?._id || Math.random()}
          className={`notification-item ${!notification?.read ? 'unread' : ''}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification?.type)}
          </div>
          
          <div className="notification-content">
            <div className="notification-main">
              <div className="notification-message">
                {notification?.message || 'No message'}
              </div>
              <div className="notification-meta">
                <span className="notification-time">
                  {notification?.createdAt ? formatTimeAgo(notification.createdAt) : 'Unknown time'}
                </span>
                {!notification?.read && (
                  <span className="unread-badge">New</span>
                )}
              </div>
            </div>
            
            {notification?.relatedEvent && (
              <div className="notification-event">
                <div className="event-title">
                  <strong>📅 {notification.relatedEvent?.title || 'Event'}</strong>
                </div>
                <div className="event-details">
                  {notification?.relatedEvent?.startDate && (
                    <span className="event-date">
                      🗓️ {(() => {
                        try {
                          const date = new Date(notification.relatedEvent.startDate);
                          return date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch (error) {
                          return notification.relatedEvent.startDate;
                        }
                      })()}
                    </span>
                  )}
                  {notification?.relatedEvent?.location && (
                    <span className="event-location">
                      📍 {notification.relatedEvent.location}
                    </span>
                  )}
                  {notification?.relatedEvent?.eventType && (
                    <span className="event-type">
                      🎯 {notification.relatedEvent.eventType}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="delete-notification"
            onClick={(e) => handleDelete(notification?._id, e)}
            title="Delete notification"
          >
            ✕
          </button>
        </div>
      );
    } catch (error) {
      console.error('Error rendering notification:', error, notification);
      return (
        <div key={notification?._id || Math.random()} className="notification-item error">
          <div className="notification-icon">⚠️</div>
          <div className="notification-content">
            <div className="notification-message">
              Error displaying notification
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Left Sidebar */}
      <Sidebar 
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`flex-1 ${mainContentClass}`}>
        <div className="notifications-page">
          <div className="notifications-header">
            <h1>Notifications</h1>
            <div className="notifications-actions">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="btn btn-secondary mark-all-read"
                >
                  Mark All as Read ({unreadCount})
                </button>
              )}
            </div>
          </div>

          <div className="notifications-content">
            {!notifications || notifications.length === 0 ? (
              <div className="empty-notifications">
                <div className="empty-icon">🔔</div>
                <h3>No notifications yet</h3>
                <p>You'll see notifications here when users interact with your events.</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(renderNotification)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;