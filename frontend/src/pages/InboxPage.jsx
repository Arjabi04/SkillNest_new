import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../layouts/Sidebar';
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import { useChatSocket } from '../hooks/useChatSocket';
import { useInbox } from '../hooks/useInbox';

const getParticipantLabel = (participant) =>
  participant?.username || participant?.name || 'Unknown user';

const formatConversationDate = (value) => {
  if (!value) return '';

  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const InboxPage = () => {
  const { mainContentClass } = useSidebarLayout();
  const socket = useChatSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    conversations,
    setConversations,
    fetchConversations,
    searchUsers,
    createDirectConversation,
    markConversationRead,
    getConversationUnreadCount,
  } = useInbox();
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [composerQuery, setComposerQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const currentUserId = localStorage.getItem('userId') || '';
  const pendingConversationId = searchParams.get('conversationId') || '';
  const activeConversation =
    conversations.find((conversation) => conversation._id === activeConversationId) || null;

  const getOtherParticipant = (conversation) =>
    conversation?.participants?.find((participant) => participant._id !== currentUserId) ||
    conversation?.participants?.[0] ||
    null;

  const loadMessages = async (conversation) => {
    if (!conversation?._id) return;
    setIsLoadingMessages(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat/conversations/${conversation._id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
        await markConversationRead(conversation._id);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!conversations.length) {
      setActiveConversationId('');
      return;
    }

    if (pendingConversationId) {
      const matchingConversation = conversations.find(
        (conversation) => conversation._id === pendingConversationId
      );
      if (matchingConversation) {
        setActiveConversationId(matchingConversation._id);
        setSearchParams({}, { replace: true });
        return;
      }
    }

    if (!activeConversationId) {
      setActiveConversationId(conversations[0]._id);
      return;
    }

    const hasActiveConversation = conversations.some(
      (conversation) => conversation._id === activeConversationId
    );
    if (!hasActiveConversation) {
      setActiveConversationId(conversations[0]._id);
    }
  }, [activeConversationId, conversations, pendingConversationId, setSearchParams]);

  useEffect(() => {
    if (!activeConversation) return;

    loadMessages(activeConversation);

    if (socket) {
      socket.emit('chat:join_conversation', activeConversation._id);
    }

    return () => {
      if (socket) {
        socket.emit('chat:leave_conversation', activeConversation._id);
      }
    };
  }, [activeConversation?._id, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (message) => {
      const activeId = activeConversation?._id;
      if (activeId && message.conversationId === activeId) {
        setMessages((prev) => [...prev, message]);
        if (message?.sender?._id && message.sender._id !== currentUserId) {
          await markConversationRead(activeId);
        }
      }
    };

    const handleConversationUpdated = (data) => {
      setConversations((prev) => {
        const next = prev
          .map((conversation) => {
            if (conversation._id !== data.conversationId) return conversation;
            return {
              ...conversation,
              lastMessageText: data.lastMessageText,
              lastMessageAt: data.lastMessageAt,
              unreadCounts: {
                ...(conversation.unreadCounts || {}),
                [currentUserId]: data.unreadCount ?? getConversationUnreadCount(conversation),
              },
            };
          })
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        return next;
      });
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:conversation_updated', handleConversationUpdated);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:conversation_updated', handleConversationUpdated);
    };
  }, [activeConversation?._id, currentUserId, getConversationUnreadCount, markConversationRead, setConversations, socket]);

  useEffect(() => {
    if (!composerQuery.trim()) {
      setUserResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingUsers(true);
      const results = await searchUsers(composerQuery);
      setUserResults(results);
      setIsSearchingUsers(false);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [composerQuery, searchUsers]);

  const handleSelectConversation = (conversation) => {
    setActiveConversationId(conversation._id);
  };

  const handleStartDirectConversation = async (targetUserId) => {
    try {
      setIsCreatingConversation(true);
      const conversation = await createDirectConversation(targetUserId);
      if (!conversation?._id) return;

      const items = await fetchConversations();
      const matchingConversation = items.find((item) => item._id === conversation._id) || conversation;
      setActiveConversationId(matchingConversation._id);
      setComposerQuery('');
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      window.alert('Unable to start that conversation right now.');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!newMessage.trim() || !activeConversation || !socket) return;

    socket.emit('chat:send_message', {
      conversationId: activeConversation._id,
      text: newMessage.trim(),
    });

    setNewMessage('');
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />
      <div className={`flex h-screen overflow-hidden ${mainContentClass}`}>
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:flex-row">
          <aside className="flex h-full min-h-0 w-full flex-col border-b border-slate-200 bg-white lg:w-[380px] lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-5 pb-5 pt-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Messaging</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900">Inbox</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Marketplace chats and direct conversations live together here.
                  </p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {conversations.length} threads
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label htmlFor="new-chat-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Start a chat
                </label>
                <input
                  id="new-chat-search"
                  type="text"
                  value={composerQuery}
                  onChange={(event) => setComposerQuery(event.target.value)}
                  placeholder="Search people by username or bio"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                {composerQuery.trim() ? (
                  <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                    {isSearchingUsers ? (
                      <p className="text-sm text-slate-500">Searching people...</p>
                    ) : userResults.length > 0 ? (
                    userResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => handleStartDirectConversation(user._id)}
                        disabled={isCreatingConversation}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.username} className="h-full w-full object-cover" />
                          ) : (
                            user.username?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{user.username}</p>
                          <p className="truncate text-xs text-slate-500">{user.bio || 'Start a direct conversation'}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Message
                        </span>
                      </button>
                    ))
                    ) : (
                      <p className="text-sm text-slate-500">No matching users yet.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No conversations yet. Start one from a profile or search above.
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const unread = getConversationUnreadCount(conversation);
                  const isActive = activeConversation?._id === conversation._id;
                  const isMarketplace = conversation.type === 'marketplace';

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 px-5 py-4 text-left transition ${
                        isActive ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                      }`}
                      >
                      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                        {otherParticipant?.profilePicture ? (
                          <img src={otherParticipant.profilePicture} alt={getParticipantLabel(otherParticipant)} className="h-full w-full object-cover" />
                        ) : (
                          getParticipantLabel(otherParticipant).charAt(0).toUpperCase()
                        )}
                        {unread > 0 && (
                          <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-blue-600 px-1 text-[10px] font-bold text-white">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {getParticipantLabel(otherParticipant)}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  isMarketplace
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isMarketplace ? 'Marketplace' : 'Direct'}
                              </span>
                              {isMarketplace && conversation.product?.title && (
                                <span className="truncate text-xs text-amber-700">
                                  {conversation.product.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatConversationDate(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-sm text-slate-500">
                          {conversation.lastMessageText || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {activeConversation ? (
              <>
                <div className="border-b border-slate-200 bg-white px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-base font-bold text-slate-700">
                      {getOtherParticipant(activeConversation)?.profilePicture ? (
                        <img
                          src={getOtherParticipant(activeConversation).profilePicture}
                          alt={getParticipantLabel(getOtherParticipant(activeConversation))}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getParticipantLabel(getOtherParticipant(activeConversation)).charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">
                          {getParticipantLabel(getOtherParticipant(activeConversation))}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            activeConversation.type === 'marketplace'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {activeConversation.type === 'marketplace' ? 'Marketplace conversation' : 'Peer chat'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {activeConversation.type === 'marketplace' && activeConversation.product?.title
                          ? `About ${activeConversation.product.title}`
                          : 'Direct conversation between members'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 bg-slate-50 px-4 py-5 sm:px-6">
                  <div className="mx-auto flex h-full min-h-0 max-w-4xl flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                      {isLoadingMessages ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                          Loading conversation...
                        </div>
                      ) : messages.length > 0 ? (
                        messages.map((message) => {
                          const isMine = message.sender?._id === currentUserId;
                          return (
                            <div
                              key={message._id || `${message.createdAt}-${message.text}`}
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ${
                                  isMine
                                    ? 'rounded-br-md bg-blue-600 text-white'
                                    : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                                }`}
                              >
                                {!isMine && (
                                  <p className="mb-1 text-xs font-semibold text-slate-500">
                                    {getParticipantLabel(message.sender)}
                                  </p>
                                )}
                                <p className="text-sm leading-6">{message.text}</p>
                                <p className={`mt-2 text-[11px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
                          This conversation is open. Send the first message to get it moving.
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm">
                      <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                        <div className="flex-1">
                          <label htmlFor="message-input" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Message
                          </label>
                          <input
                            id="message-input"
                            type="text"
                            value={newMessage}
                            onChange={(event) => setNewMessage(event.target.value)}
                            placeholder={
                              activeConversation.type === 'marketplace'
                                ? 'Ask about the listing, delivery, or details'
                                : 'Write a message'
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center bg-slate-50 px-6">
                <div className="max-w-md rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">Select a conversation</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Pick a thread from the inbox, or search for another member to start a new direct chat.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
