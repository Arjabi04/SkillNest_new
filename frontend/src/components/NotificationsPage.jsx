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

  const safeNotifications = Array.isArray(notifications)
    ? notifications.filter(Boolean)
    : [];

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  useEffect(() => {
    if (typeof fetchNotifications === 'function') {
      fetchNotifications();
    }
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
      const relatedEvent = notification?.relatedEvent;
      const eventLocation = (() => {
        if (!relatedEvent?.location) return null;
        if (typeof relatedEvent.location === 'string') return relatedEvent.location;
        if (typeof relatedEvent.location === 'object') {
          return relatedEvent.location.venue || relatedEvent.location.address || relatedEvent.location.city || null;
        }
        return null;
      })();

      const eventType = (() => {
        if (!relatedEvent?.eventType) return null;
        if (typeof relatedEvent.eventType === 'string') return relatedEvent.eventType;
        return null;
      })();

      return (
        <div
          key={notification?._id || Math.random()}
          className={`flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-all relative hover:bg-slate-100 hover:border-blue-500 ${!notification?.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="text-2xl shrink-0 mt-0.5">
            {getNotificationIcon(notification?.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2 gap-4 max-md:flex-col max-md:items-start">
              <div className="text-base text-slate-800 leading-6 flex-1 mr-4">
                {notification?.message || 'No message'}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 max-md:flex-row max-md:items-center max-md:gap-2.5">
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {notification?.createdAt ? formatTimeAgo(notification.createdAt) : 'Unknown time'}
                </span>
                {!notification?.read && (
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[11px] font-medium">New</span>
                )}
              </div>
            </div>
            
            {relatedEvent && (
              <div className="text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg mt-2.5">
                <div className="text-slate-800 mb-2 text-sm font-semibold">
                  <strong>📅 {relatedEvent?.title || 'Event'}</strong>
                </div>
                <div className="flex flex-col gap-1 text-slate-600 text-xs">
                  {relatedEvent?.startDate && (
                    <span className="font-medium text-blue-600 flex items-center gap-1.5">
                      🗓️ {(() => {
                        try {
                          const date = new Date(relatedEvent.startDate);
                          return date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch (error) {
                          return relatedEvent.startDate;
                        }
                      })()}
                    </span>
                  )}
                  {eventLocation && (
                    <span className="flex items-center gap-1.5">
                      📍 {eventLocation}
                    </span>
                  )}
                  {eventType && (
                    <span className="flex items-center gap-1.5">
                      🎯 {eventType}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-red-100 hover:text-red-600 transition-all"
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
        <div key={notification?._id || Math.random()} className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg relative">
          <div className="text-2xl shrink-0 mt-0.5">⚠️</div>
          <div className="flex-1 min-w-0">
            <div className="text-base text-red-600 italic leading-6">
              Error displaying notification
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="px-5 max-w-[800px] mx-auto bg-transparent min-h-[300px] flex flex-col items-center justify-center text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p>Loading notifications...</p>
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
        <div className="px-5 py-5 max-w-[800px] mx-auto bg-transparent">
          <div className="flex justify-between items-center mb-7.5 pb-5 border-b-2 border-slate-200 max-md:flex-col max-md:items-start max-md:gap-4">
            <h1 className="text-slate-800 m-0 text-[2rem] font-semibold max-md:text-[1.75rem]">Notifications</h1>
            <div className="flex gap-2.5">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="bg-blue-600 text-white border-none px-4 py-2 rounded-md text-sm cursor-pointer transition-colors hover:bg-blue-700"
                >
                  Mark All as Read ({unreadCount})
                </button>
              )}
            </div>
          </div>

          <div className="notifications-content">
            {safeNotifications.length === 0 ? (
              <div className="text-center py-16 px-5 text-slate-500">
                <div className="text-[4rem] mb-5 opacity-50">🔔</div>
                <h3 className="text-slate-800 mb-2.5 text-2xl">No notifications yet</h3>
                <p className="text-base leading-6">You'll see notifications here when users interact with your events.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {safeNotifications.map(renderNotification)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;