import { useCallback, useEffect, useState } from 'react';
import api from '../api/auth';
import { getAuthToken } from '../utils/tokenUtils';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};

const getConversationUnreadCount = (conversation, currentUserId) => {
  const unreadCounts = conversation?.unreadCounts || {};
  const rawCount =
    unreadCounts?.[currentUserId] ??
    unreadCounts?.get?.(currentUserId) ??
    0;
  return Number(rawCount) || 0;
};

export const useInbox = () => {
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const currentUserId = localStorage.getItem('userId') || '';

  const syncUnreadCount = useCallback((items) => {
    const nextCount = items.reduce(
      (total, conversation) => total + getConversationUnreadCount(conversation, currentUserId),
      0
    );
    setUnreadCount(nextCount);
  }, [currentUserId]);

  const fetchConversations = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setConversations([]);
      setUnreadCount(0);
      setLoading(false);
      return [];
    }

    try {
      const response = await api.get('/chat/conversations', { headers });
      const items = Array.isArray(response.data) ? response.data : [];
      setConversations(items);
      syncUnreadCount(items);
      return items;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
      setUnreadCount(0);
      return [];
    } finally {
      setLoading(false);
    }
  }, [syncUnreadCount]);

  const searchUsers = useCallback(async (search = '') => {
    const headers = getAuthHeaders();
    if (!headers) return [];

    try {
      const query = encodeURIComponent(search.trim());
      const response = await api.get(`/chat/users?search=${query}&limit=10`, { headers });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, []);

  const createDirectConversation = useCallback(async (targetUserId) => {
    const headers = getAuthHeaders();
    if (!headers || !targetUserId) return null;

    const response = await api.post(
      '/chat/conversations/direct',
      { targetUserId },
      { headers }
    );
    return response.data || null;
  }, []);

  const markConversationRead = useCallback(async (conversationId) => {
    const headers = getAuthHeaders();
    if (!headers || !conversationId) return;

    try {
      await api.put(`/chat/conversations/${conversationId}/read`, {}, { headers });
      setConversations((prev) => {
        const next = prev.map((conversation) => {
          if (conversation._id !== conversationId) return conversation;
          return {
            ...conversation,
            unreadCounts: {
              ...(conversation.unreadCounts || {}),
              [currentUserId]: 0,
            },
          };
        });
        syncUnreadCount(next);
        return next;
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [currentUserId, syncUnreadCount]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  return {
    conversations,
    setConversations,
    unreadCount,
    loading,
    fetchConversations,
    searchUsers,
    createDirectConversation,
    markConversationRead,
    getConversationUnreadCount: (conversation) => getConversationUnreadCount(conversation, currentUserId),
  };
};

export default useInbox;
