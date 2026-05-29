import React from "react";
import ConversationPane from "../components/inbox/ConversationPane";
import InboxSidebar from "../components/inbox/InboxSidebar";
import Sidebar from "../layouts/Sidebar";
import useInboxPageController from "../hooks/useInboxPageController";

const InboxPage = () => {
    const {
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
    } = useInboxPageController();

    return (
        <div className="h-screen overflow-hidden bg-slate-50 font-sans">
            <Sidebar />
            <div className={`flex h-screen overflow-hidden ${mainContentClass}`}>
                <div className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:flex-row">
                    <InboxSidebar
                        conversations={conversations}
                        activeConversation={activeConversation}
                        currentUserId={currentUserId}
                        composerQuery={composerQuery}
                        setComposerQuery={setComposerQuery}
                        userResults={userResults}
                        isSearchingUsers={isSearchingUsers}
                        isCreatingConversation={isCreatingConversation}
                        getConversationUnreadCount={getConversationUnreadCount}
                        onSelectConversation={handleSelectConversation}
                        onStartConversation={handleStartDirectConversation}
                    />

                    <ConversationPane
                        activeConversation={activeConversation}
                        currentUserId={currentUserId}
                        messages={messages}
                        isLoadingMessages={isLoadingMessages}
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        onSendMessage={handleSendMessage}
                    />
                </div>
            </div>
        </div>
    );
};

export default InboxPage;
