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
          className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all relative border ${
            !notification?.read
              ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500'
              : 'bg-white border-slate-200 hover:border-slate-300'
          } hover:shadow-md`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            !notification?.read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
          }`}>
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
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-0.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{relatedEvent?.title || 'Event'}</span>
                {relatedEvent?.startDate && (
                  <span className="text-blue-600">{(() => {
                    try {
                      return new Date(relatedEvent.startDate).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      });
                    } catch { return relatedEvent.startDate; }
                  })()}</span>
                )}
                {eventLocation && <span>{eventLocation}</span>}
              </div>
            )}
          </div>

          <button
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
            onClick={(e) => handleDelete(notification?._id, e)}
            title="Delete notification"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
        <div className="px-6 py-8 max-w-3xl mx-auto">
          {/* Page Header */}
          <header className="mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-blue-600 rounded-full" />
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">Notifications</h1>
              </div>
              <p className="text-slate-500 text-sm ml-5">
                {unreadCount > 0 ? (
                  <span className="font-medium text-blue-600">{unreadCount} unread</span>
                ) : (
                  'All caught up'
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Mark all as read
              </button>
            )}
          </header>

          {safeNotifications.length === 0 ? (
            <div className="text-center py-20 px-5">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No notifications yet</h3>
              <p className="text-slate-500 text-sm">You'll see activity here when people interact with your content.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {safeNotifications.map(renderNotification)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;