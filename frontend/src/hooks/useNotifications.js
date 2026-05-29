import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../api/auth';

const normalizeNotifications = (rawData) => {
  if (Array.isArray(rawData)) {
    return rawData;
  }

  if (rawData && Array.isArray(rawData.notifications)) {
    return rawData.notifications;
  }

  if (rawData && typeof rawData === 'object' && rawData._id) {
    return [rawData];
  }

  return [];
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedNotifications = normalizeNotifications(data);
        setNotifications(normalizedNotifications);

        const normalizedUnreadCount = Number.isFinite(Number(data?.unreadCount))
          ? Number(data.unreadCount)
          : normalizedNotifications.filter((notification) => !notification?.read).length;
        setUnreadCount(normalizedUnreadCount);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prevCount => {
          const deletedNotification = notifications.find(
            (notification) => notification._id === notificationId
          );

          if (deletedNotification && !deletedNotification.read) {
            return Math.max(0, prevCount - 1);
          }

          return prevCount;
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};