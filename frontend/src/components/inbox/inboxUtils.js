export const getParticipantLabel = (participant) =>
    participant?.username || participant?.name || "Unknown user";

export const getOtherParticipant = (conversation, currentUserId) =>
    conversation?.participants?.find(
        (participant) => participant._id !== currentUserId,
    ) ||
    conversation?.participants?.[0] ||
    null;

export const formatConversationDate = (value) => {
    if (!value) return "";

    const date = new Date(value);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();

    if (sameDay) {
        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const formatMessageTime = (value) =>
    new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
