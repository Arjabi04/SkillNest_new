import React, { useState } from "react";
import defaultAvatar from "../../assets/default-avatar.jpg";
import {
    Ban,
    Crown,
    Shield,
    UserMinus,
    X,
} from "./CommunityIcons";
import { isCommunityAdmin } from "../../utils/communityUtils";

const memberIdFrom = (member) =>
    typeof member === "string" ? member : member?._id;

const ReportedPostCard = ({
    post,
    reviewData,
    reportLoading,
    onReviewDataChange,
    onReviewReportedPost,
}) => {
    const data = reviewData[post._id] || {};
    const update = (patch) => onReviewDataChange(post._id, patch);

    return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-black text-slate-900">
                        {post.user?.username || "Unknown User"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Posted {new Date(post.createdAt).toLocaleString()}
                    </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-900">
                    {post.reports?.length || 0} report
                    {post.reports?.length === 1 ? "" : "s"}
                </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Reported content
                </p>
                {post.text ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                        {post.text}
                    </p>
                ) : (
                    <p className="mt-3 text-sm italic text-slate-400">
                        No text caption on this post.
                    </p>
                )}
                {post.image && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <img
                            src={post.image}
                            alt="Reported post"
                            className="max-h-80 w-full object-contain"
                        />
                    </div>
                )}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 rounded-2xl border border-amber-100 bg-white/90 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
                    Reports received
                </p>
                <div className="mt-3 space-y-3">
                    {post.reports?.map((report) => (
                        <div
                            key={report._id}
                            className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 text-sm text-slate-700">
                            <p className="font-bold text-slate-900">
                                {report.reporter?.username || "Member"} reported
                                this for {report.reason}
                            </p>
                            {report.details ? (
                                <p className="mt-1 text-sm text-slate-600">
                                    {report.details}
                                </p>
                            ) : (
                                <p className="mt-1 text-sm italic text-slate-400">
                                    No extra details provided.
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/70 p-4">
                <p className="text-sm font-bold text-slate-900">
                    Moderation note
                </p>
                <p className="mt-1 text-sm text-slate-500">
                    Delete post is default. Tick the option below if you also
                    want to ban the author.
                </p>

                <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                        type="checkbox"
                        checked={Boolean(data.banAuthor)}
                        onChange={(e) =>
                            update({ banAuthor: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    Tick to ban author after deleting this post
                </label>

                {Boolean(data.banAuthor) && (
                    <div className="mt-4">
                        <label className="mb-1 block text-xs font-medium text-slate-700">
                            Ban Type
                        </label>
                        <select
                            value={data.banType || "permanent"}
                            onChange={(e) => update({ banType: e.target.value })}
                            className="w-full rounded-xl border border-red-200 bg-white p-2 text-sm">
                            <option value="temporary">Temporary</option>
                            <option value="permanent">Permanent</option>
                        </select>
                    </div>
                )}

                {Boolean(data.banAuthor) &&
                    (data.banType || "permanent") === "temporary" && (
                        <div className="mt-4">
                            <label className="mb-1 block text-xs font-medium text-slate-700">
                                Expires At
                            </label>
                            <input
                                type="datetime-local"
                                value={data.expiresAt || ""}
                                onChange={(e) =>
                                    update({ expiresAt: e.target.value })
                                }
                                className="w-full rounded-xl border border-red-200 bg-white p-2 text-sm"
                            />
                        </div>
                    )}

                <textarea
                    value={data.note || ""}
                    onChange={(e) => update({ note: e.target.value })}
                    rows={3}
                    placeholder="Add reason (required for delete or ban)."
                    className="mt-4 w-full rounded-2xl border border-red-200 bg-white p-3 text-sm"
                />
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    onClick={() => onReviewReportedPost(post._id, "dismiss")}
                    disabled={Boolean(reportLoading)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Not an issue
                </button>
                <button
                    onClick={() => onReviewReportedPost(post._id, "delete")}
                    disabled={Boolean(reportLoading)}
                    className="flex-1 rounded-2xl bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                    {reportLoading
                        ? "Reviewing..."
                        : data.banAuthor
                          ? "Delete post + ban author"
                          : "Delete post"}
                </button>
            </div>
        </div>
    );
};

const CommunitySettingsSection = ({
    communityRulesDraft,
    setCommunityRulesDraft,
    newCommunityCoverImage,
    setNewCommunityCoverImage,
    updatingCommunityImage,
    savingCommunityRules,
    onUpdateCommunityImage,
    onUpdateCommunityRules,
}) => (
    <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-900">
            Community Settings
        </h3>
        <p className="mt-1 text-sm text-slate-500">
            Update the cover image and rules without leaving moderation mode.
        </p>
        <div className="mt-5 space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Change Cover Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                        setNewCommunityCoverImage(e.target.files?.[0] || null)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                    onClick={onUpdateCommunityImage}
                    disabled={!newCommunityCoverImage || updatingCommunityImage}
                    className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {updatingCommunityImage
                        ? "Updating image..."
                        : "Update Cover Image"}
                </button>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Community Rules
                </label>
                <textarea
                    value={communityRulesDraft}
                    onChange={(e) => setCommunityRulesDraft(e.target.value)}
                    rows={5}
                    placeholder="Write rules for members..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                    onClick={onUpdateCommunityRules}
                    disabled={savingCommunityRules}
                    className="mt-2 w-full px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed">
                    {savingCommunityRules ? "Saving rules..." : "Save Rules"}
                </button>
            </div>
        </div>
    </section>
);

const MemberRow = ({
    member,
    selectedCommunity,
    userId,
    moderators,
    showBanForm,
    banData,
    onToggleBanForm,
    onBanDataChange,
    onBanUser,
    onRemoveMember,
    onPromoteModerator,
    onDemoteModerator,
}) => {
    const isModerator = moderators?.some(
        (mod) => memberIdFrom(mod) === member._id,
    );

    return (
        <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <img
                        src={member.profileImage || defaultAvatar}
                        className="w-10 h-10 rounded-full border"
                        alt=""
                    />
                    <span className="font-bold text-sm text-gray-900">
                        {member.username}
                    </span>
                </div>
                <div className="flex gap-2">
                    {isCommunityAdmin(selectedCommunity, userId) && (
                        <button
                            onClick={() =>
                                isModerator
                                    ? onDemoteModerator(member._id)
                                    : onPromoteModerator(member._id)
                            }
                            className={`p-2 rounded-lg ${
                                isModerator
                                    ? "hover:bg-yellow-100 text-yellow-600"
                                    : "hover:bg-blue-100 text-blue-600"
                            }`}
                            title={
                                isModerator
                                    ? "Demote from Moderator"
                                    : "Promote to Moderator"
                            }>
                            <Crown className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onToggleBanForm(member._id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg">
                        <Ban className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onRemoveMember(member._id)}
                        className="p-2 hover:bg-gray-200 text-gray-500 rounded-lg">
                        <UserMinus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showBanForm[member._id] && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-red-50">
                    <div className="pt-3 space-y-3">
                        <h4 className="font-bold text-sm text-red-700">
                            Ban {member.username}
                        </h4>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Ban Type
                            </label>
                            <select
                                value={banData[member._id]?.banType || "permanent"}
                                onChange={(e) =>
                                    onBanDataChange(member._id, {
                                        banType: e.target.value,
                                    })
                                }
                                className="w-full p-2 text-sm border border-gray-300 rounded">
                                <option value="temporary">Temporary</option>
                                <option value="permanent">Permanent</option>
                            </select>
                        </div>

                        {banData[member._id]?.banType === "temporary" && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Expires At
                                </label>
                                <input
                                    type="datetime-local"
                                    value={banData[member._id]?.expiresAt || ""}
                                    onChange={(e) =>
                                        onBanDataChange(member._id, {
                                            expiresAt: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 text-sm border border-gray-300 rounded"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Reason
                            </label>
                            <textarea
                                value={banData[member._id]?.reason || ""}
                                onChange={(e) =>
                                    onBanDataChange(member._id, {
                                        reason: e.target.value,
                                    })
                                }
                                className="w-full p-2 text-sm border border-gray-300 rounded"
                                placeholder="Reason for ban..."
                                rows="2"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => onToggleBanForm(member._id, false)}
                                className="flex-1 px-3 py-2 bg-gray-400 text-white rounded text-sm font-medium hover:bg-gray-500">
                                Cancel
                            </button>
                            <button
                                onClick={() => onBanUser(member._id)}
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700">
                                Ban User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const BanAppeals = ({
    pendingAppeals,
    reviewData,
    appealReviewLoading,
    onReviewDataChange,
    onReviewBanAppeal,
    onUnbanUser,
}) => (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
            <div>
                <h4 className="text-sm font-black text-slate-900">
                    Ban Appeals
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                    Banned users can plead their case here. Approving an appeal
                    restores them to the community.
                </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                {pendingAppeals.length} pending
            </span>
        </div>

        <div className="mt-4 space-y-4">
            {pendingAppeals.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    No pending appeals right now.
                </div>
            ) : (
                pendingAppeals.map((banEntry) => {
                    const bannedUser = banEntry.user;
                    const bannedUserId = memberIdFrom(bannedUser);
                    const appealKey = `appeal-${bannedUserId}`;
                    return (
                        <div
                            key={bannedUserId}
                            className="rounded-2xl border border-amber-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={
                                            bannedUser?.profileImage ||
                                            defaultAvatar
                                        }
                                        className="h-10 w-10 rounded-full border"
                                        alt=""
                                    />
                                    <div>
                                        <p className="text-sm font-black text-slate-900">
                                            {bannedUser?.username ||
                                                "Unknown User"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {banEntry.banType === "temporary" &&
                                            banEntry.expiresAt
                                                ? `Temporary ban until ${new Date(banEntry.expiresAt).toLocaleString()}`
                                                : "Permanent ban"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onUnbanUser(bannedUserId)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                    Unban directly
                                </button>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Appeal message
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                    {banEntry.appealMessage}
                                </p>
                            </div>

                            <textarea
                                value={reviewData[appealKey]?.note || ""}
                                onChange={(e) =>
                                    onReviewDataChange(appealKey, {
                                        note: e.target.value,
                                    })
                                }
                                rows={3}
                                placeholder="Optional note for the banned user"
                                className="mt-4 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                            />

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() =>
                                        onReviewBanAppeal(bannedUserId, "reject")
                                    }
                                    disabled={Boolean(
                                        appealReviewLoading[bannedUserId],
                                    )}
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                    Reject appeal
                                </button>
                                <button
                                    onClick={() =>
                                        onReviewBanAppeal(bannedUserId, "approve")
                                    }
                                    disabled={Boolean(
                                        appealReviewLoading[bannedUserId],
                                    )}
                                    className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                    {appealReviewLoading[bannedUserId]
                                        ? "Reviewing..."
                                        : "Approve and restore"}
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
);

const MembersSection = ({
    selectedCommunity,
    userId,
    communityMembers,
    pendingAppeals,
    reviewData,
    appealReviewLoading,
    showBanForm,
    banData,
    onReviewDataChange,
    onAddMember,
    onRemoveMember,
    onPromoteModerator,
    onDemoteModerator,
    onToggleBanForm,
    onBanDataChange,
    onBanUser,
    onReviewBanAppeal,
    onUnbanUser,
    onRequestDeletion,
}) => {
    const [memberName, setMemberName] = useState("");

    const submitMember = () => {
        const trimmed = memberName.trim();
        onAddMember(trimmed);
        setMemberName("");
    };

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Members</h3>
            <p className="mt-1 text-sm text-slate-500">
                Promote, ban, or remove members from the community.
            </p>
            {isCommunityAdmin(selectedCommunity, userId) && (
                <div className="mb-6 mt-5 p-4 bg-blue-50 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">
                        Add Member
                    </h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter Username"
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                            onClick={submitMember}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                            Add
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {communityMembers.members?.map((member) => (
                    <MemberRow
                        key={member._id}
                        member={member}
                        selectedCommunity={selectedCommunity}
                        userId={userId}
                        moderators={communityMembers.moderators}
                        showBanForm={showBanForm}
                        banData={banData}
                        onToggleBanForm={onToggleBanForm}
                        onBanDataChange={onBanDataChange}
                        onBanUser={onBanUser}
                        onRemoveMember={onRemoveMember}
                        onPromoteModerator={onPromoteModerator}
                        onDemoteModerator={onDemoteModerator}
                    />
                ))}
            </div>

            <BanAppeals
                pendingAppeals={pendingAppeals}
                reviewData={reviewData}
                appealReviewLoading={appealReviewLoading}
                onReviewDataChange={onReviewDataChange}
                onReviewBanAppeal={onReviewBanAppeal}
                onUnbanUser={onUnbanUser}
            />

            {isCommunityAdmin(selectedCommunity, userId) && (
                <button
                    onClick={() => onRequestDeletion(selectedCommunity._id)}
                    className="mt-6 w-full px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                    Request Community Deletion
                </button>
            )}
        </section>
    );
};

const CommunityAdminDrawer = ({
    selectedCommunity,
    userId,
    reportedPosts,
    reportedPostsError,
    loadingReportedPosts,
    communityMembers,
    pendingAppeals,
    reviewData,
    reportActionLoading,
    appealReviewLoading,
    showBanForm,
    banData,
    communityRulesDraft,
    setCommunityRulesDraft,
    newCommunityCoverImage,
    setNewCommunityCoverImage,
    updatingCommunityImage,
    savingCommunityRules,
    onClose,
    onRefreshReports,
    onReviewDataChange,
    onReviewReportedPost,
    onUpdateCommunityImage,
    onUpdateCommunityRules,
    onAddMember,
    onRemoveMember,
    onPromoteModerator,
    onDemoteModerator,
    onToggleBanForm,
    onBanDataChange,
    onBanUser,
    onReviewBanAppeal,
    onUnbanUser,
    onRequestDeletion,
}) => {
    if (!selectedCommunity) return null;

    const openReportCount = reportedPosts.reduce(
        (total, post) => total + (post.reports?.length || 0),
        0,
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative h-full w-full max-w-2xl overflow-hidden border-l border-slate-200 bg-slate-50 shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="border-b border-slate-200 bg-white px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">
                                Manage Community
                            </p>
                            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-900">
                                <Shield className="w-6 h-6 text-blue-600" />{" "}
                                {selectedCommunity.name}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Review reports first, then adjust settings or
                                member access.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                            {openReportCount} open reports
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {reportedPosts.length} reported posts
                        </div>
                        <button
                            onClick={onRefreshReports}
                            disabled={loadingReportedPosts}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50">
                            {loadingReportedPosts
                                ? "Refreshing..."
                                : "Refresh reports"}
                        </button>
                    </div>
                </div>

                <div className="h-[calc(100vh-122px)] overflow-y-auto px-6 py-6">
                    <section className="mb-8 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Reported Posts
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Each card shows the reported content, the
                                    reason, and controls to dismiss, delete, or
                                    ban.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {reportedPostsError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {reportedPostsError}
                                </div>
                            ) : loadingReportedPosts ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                    Loading reports...
                                </div>
                            ) : reportedPosts.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                    No reported posts right now.
                                </div>
                            ) : (
                                reportedPosts.map((post) => (
                                    <ReportedPostCard
                                        key={post._id}
                                        post={post}
                                        reviewData={reviewData}
                                        reportLoading={Boolean(
                                            reportActionLoading[post._id],
                                        )}
                                        onReviewDataChange={onReviewDataChange}
                                        onReviewReportedPost={
                                            onReviewReportedPost
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    <CommunitySettingsSection
                        communityRulesDraft={communityRulesDraft}
                        setCommunityRulesDraft={setCommunityRulesDraft}
                        newCommunityCoverImage={newCommunityCoverImage}
                        setNewCommunityCoverImage={setNewCommunityCoverImage}
                        updatingCommunityImage={updatingCommunityImage}
                        savingCommunityRules={savingCommunityRules}
                        onUpdateCommunityImage={onUpdateCommunityImage}
                        onUpdateCommunityRules={onUpdateCommunityRules}
                    />

                    <MembersSection
                        selectedCommunity={selectedCommunity}
                        userId={userId}
                        communityMembers={communityMembers}
                        pendingAppeals={pendingAppeals}
                        reviewData={reviewData}
                        appealReviewLoading={appealReviewLoading}
                        showBanForm={showBanForm}
                        banData={banData}
                        onReviewDataChange={onReviewDataChange}
                        onAddMember={onAddMember}
                        onRemoveMember={onRemoveMember}
                        onPromoteModerator={onPromoteModerator}
                        onDemoteModerator={onDemoteModerator}
                        onToggleBanForm={onToggleBanForm}
                        onBanDataChange={onBanDataChange}
                        onBanUser={onBanUser}
                        onReviewBanAppeal={onReviewBanAppeal}
                        onUnbanUser={onUnbanUser}
                        onRequestDeletion={onRequestDeletion}
                    />
                </div>
            </div>
        </div>
    );
};

export default CommunityAdminDrawer;
