import React from "react";
import {
    formatMessageTime,
    getOtherParticipant,
    getParticipantLabel,
} from "./inboxUtils";

const Avatar = ({ participant }) => (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-base font-bold text-slate-700">
        {participant?.profileImage || participant?.profilePicture ? (
            <img
                src={participant.profileImage || participant.profilePicture}
                alt={getParticipantLabel(participant)}
                className="h-full w-full object-cover"
            />
        ) : (
            getParticipantLabel(participant).charAt(0).toUpperCase()
        )}
    </div>
);

const ConversationHeader = ({ conversation, currentUserId }) => {
    const otherParticipant = getOtherParticipant(conversation, currentUserId);
    const isMarketplace = conversation.type === "marketplace";

    return (
        <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex items-center gap-3">
                <Avatar participant={otherParticipant} />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">
                            {getParticipantLabel(otherParticipant)}
                        </h2>
                        <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                isMarketplace
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                            }`}>
                            {isMarketplace
                                ? "Marketplace conversation"
                                : "Peer chat"}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        {isMarketplace && conversation.product?.title
                            ? `About ${conversation.product.title}`
                            : "Direct conversation between members"}
                    </p>
                </div>
            </div>
        </div>
    );
};

const MessageBubble = ({ message, currentUserId }) => {
    const senderId = message.sender?._id || message.sender;
    const isMine = String(senderId) === String(currentUserId);

    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ${
                    isMine
                        ? "rounded-br-md bg-blue-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                }`}>
                {!isMine && (
                    <p className="mb-1 text-xs font-semibold text-slate-500">
                        {getParticipantLabel(message.sender)}
                    </p>
                )}
                <p className="text-sm leading-6">{message.text}</p>
                <p
                    className={`mt-2 text-[11px] ${
                        isMine ? "text-blue-100" : "text-slate-400"
                    }`}>
                    {formatMessageTime(message.createdAt)}
                </p>
            </div>
        </div>
    );
};

const ConversationPane = ({
    activeConversation,
    currentUserId,
    messages,
    isLoadingMessages,
    newMessage,
    setNewMessage,
    onSendMessage,
}) => {
    if (!activeConversation) {
        return (
            <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 items-center justify-center bg-slate-50 px-6">
                    <div className="max-w-md rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900">
                            Select a conversation
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Pick a thread from the inbox, or search for another
                            member to start a new direct chat.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <ConversationHeader
                conversation={activeConversation}
                currentUserId={currentUserId}
            />

            <div className="min-h-0 flex-1 bg-slate-50 px-4 py-5 sm:px-6">
                <div className="mx-auto flex h-full min-h-0 max-w-4xl flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                        {isLoadingMessages ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                                Loading conversation...
                            </div>
                        ) : messages.length > 0 ? (
                            messages.map((message) => (
                                <MessageBubble
                                    key={
                                        message._id ||
                                        `${message.createdAt}-${message.text}`
                                    }
                                    message={message}
                                    currentUserId={currentUserId}
                                />
                            ))
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
                                This conversation is open. Send the first message
                                to get it moving.
                            </div>
                        )}
                    </div>

                    <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm">
                        <form onSubmit={onSendMessage} className="flex items-end gap-3">
                            <div className="flex-1">
                                <label
                                    htmlFor="message-input"
                                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Message
                                </label>
                                <input
                                    id="message-input"
                                    type="text"
                                    value={newMessage}
                                    onChange={(event) =>
                                        setNewMessage(event.target.value)
                                    }
                                    placeholder={
                                        activeConversation.type === "marketplace"
                                            ? "Ask about the listing, delivery, or details"
                                            : "Write a message"
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ConversationPane;
