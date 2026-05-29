import React from "react";
import Sidebar from "../../layouts/Sidebar";
import PostComposer from "../PostComposer";
import defaultAvatar from "../../assets/default-avatar.jpg";
import defaultHeader from "../../assets/default-header.jpeg";
import { Settings, X } from "./CommunityIcons";
import CommunityPostCard from "./CommunityPostCard";
import {
    hasAdminOrModeratorAccess,
    isCommunityMember,
} from "../../utils/communityUtils";

const CommunityBanNotice = ({
    banEntry,
    appealDraft,
    appealSubmitting,
    onAppealDraftChange,
    onSubmitAppeal,
}) => (
    <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-black text-red-900">
            You are currently banned from this community
        </p>
        <p className="mt-2 text-sm text-red-800">
            {banEntry.reason ||
                "The community staff removed you from this community."}
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-700">
            {banEntry.banType === "temporary" && banEntry.expiresAt
                ? `Temporary ban until ${new Date(banEntry.expiresAt).toLocaleString()}`
                : "Permanent ban"}
        </p>
        <div className="mt-4 rounded-2xl border border-red-100 bg-white p-4">
            <p className="text-sm font-bold text-slate-900">Plead your case</p>
            <p className="mt-1 text-sm text-slate-500">
                Explain what happened and why you should be allowed back.
            </p>
            <textarea
                value={appealDraft}
                onChange={(e) => onAppealDraftChange(e.target.value)}
                rows={4}
                disabled={
                    banEntry.appealStatus === "pending" || appealSubmitting
                }
                placeholder="Write your appeal to the community staff..."
                className="mt-3 w-full rounded-xl border border-red-200 bg-white p-3 text-sm disabled:bg-slate-50"
            />
            {banEntry.appealStatus === "pending" && (
                <p className="mt-3 text-sm font-medium text-amber-700">
                    Your appeal is pending review.
                </p>
            )}
            {banEntry.appealStatus === "rejected" &&
                banEntry.appealReviewNote && (
                    <p className="mt-3 text-sm text-slate-600">
                        Last staff note: {banEntry.appealReviewNote}
                    </p>
                )}
            <button
                onClick={onSubmitAppeal}
                disabled={
                    appealSubmitting || banEntry.appealStatus === "pending"
                }
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                {appealSubmitting
                    ? "Submitting appeal..."
                    : banEntry.appealStatus === "rejected"
                      ? "Submit another appeal"
                      : "Submit appeal"}
            </button>
        </div>
    </div>
);

const CommunityDetailView = ({
    selectedCommunity,
    userId,
    showCommunityAdminPanel,
    showLogoutConfirm,
    setShowLogoutConfirm,
    onLogout,
    onBack,
    onOpenAdminPanel,
    currentUserBanEntry,
    appealDraft,
    setAppealDraft,
    appealSubmitting,
    onSubmitBanAppeal,
    onLeaveCommunity,
    onJoinCommunity,
    communityPosts,
    newPostText,
    setNewPostText,
    newPostImages,
    setNewPostImages,
    newPostTags,
    newPostPreviews,
    setNewPostPreviews,
    onRemoveTag,
    onCreatePost,
    expandedComments,
    newComment,
    showReportForm,
    reportFormData,
    reportActionLoading,
    onToggleComments,
    onCommentChange,
    onLikePost,
    onAddComment,
    onDeleteComment,
    onDeletePost,
    onToggleReport,
    onReportFieldChange,
    onCancelReport,
    onReportPost,
    adminDrawer,
}) => (
    <div className="min-h-screen bg-gray-50 font-sans flex">
        {!showCommunityAdminPanel && (
            <Sidebar
                showLogoutConfirm={showLogoutConfirm}
                setShowLogoutConfirm={setShowLogoutConfirm}
                onLogout={onLogout}
            />
        )}

        <div
            className={`flex-1 transition-all duration-300 flex justify-center px-4 py-8 ${
                showCommunityAdminPanel ? "lg:ml-0 xl:ml-0" : "lg:ml-16 xl:ml-64"
            }`}>
            <div className="w-full max-w-4xl space-y-6">
                <button
                    onClick={onBack}
                    className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    <X className="w-4 h-4" /> Back to List
                </button>

                <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                    <img
                        src={selectedCommunity.coverImage || defaultHeader}
                        className="w-full h-48 object-cover"
                        alt={selectedCommunity.coverImage ? "" : "Default header"}
                    />
                    <div className="p-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-black text-slate-950">
                                    {selectedCommunity.name}
                                </h1>
                                <p className="mt-2 text-slate-600">
                                    {selectedCommunity.description}
                                </p>
                                {selectedCommunity.rules && (
                                    <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 max-w-2xl">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Community Rules
                                        </p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {selectedCommunity.rules}
                                        </p>
                                    </div>
                                )}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {currentUserBanEntry ? (
                                        <CommunityBanNotice
                                            banEntry={currentUserBanEntry}
                                            appealDraft={appealDraft}
                                            appealSubmitting={appealSubmitting}
                                            onAppealDraftChange={setAppealDraft}
                                            onSubmitAppeal={onSubmitBanAppeal}
                                        />
                                    ) : isCommunityMember(
                                          selectedCommunity,
                                          userId,
                                      ) ? (
                                        <button
                                            onClick={() =>
                                                onLeaveCommunity(
                                                    selectedCommunity._id,
                                                )
                                            }
                                            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                                            Leave Community
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                onJoinCommunity(
                                                    selectedCommunity._id,
                                                    selectedCommunity,
                                                )
                                            }
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                                            Join Community
                                        </button>
                                    )}
                                </div>
                            </div>
                            {hasAdminOrModeratorAccess(
                                selectedCommunity,
                                userId,
                            ) && (
                                <button
                                    onClick={onOpenAdminPanel}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                    <Settings className="w-4 h-4" /> Manage
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {isCommunityMember(selectedCommunity, userId) && (
                        <PostComposer
                            avatarSrc={
                                selectedCommunity.currentUserImage ||
                                defaultAvatar
                            }
                            avatarAlt="Avatar"
                            text={newPostText}
                            onTextChange={setNewPostText}
                            rows={4}
                            previews={newPostPreviews}
                            onRemovePreview={(idx) => {
                                setNewPostImages((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                );
                                setNewPostPreviews((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                );
                            }}
                            maxImages={6}
                            tags={newPostTags}
                            onRemoveTag={onRemoveTag}
                            onImageSelect={(e) => {
                                const files = Array.from(e.target.files || []);
                                setNewPostImages(files.slice(0, 6));
                            }}
                            imageLabel="Photo"
                            onSubmit={onCreatePost}
                            submitDisabled={
                                !newPostText.trim() &&
                                newPostImages.length === 0
                            }
                            containerClassName="bg-white rounded-xl shadow-sm border border-gray-200"
                        />
                    )}

                    <div className="space-y-4">
                        {communityPosts.map((post) => (
                            <CommunityPostCard
                                key={post._id}
                                post={post}
                                selectedCommunity={selectedCommunity}
                                userId={userId}
                                isExpanded={Boolean(expandedComments[post._id])}
                                commentDraft={newComment[post._id] || ""}
                                reportOpen={Boolean(showReportForm[post._id])}
                                reportData={reportFormData[post._id] || {}}
                                reportLoading={Boolean(
                                    reportActionLoading[post._id],
                                )}
                                onLike={onLikePost}
                                onToggleComments={onToggleComments}
                                onCommentChange={onCommentChange}
                                onAddComment={onAddComment}
                                onDeleteComment={onDeleteComment}
                                onDeletePost={onDeletePost}
                                onToggleReport={onToggleReport}
                                onReportFieldChange={onReportFieldChange}
                                onCancelReport={onCancelReport}
                                onSubmitReport={onReportPost}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {adminDrawer}
    </div>
);

export default CommunityDetailView;
