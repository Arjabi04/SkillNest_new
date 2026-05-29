import React from "react";
import {
    formatConversationDate,
    getOtherParticipant,
    getParticipantLabel,
} from "./inboxUtils";

const UserAvatar = ({ user, className = "h-10 w-10" }) => (
    <div
        className={`flex items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-600 ${className}`}>
        {user?.profileImage || user?.profilePicture ? (
            <img
                src={user.profileImage || user.profilePicture}
                alt={getParticipantLabel(user)}
                className="h-full w-full object-cover"
            />
        ) : (
            getParticipantLabel(user).charAt(0).toUpperCase()
        )}
    </div>
);

const UserSearchResults = ({
    composerQuery,
    userResults,
    isSearchingUsers,
    isCreatingConversation,
    onStartConversation,
}) => {
    if (!composerQuery.trim()) return null;

    return (
        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {isSearchingUsers ? (
                <p className="text-sm text-slate-500">Searching people...</p>
            ) : userResults.length > 0 ? (
                userResults.map((user) => (
                    <button
                        key={user._id}
                        type="button"
                        onClick={() => onStartConversation(user._id)}
                        disabled={isCreatingConversation}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
                        <UserAvatar user={user} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                                {user.username}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {user.bio || "Start a direct conversation"}
                            </p>
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
    );
};

const ConversationButton = ({
    conversation,
    currentUserId,
    isActive,
    unread,
    onSelect,
}) => {
    const otherParticipant = getOtherParticipant(conversation, currentUserId);
    const isMarketplace = conversation.type === "marketplace";

    return (
        <button
            type="button"
            onClick={() => onSelect(conversation)}
            className={`flex w-full items-start gap-3 border-b border-slate-100 px-5 py-4 text-left transition ${
                isActive ? "bg-blue-50" : "bg-white hover:bg-slate-50"
            }`}>
            <div className="relative">
                <UserAvatar
                    user={otherParticipant}
                    className="h-11 w-11 text-slate-700"
                />
                {unread > 0 && (
                    <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-blue-600 px-1 text-[10px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
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
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-slate-100 text-slate-700"
                                }`}>
                                {isMarketplace ? "Marketplace" : "Direct"}
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
                    {conversation.lastMessageText || "No messages yet"}
                </p>
            </div>
        </button>
    );
};

const InboxSidebar = ({
    conversations,
    activeConversation,
    currentUserId,
    composerQuery,
    setComposerQuery,
    userResults,
    isSearchingUsers,
    isCreatingConversation,
    getConversationUnreadCount,
    onSelectConversation,
    onStartConversation,
}) => (
    <aside className="flex h-full min-h-0 w-full flex-col border-b border-slate-200 bg-white lg:w-[380px] lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-200 px-5 pb-5 pt-6">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Messaging
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Inbox
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Marketplace chats and direct conversations live together
                        here.
                    </p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {conversations.length} threads
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label
                    htmlFor="new-chat-search"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
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
                <UserSearchResults
                    composerQuery={composerQuery}
                    userResults={userResults}
                    isSearchingUsers={isSearchingUsers}
                    isCreatingConversation={isCreatingConversation}
                    onStartConversation={onStartConversation}
                />
            </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                    No conversations yet. Start one from a profile or search
                    above.
                </div>
            ) : (
                conversations.map((conversation) => (
                    <ConversationButton
                        key={conversation._id}
                        conversation={conversation}
                        currentUserId={currentUserId}
                        isActive={activeConversation?._id === conversation._id}
                        unread={getConversationUnreadCount(conversation)}
                        onSelect={onSelectConversation}
                    />
                ))
            )}
        </div>
    </aside>
);

export default InboxSidebar;
