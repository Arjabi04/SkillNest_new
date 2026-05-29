import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../api/auth";
import { useChatSocket } from "./useChatSocket";
import { useInbox } from "./useInbox";
import { useSidebarLayout } from "./useSidebarLayout";

const useInboxPageController = () => {
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

    const [activeConversationId, setActiveConversationId] = useState("");
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [composerQuery, setComposerQuery] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [isCreatingConversation, setIsCreatingConversation] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const currentUserId = localStorage.getItem("userId") || "";
    const pendingConversationId = searchParams.get("conversationId") || "";

    const activeConversation = useMemo(
        () =>
            conversations.find(
                (conversation) => conversation._id === activeConversationId,
            ) || null,
        [activeConversationId, conversations],
    );

    const loadMessages = useCallback(
        async (conversationId) => {
            if (!conversationId) return;
            setIsLoadingMessages(true);

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${API_URL}/chat/conversations/${conversationId}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    },
                );

                if (response.ok) {
                    const data = await response.json();
                    setMessages(Array.isArray(data) ? data : []);
                    await markConversationRead(conversationId);
                } else {
                    setMessages([]);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
                setMessages([]);
            } finally {
                setIsLoadingMessages(false);
            }
        },
        [markConversationRead],
    );

    useEffect(() => {
        if (!conversations.length) {
            setActiveConversationId("");
            return;
        }

        if (pendingConversationId) {
            const matchingConversation = conversations.find(
                (conversation) => conversation._id === pendingConversationId,
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
            (conversation) => conversation._id === activeConversationId,
        );
        if (!hasActiveConversation) {
            setActiveConversationId(conversations[0]._id);
        }
    }, [
        activeConversationId,
        conversations,
        pendingConversationId,
        setSearchParams,
    ]);

    useEffect(() => {
        if (!activeConversationId) return;

        loadMessages(activeConversationId);

        if (socket) {
            socket.emit("chat:join_conversation", activeConversationId);
        }

        return () => {
            if (socket) {
                socket.emit("chat:leave_conversation", activeConversationId);
            }
        };
    }, [activeConversationId, loadMessages, socket]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = async (message) => {
            const activeId = activeConversationId;
            if (
                activeId &&
                String(message.conversationId) === String(activeId)
            ) {
                setMessages((prev) => {
                    if (
                        message?._id &&
                        prev.some((item) => item._id === message._id)
                    ) {
                        return prev;
                    }
                    return [...prev, message];
                });
                const senderId = message?.sender?._id || message?.sender;
                if (
                    senderId &&
                    String(senderId) !== String(currentUserId)
                ) {
                    await markConversationRead(activeId);
                }
            }
        };

        const handleConversationUpdated = (data) => {
            setConversations((prev) =>
                prev
                    .map((conversation) => {
                        if (conversation._id !== data.conversationId) {
                            return conversation;
                        }

                        return {
                            ...conversation,
                            lastMessageText: data.lastMessageText,
                            lastMessageAt: data.lastMessageAt,
                            unreadCounts: {
                                ...(conversation.unreadCounts || {}),
                                [currentUserId]:
                                    data.unreadCount ??
                                    getConversationUnreadCount(conversation),
                            },
                        };
                    })
                    .sort(
                        (a, b) =>
                            new Date(b.lastMessageAt) -
                            new Date(a.lastMessageAt),
                    ),
            );
        };

        socket.on("chat:new_message", handleNewMessage);
        socket.on("chat:conversation_updated", handleConversationUpdated);

        return () => {
            socket.off("chat:new_message", handleNewMessage);
            socket.off("chat:conversation_updated", handleConversationUpdated);
        };
    }, [
        activeConversationId,
        currentUserId,
        getConversationUnreadCount,
        markConversationRead,
        setConversations,
        socket,
    ]);

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

    const handleSelectConversation = useCallback((conversation) => {
        setActiveConversationId(conversation._id);
    }, []);

    const handleStartDirectConversation = useCallback(
        async (targetUserId) => {
            try {
                setIsCreatingConversation(true);
                const conversation =
                    await createDirectConversation(targetUserId);
                if (!conversation?._id) return;

                const items = await fetchConversations();
                const matchingConversation =
                    items.find((item) => item._id === conversation._id) ||
                    conversation;
                setActiveConversationId(matchingConversation._id);
                setComposerQuery("");
            } catch (error) {
                console.error("Error creating direct conversation:", error);
                window.alert("Unable to start that conversation right now.");
            } finally {
                setIsCreatingConversation(false);
            }
        },
        [createDirectConversation, fetchConversations],
    );

    const handleSendMessage = useCallback(
        (event) => {
            event.preventDefault();
            const text = newMessage.trim();
            if (!text || !activeConversation || !socket) return;

            if (!socket.connected) {
                socket.connect();
            }

            socket.timeout(5000).emit(
                "chat:send_message",
                {
                    conversationId: activeConversation._id,
                    text,
                },
                (error, response) => {
                    if (error || response?.ok === false) {
                        window.alert(
                            response?.message ||
                                "Message could not be sent. Please try again.",
                        );
                        return;
                    }

                    setNewMessage("");
                },
            );
        },
        [activeConversation, newMessage, socket],
    );

    return {
        mainContentClass,
        conversations,
        activeConversation,
        messages,
        newMessage,
        setNewMessage,
        composerQuery,
        setComposerQuery,
        userResults,
        isSearchingUsers,
        isCreatingConversation,
        isLoadingMessages,
        currentUserId,
        getConversationUnreadCount,
        handleSelectConversation,
        handleStartDirectConversation,
        handleSendMessage,
    };
};

export default useInboxPageController;
