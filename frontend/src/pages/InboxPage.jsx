import React, { useState, useEffect } from 'react';
import Sidebar from "../layouts/Sidebar";
import { useSidebarLayout } from '../hooks/useSidebarLayout';
import { useChatSocket } from '../hooks/useChatSocket';
import api from '../api/auth';
import { getAuthToken } from '../utils/tokenUtils';

const InboxPage = () => {
    const { isCollapsed, toggleSidebar } = useSidebarLayout();
    const socket = useChatSocket();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const currentUserId = localStorage.getItem('userId') || '';

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const response = await api.get('/chat/conversations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setConversations(response.data);
                if (response.data.length > 0) {
                    setActiveConversation(response.data[0]);
                }
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        };
        fetchConversations();
    }, []);

    // Fetch messages when active conversation changes
    useEffect(() => {
         if (!activeConversation) return;

         const fetchMessages = async () => {
              try {
                  const token = getAuthToken();
                  if (!token) return;
                  const response = await api.get(`/chat/conversations/${activeConversation._id}/messages`, {
                      headers: { Authorization: `Bearer ${token}` }
                  });
                  setMessages(response.data);
              } catch (error) {
                  console.error('Error fetching messages:', error);
              }
         };

         fetchMessages();

         if (socket) {
             socket.emit('chat:join_conversation', activeConversation._id);
         }

         return () => {
             if (socket && activeConversation) {
                 socket.emit('chat:leave_conversation', activeConversation._id);
             }
         }
    }, [activeConversation, socket]);

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;

        socket.on('chat:new_message', (message) => {
             if (activeConversation && message.conversationId === activeConversation._id) {
                 setMessages(prev => [...prev, message]);
             }
        });
        
        socket.on('chat:conversation_updated', (data) => {
             setConversations(prev => prev.map(c => 
                 c._id === data.conversationId ? { ...c, lastMessageText: data.lastMessageText, lastMessageAt: data.lastMessageAt } : c
             ).sort((a,b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
        });

        return () => {
             socket.off('chat:new_message');
             socket.off('chat:conversation_updated');
        };
    }, [socket, activeConversation]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !socket) return;

        socket.emit('chat:send_message', {
            conversationId: activeConversation._id,
            text: newMessage
        });

        // Optimistic UI update could be added here
        setNewMessage('');
    };

    const getOtherParticipant = (convo) => {
        return convo.participants.find(p => p._id !== currentUserId) || convo.participants[0];
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
            <div className={`flex flex-1 overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Conversation List */}
                <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inbox</h2>
                    </div>
                    <div>
                        {conversations.map(convo => {
                            const otherUser = getOtherParticipant(convo);
                            return (
                                <div 
                                    key={convo._id}
                                    onClick={() => setActiveConversation(convo)}
                                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 ${activeConversation?._id === convo._id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                                        {otherUser.profilePicture ? (
                                             <img src={otherUser.profilePicture} alt={otherUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                             otherUser.name?.charAt(0).toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-baseline">
                                             <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{otherUser.name}</h3>
                                             <span className="text-xs text-gray-500">{new Date(convo.lastMessageAt).toLocaleDateString()}</span>
                                         </div>
                                         {convo.type === 'marketplace' && convo.product && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate mb-0.5">
                                                Item: {convo.product.title}
                                            </p>
                                         )}
                                         <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                             {convo.lastMessageText || 'No messages yet'}
                                         </p>
                                    </div>
                                </div>
                            )
                        })}
                        {conversations.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No conversations found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3 shadow-sm z-10">
                                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                                      {getOtherParticipant(activeConversation).profilePicture ? (
                                            <img src={getOtherParticipant(activeConversation).profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                      ) : (
                                            getOtherParticipant(activeConversation).name?.charAt(0).toUpperCase() || 'U'
                                      )}
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-gray-900 dark:text-white">{getOtherParticipant(activeConversation).name}</h3>
                                     {activeConversation.type === 'marketplace' && activeConversation.product && (
                                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                              Regarding: {activeConversation.product.title}
                                          </p>
                                     )}
                                 </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, idx) => {
                                    const isMine = msg.sender._id === currentUserId;
                                    return (
                                        <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                                isMine 
                                                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm shadow-sm'
                                            }`}>
                                                <p className="text-sm">{msg.text}</p>
                                                <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {messages.length === 0 && (
                                     <div className="text-center text-gray-500 mt-8">
                                         Say hello to start the conversation!
                                     </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
                             <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                 <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                             </div>
                             <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InboxPage;
