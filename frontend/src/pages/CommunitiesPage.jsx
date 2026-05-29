import React from "react";
import AdminDashboardModal from "../components/community/AdminDashboardModal";
import BanAppealModal from "../components/community/BanAppealModal";
import CommunitiesListView from "../components/community/CommunitiesListView";
import CommunityAdminDrawer from "../components/community/CommunityAdminDrawer";
import CommunityDetailView from "../components/community/CommunityDetailView";
import CreateCommunityModal from "../components/community/CreateCommunityModal";
import useCommunitiesPageController from "../hooks/useCommunitiesPageController";

const CommunitiesPage = () => {
    const controller = useCommunitiesPageController();

    const {
        mainContentClass,
        userId,
        loading,
        showLogoutConfirm,
        setShowLogoutConfirm,
        isAdmin,
        pendingRequests,
        recommendedCommunities,
        categorizedCommunities,
        selectedCommunity,
        showCommunityAdminPanel,
        setShowCommunityAdminPanel,
        currentUserBanEntry,
        appealDraft,
        setAppealDraft,
        appealSubmitting,
        communityPosts,
        newPostText,
        setNewPostText,
        newPostImages,
        setNewPostImages,
        newPostTags,
        newPostPreviews,
        setNewPostPreviews,
        expandedComments,
        newComment,
        showReportForm,
        reportFormData,
        reportActionLoading,
        showCreateModal,
        setShowCreateModal,
        communityInterests,
        setCommunityInterests,
        showAdminDashboard,
        setShowAdminDashboard,
        banAppealModal,
        banAppealDraft,
        setBanAppealDraft,
        banAppealSubmitting,
        reportedPosts,
        reportedPostsError,
        loadingReportedPosts,
        communityMembers,
        pendingAppeals,
        reviewData,
        appealReviewLoading,
        showBanForm,
        banData,
        communityRulesDraft,
        setCommunityRulesDraft,
        newCommunityCoverImage,
        setNewCommunityCoverImage,
        updatingCommunityImage,
        savingCommunityRules,
        handleLogout,
        handleViewCommunity,
        handleJoinCommunity,
        handleCreateCommunity,
        handleApproveCommunity,
        handleRejectCommunity,
        handleApproveDeletion,
        handleRejectDeletion,
        closeBanAppealModal,
        handleSubmitBanAppealFromModal,
        handleBackToList,
        openCommunityAdminPanel,
        handleSubmitBanAppeal,
        handleLeaveCommunity,
        removeTag,
        handleCreatePost,
        handleToggleComments,
        handleCommentChange,
        handleLikePost,
        handleAddComment,
        handleDeleteComment,
        handleDeletePost,
        handleToggleReport,
        handleReportFieldChange,
        handleCancelReport,
        handleReportPost,
        loadReportedPosts,
        handleReviewDataChange,
        handleReviewReportedPost,
        handleUpdateCommunityImage,
        handleUpdateCommunityRules,
        handleAddMember,
        handleRemoveMember,
        handlePromoteModerator,
        handleDemoteModerator,
        handleToggleBanForm,
        handleBanDataChange,
        handleBanUser,
        handleReviewBanAppeal,
        handleUnbanUser,
        handleRequestDeletion,
    } = controller;

    const adminDrawer =
        showCommunityAdminPanel && selectedCommunity ? (
            <CommunityAdminDrawer
                selectedCommunity={selectedCommunity}
                userId={userId}
                reportedPosts={reportedPosts}
                reportedPostsError={reportedPostsError}
                loadingReportedPosts={loadingReportedPosts}
                communityMembers={communityMembers}
                pendingAppeals={pendingAppeals}
                reviewData={reviewData}
                reportActionLoading={reportActionLoading}
                appealReviewLoading={appealReviewLoading}
                showBanForm={showBanForm}
                banData={banData}
                communityRulesDraft={communityRulesDraft}
                setCommunityRulesDraft={setCommunityRulesDraft}
                newCommunityCoverImage={newCommunityCoverImage}
                setNewCommunityCoverImage={setNewCommunityCoverImage}
                updatingCommunityImage={updatingCommunityImage}
                savingCommunityRules={savingCommunityRules}
                onClose={() => setShowCommunityAdminPanel(false)}
                onRefreshReports={() => loadReportedPosts(selectedCommunity._id)}
                onReviewDataChange={handleReviewDataChange}
                onReviewReportedPost={handleReviewReportedPost}
                onUpdateCommunityImage={handleUpdateCommunityImage}
                onUpdateCommunityRules={handleUpdateCommunityRules}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onPromoteModerator={handlePromoteModerator}
                onDemoteModerator={handleDemoteModerator}
                onToggleBanForm={handleToggleBanForm}
                onBanDataChange={handleBanDataChange}
                onBanUser={handleBanUser}
                onReviewBanAppeal={handleReviewBanAppeal}
                onUnbanUser={handleUnbanUser}
                onRequestDeletion={handleRequestDeletion}
            />
        ) : null;

    if (selectedCommunity) {
        return (
            <CommunityDetailView
                selectedCommunity={selectedCommunity}
                userId={userId}
                showCommunityAdminPanel={showCommunityAdminPanel}
                showLogoutConfirm={showLogoutConfirm}
                setShowLogoutConfirm={setShowLogoutConfirm}
                onLogout={handleLogout}
                onBack={handleBackToList}
                onOpenAdminPanel={openCommunityAdminPanel}
                currentUserBanEntry={currentUserBanEntry}
                appealDraft={appealDraft}
                setAppealDraft={setAppealDraft}
                appealSubmitting={appealSubmitting}
                onSubmitBanAppeal={handleSubmitBanAppeal}
                onLeaveCommunity={handleLeaveCommunity}
                onJoinCommunity={handleJoinCommunity}
                communityPosts={communityPosts}
                newPostText={newPostText}
                setNewPostText={setNewPostText}
                newPostImages={newPostImages}
                setNewPostImages={setNewPostImages}
                newPostTags={newPostTags}
                newPostPreviews={newPostPreviews}
                setNewPostPreviews={setNewPostPreviews}
                onRemoveTag={removeTag}
                onCreatePost={handleCreatePost}
                expandedComments={expandedComments}
                newComment={newComment}
                showReportForm={showReportForm}
                reportFormData={reportFormData}
                reportActionLoading={reportActionLoading}
                onToggleComments={handleToggleComments}
                onCommentChange={handleCommentChange}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onDeletePost={handleDeletePost}
                onToggleReport={handleToggleReport}
                onReportFieldChange={handleReportFieldChange}
                onCancelReport={handleCancelReport}
                onReportPost={handleReportPost}
                adminDrawer={adminDrawer}
            />
        );
    }

    return (
        <>
            <CommunitiesListView
                loading={loading}
                mainContentClass={mainContentClass}
                showLogoutConfirm={showLogoutConfirm}
                setShowLogoutConfirm={setShowLogoutConfirm}
                onLogout={handleLogout}
                isAdmin={isAdmin}
                pendingRequests={pendingRequests}
                recommendedCommunities={recommendedCommunities}
                categorizedCommunities={categorizedCommunities}
                userId={userId}
                onViewCommunity={handleViewCommunity}
                onJoinCommunity={handleJoinCommunity}
                onOpenAdminDashboard={() => setShowAdminDashboard(true)}
                onOpenCreateCommunity={() => setShowCreateModal(true)}
            />

            <CreateCommunityModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateCommunity}
                communityInterests={communityInterests}
                setCommunityInterests={setCommunityInterests}
                loading={loading}
            />

            <AdminDashboardModal
                show={showAdminDashboard}
                onClose={() => setShowAdminDashboard(false)}
                pendingRequests={pendingRequests}
                onApproveCommunity={handleApproveCommunity}
                onRejectCommunity={handleRejectCommunity}
                onApproveDeletion={handleApproveDeletion}
                onRejectDeletion={handleRejectDeletion}
            />

            <BanAppealModal
                open={banAppealModal.open}
                modal={banAppealModal}
                draft={banAppealDraft}
                submitting={banAppealSubmitting}
                onDraftChange={setBanAppealDraft}
                onClose={closeBanAppealModal}
                onSubmit={handleSubmitBanAppealFromModal}
            />
        </>
    );
};

export default CommunitiesPage;
