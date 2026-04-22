import React, { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import Sidebar from './Sidebar';
import useSidebarLayout from '../hooks/useSidebarLayout';
import { clearAuth } from '../utils/tokenUtils';
import { useNavigate } from 'react-router-dom';

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
    const cls = 'w-5 h-5';
    switch (type) {
      case 'event_join':
      case 'event_new_participant':
        return (
          <svg className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
        );
      case 'event_leave':
      case 'event_participant_left':
        return (
          <svg className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
          </svg>
        );
      case 'event_deleted':
        return (
          <svg className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
          </svg>
        );
      case 'community_approved':
        return (
          <svg className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
          </svg>
        );
      case 'community_post_report':
        return (
          <svg className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 5v14M5 5c5 0 5 2 10 2 1.667 0 2.5-.222 4-1v8c-1.5.778-2.333 1-4 1-5 0-5-2-10-2' />
          </svg>
        );
      case 'community_ban':
        return (
          <svg className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' />
          </svg>
        );
      default:
        return (
          <svg className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
          </svg>
        );
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
                  <strong>{relatedEvent?.title || 'Event'}</strong>
                </div>
                <div className="flex flex-col gap-1 text-slate-600 text-xs">
                  {relatedEvent?.startDate && (
                    <span className="font-medium text-blue-600 flex items-center gap-1.5">
                      {(() => {
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
                      {eventLocation}
                    </span>
                  )}
                  {eventType && (
                    <span className="flex items-center gap-1.5">
                      {eventType}
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
      <div className="min-h-screen bg-slate-50 font-sans flex">
        <Sidebar 
          showLogoutConfirm={showLogoutConfirm}
          setShowLogoutConfirm={setShowLogoutConfirm}
          onLogout={handleLogout}
        />
        <main className={`flex-1 ${mainContentClass}`}>
          <div className="w-full max-w-300 mx-auto px-6 py-8">
            <div className="max-w-4xl min-h-75 flex flex-col items-center justify-center text-slate-500">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p>Loading notifications...</p>
            </div>
          </div>
        </main>
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
        <div className="w-full max-w-300 mx-auto px-6 py-8">
          <div className="max-w-4xl">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-slate-500">Activity</p>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
                <h1 className="text-4xl font-black tracking-tight text-slate-950">Notifications</h1>
              </div>
              <p className="mt-3 max-w-2xl text-slate-600">
                Stay updated on events, community activities, and user interactions.
              </p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mark All as Read ({unreadCount})
              </button>
            )}
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
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;