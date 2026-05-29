import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSidebarLayout from "./useSidebarLayout";
import { API_URL } from "../api/auth";
import { clearAuth } from "../utils/tokenUtils";
import {
    categorizeCommunitiesByStatus,
    hasAdminOrModeratorAccess,
} from "../utils/communityUtils";

const getActiveBanEntry = (community, targetUserId) => {
    if (!community?.bannedUsers || !targetUserId) return null;

    return (
        community.bannedUsers.find((banEntry) => {
            const bannedUserId =
                typeof banEntry.user === "string"
                    ? banEntry.user
                    : banEntry.user?._id;
            if (bannedUserId !== targetUserId) return false;
            if (banEntry.banType === "permanent") return true;

            return Boolean(
                banEntry.banType === "temporary" &&
                    banEntry.expiresAt &&
                    new Date(banEntry.expiresAt) > new Date(),
            );
        }) || null
    );
};

const defaultBanData = {
    banType: "permanent",
    reason: "",
    expiresAt: "",
};

const useCommunitiesPageController = () => {
    const navigate = useNavigate();
    const { mainContentClass } = useSidebarLayout();

    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId") || localStorage.getItem("userId");
    const adminToken = localStorage.getItem("adminToken");
    const API_BASE = API_URL;

    const [communities, setCommunities] = useState([]);
    const [recommendedCommunities, setRecommendedCommunities] = useState([]);
    const [pendingRequests, setPendingRequests] = useState({
        pendingCreations: [],
        pendingDeletions: [],
    });
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [communityMembers, setCommunityMembers] = useState({
        members: [],
        admins: [],
        moderators: [],
        bannedUsers: [],
    });
    const [communityPosts, setCommunityPosts] = useState([]);
    const [newPostText, setNewPostText] = useState("");
    const [newPostImages, setNewPostImages] = useState([]);
    const [newPostTags, setNewPostTags] = useState([]);
    const [newPostPreviews, setNewPostPreviews] = useState([]);
    const [communityInterests, setCommunityInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [showCommunityAdminPanel, setShowCommunityAdminPanel] =
        useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showBanForm, setShowBanForm] = useState({});
    const [banData, setBanData] = useState({});
    const [expandedComments, setExpandedComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [communityRulesDraft, setCommunityRulesDraft] = useState("");
    const [newCommunityCoverImage, setNewCommunityCoverImage] = useState(null);
    const [updatingCommunityImage, setUpdatingCommunityImage] = useState(false);
    const [savingCommunityRules, setSavingCommunityRules] = useState(false);
    const [reportedPosts, setReportedPosts] = useState([]);
    const [loadingReportedPosts, setLoadingReportedPosts] = useState(false);
    const [reportedPostsError, setReportedPostsError] = useState("");
    const [showReportForm, setShowReportForm] = useState({});
    const [reportFormData, setReportFormData] = useState({});
    const [reviewData, setReviewData] = useState({});
    const [reportActionLoading, setReportActionLoading] = useState({});
    const [appealDraft, setAppealDraft] = useState("");
    const [appealSubmitting, setAppealSubmitting] = useState(false);
    const [appealReviewLoading, setAppealReviewLoading] = useState({});
    const [banAppealModal, setBanAppealModal] = useState({
        open: false,
        community: null,
        banEntry: null,
    });
    const [banAppealDraft, setBanAppealDraft] = useState("");
    const [banAppealSubmitting, setBanAppealSubmitting] = useState(false);

    const handleLogout = useCallback(() => {
        clearAuth();
        navigate("/login");
    }, [navigate]);

    const loadRecommendedCommunities = useCallback(
        async (fallbackCommunities = []) => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${API_BASE}/recommendations/communities?limit=12`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    },
                );

                if (!res.ok) {
                    setRecommendedCommunities([]);
                    return;
                }

                const data = await res.json();
                const recommendations = Array.isArray(data?.recommendations)
                    ? data.recommendations
                    : [];

                if (recommendations.length > 0) {
                    setRecommendedCommunities(recommendations);
                    return;
                }

                const categorized = categorizeCommunitiesByStatus(
                    fallbackCommunities,
                    userId,
                );
                setRecommendedCommunities(categorized.recommended || []);
            } catch (err) {
                console.error("Error loading recommended communities:", err);
                const categorized = categorizeCommunitiesByStatus(
                    fallbackCommunities,
                    userId,
                );
                setRecommendedCommunities(categorized.recommended || []);
            }
        },
        [API_BASE, userId],
    );

    const loadCommunities = useCallback(async () => {
        try {
            setLoading(true);
            const adminParam = isAdmin ? "&admin=true" : "";
            const res = await fetch(
                `${API_BASE}/communities?userId=${userId}${adminParam}`,
            );
            const data = await res.json();
            if (res.ok) {
                setCommunities(data);
                await loadRecommendedCommunities(data);
            } else {
                console.error("Failed to load communities:", data);
            }
        } catch (err) {
            console.error("Error loading communities:", err);
        } finally {
            setLoading(false);
        }
    }, [API_BASE, isAdmin, loadRecommendedCommunities, userId]);

    const checkAdminStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/verify-admin`, {
                headers: { "x-admin-token": adminToken || "" },
            });
            const data = await res.json();
            setIsAdmin(data.isAdmin || false);
        } catch (err) {
            console.error("Error:", err);
        }
    }, [API_BASE, adminToken]);

    const loadPendingRequests = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/communities/pending/all`, {
                headers: { "x-admin-token": adminToken || "" },
            });
            const data = await res.json();
            if (res.ok) setPendingRequests(data);
        } catch (err) {
            console.error("Error:", err);
        }
    }, [API_BASE, adminToken]);

    const loadCommunityDetails = useCallback(
        async (communityId) => {
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${communityId}/members?userId=${userId}`,
                );
                const data = await res.json();
                if (res.ok) setCommunityMembers(data);
            } catch (err) {
                console.error("Error:", err);
            }
        },
        [API_BASE, userId],
    );

    const loadCommunityPosts = useCallback(
        async (communityId) => {
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${communityId}/posts`,
                );
                const data = await res.json();
                if (res.ok) setCommunityPosts(data);
            } catch (err) {
                console.error("Error:", err);
            }
        },
        [API_BASE],
    );

    const loadReportedPosts = useCallback(
        async (communityId) => {
            try {
                setLoadingReportedPosts(true);
                setReportedPostsError("");
                const res = await fetch(
                    `${API_BASE}/communities/${communityId}/reported-posts?userId=${userId}`,
                );
                const data = await res.json();
                if (res.ok) {
                    setReportedPosts(Array.isArray(data) ? data : []);
                } else {
                    setReportedPosts([]);
                    setReportedPostsError(
                        data?.msg || "Unable to load reported posts right now.",
                    );
                }
            } catch (err) {
                console.error("Error loading reported posts:", err);
                setReportedPosts([]);
                setReportedPostsError("Unable to load reported posts right now.");
            } finally {
                setLoadingReportedPosts(false);
            }
        },
        [API_BASE, userId],
    );

    const fetchSingleCommunity = useCallback(
        async (communityId) => {
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${communityId}?userId=${userId}`,
                );
                const data = await res.json();
                return res.ok ? data : null;
            } catch (err) {
                console.error("Error loading community details:", err);
                return null;
            }
        },
        [API_BASE, userId],
    );

    const loadSingleCommunity = useCallback(
        async (communityId) => {
            const data = await fetchSingleCommunity(communityId);
            if (data) setSelectedCommunity(data);
            return data;
        },
        [fetchSingleCommunity],
    );

    const openBanAppealModal = useCallback(
        async ({ communityId, fallbackCommunity }) => {
            if (!communityId) return;

            setBanAppealDraft("");
            try {
                const community = await fetchSingleCommunity(communityId);
                const resolvedCommunity =
                    community ||
                    fallbackCommunity || { _id: communityId, name: "Community" };
                const banEntry = community
                    ? getActiveBanEntry(community, userId)
                    : null;

                setBanAppealModal({
                    open: true,
                    community: resolvedCommunity,
                    banEntry,
                });
            } catch (err) {
                console.error("Error opening ban appeal modal:", err);
                setBanAppealModal({
                    open: true,
                    community: fallbackCommunity || {
                        _id: communityId,
                        name: "Community",
                    },
                    banEntry: null,
                });
            }
        },
        [fetchSingleCommunity, userId],
    );

    const closeBanAppealModal = useCallback(() => {
        setBanAppealModal({ open: false, community: null, banEntry: null });
        setBanAppealDraft("");
        setBanAppealSubmitting(false);
    }, []);

    const refreshSelectedCommunity = useCallback(async () => {
        if (!selectedCommunity?._id) return;

        await Promise.all([
            loadSingleCommunity(selectedCommunity._id),
            loadCommunityDetails(selectedCommunity._id),
            loadCommunityPosts(selectedCommunity._id),
            loadReportedPosts(selectedCommunity._id),
            loadCommunities(),
        ]);
    }, [
        loadCommunities,
        loadCommunityDetails,
        loadCommunityPosts,
        loadReportedPosts,
        loadSingleCommunity,
        selectedCommunity?._id,
    ]);

    useEffect(() => {
        if (!userId) {
            console.error("No userId found! Checking localStorage...");
            console.log("localStorage userId:", localStorage.getItem("userId"));
            return;
        }

        checkAdminStatus();
        loadCommunities();

        const communityIdParam = new URLSearchParams(
            window.location.search,
        ).get("communityId");

        if (communityIdParam) {
            const loadCommunityFromParam = async () => {
                try {
                    const data = await fetchSingleCommunity(communityIdParam);
                    if (!data) return;

                    setSelectedCommunity(data);
                    await loadCommunityPosts(communityIdParam);
                    if (hasAdminOrModeratorAccess(data, userId)) {
                        await Promise.all([
                            loadCommunityDetails(communityIdParam),
                            loadReportedPosts(communityIdParam),
                        ]);
                    }
                } catch (err) {
                    console.error("Error loading community:", err);
                }
            };
            loadCommunityFromParam();
        }
    }, [
        checkAdminStatus,
        fetchSingleCommunity,
        loadCommunities,
        loadCommunityDetails,
        loadCommunityPosts,
        loadReportedPosts,
        userId,
    ]);

    useEffect(() => {
        if (isAdmin) loadPendingRequests();
    }, [isAdmin, loadPendingRequests]);

    useEffect(() => {
        if (newPostImages.length === 0) {
            setNewPostPreviews([]);
            return;
        }

        const previews = newPostImages.map((file) => URL.createObjectURL(file));
        setNewPostPreviews(previews);
        return () => previews.forEach((url) => URL.revokeObjectURL(url));
    }, [newPostImages]);

    useEffect(() => {
        if (!selectedCommunity) {
            setCommunityRulesDraft("");
            setNewCommunityCoverImage(null);
            setReportedPosts([]);
            setReportedPostsError("");
            setShowReportForm({});
            setReportFormData({});
            setReviewData({});
            setAppealDraft("");
            return;
        }

        setCommunityRulesDraft(selectedCommunity.rules || "");
        setNewCommunityCoverImage(null);
        setAppealDraft("");
    }, [selectedCommunity]);

    useEffect(() => {
        if (!showCommunityAdminPanel || !selectedCommunity?._id) return;

        loadCommunityDetails(selectedCommunity._id);
        loadReportedPosts(selectedCommunity._id);
    }, [
        loadCommunityDetails,
        loadReportedPosts,
        selectedCommunity?._id,
        showCommunityAdminPanel,
    ]);

    const handleSubmitBanAppealFromModal = useCallback(async () => {
        const communityId = banAppealModal?.community?._id;
        if (!communityId) return;

        if (!banAppealDraft.trim()) {
            alert("Please explain why you should be let back in");
            return;
        }

        setBanAppealSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE}/communities/${communityId}/appeal-ban`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId,
                        appealMessage: banAppealDraft,
                    }),
                },
            );
            const data = await res.json();

            if (res.ok) {
                alert(data.msg || "Appeal submitted");
                setBanAppealDraft("");
                setBanAppealModal((prev) => ({
                    ...prev,
                    banEntry: prev?.banEntry
                        ? { ...prev.banEntry, appealStatus: "pending" }
                        : prev.banEntry,
                }));
            } else {
                alert(data.msg || "Failed to submit appeal");
            }
        } catch (err) {
            console.error("Error submitting ban appeal:", err);
            alert("Error submitting appeal");
        } finally {
            setBanAppealSubmitting(false);
        }
    }, [API_BASE, banAppealDraft, banAppealModal?.community?._id, userId]);

    const openCommunityAdminPanel = useCallback(async () => {
        if (!selectedCommunity?._id) return;

        setShowCommunityAdminPanel(true);
        await Promise.all([
            loadSingleCommunity(selectedCommunity._id),
            loadCommunityDetails(selectedCommunity._id),
            loadReportedPosts(selectedCommunity._id),
        ]);
    }, [
        loadCommunityDetails,
        loadReportedPosts,
        loadSingleCommunity,
        selectedCommunity?._id,
    ]);

    const handleCreateCommunity = useCallback(
        async (e) => {
            e.preventDefault();
            setLoading(true);

            const formData = new FormData(e.target);
            formData.append("creatorId", userId);
            if (communityInterests.length > 0) {
                formData.append("interests", JSON.stringify(communityInterests));
            }

            try {
                const res = await fetch(`${API_BASE}/communities`, {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();

                if (res.ok) {
                    setShowCreateModal(false);
                    setCommunityInterests([]);
                    e.target.reset();
                    alert(
                        data.msg ||
                            "Your community is being reviewed by the admin. Please wait for approval.",
                    );
                    if (isAdmin) loadPendingRequests();
                } else {
                    alert(data.msg || "Failed");
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            } finally {
                setLoading(false);
            }
        },
        [
            API_BASE,
            communityInterests,
            isAdmin,
            loadPendingRequests,
            userId,
        ],
    );

    const handleApproveCommunity = useCallback(
        async (id) => {
            try {
                const res = await fetch(`${API_BASE}/communities/${id}/approve`, {
                    method: "POST",
                    headers: { "x-admin-token": adminToken || "" },
                });
                if (res.ok) {
                    alert("Approved!");
                    loadPendingRequests();
                    loadCommunities();
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            }
        },
        [API_BASE, adminToken, loadCommunities, loadPendingRequests],
    );

    const handleRejectCommunity = useCallback(
        async (id) => {
            if (!window.confirm("Reject?")) return;
            try {
                const res = await fetch(`${API_BASE}/communities/${id}/reject`, {
                    method: "POST",
                    headers: { "x-admin-token": adminToken || "" },
                });
                if (res.ok) {
                    alert("Rejected");
                    loadPendingRequests();
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            }
        },
        [API_BASE, adminToken, loadPendingRequests],
    );

    const handleApproveDeletion = useCallback(
        async (id) => {
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${id}/approve-deletion`,
                    {
                        method: "POST",
                        headers: { "x-admin-token": adminToken || "" },
                    },
                );
                if (res.ok) {
                    alert("Approved deletion!");
                    loadPendingRequests();
                    loadCommunities();
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            }
        },
        [API_BASE, adminToken, loadCommunities, loadPendingRequests],
    );

    const handleRejectDeletion = useCallback(
        async (id) => {
            if (!window.confirm("Reject deletion?")) return;
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${id}/reject-deletion`,
                    {
                        method: "POST",
                        headers: { "x-admin-token": adminToken || "" },
                    },
                );
                if (res.ok) {
                    alert("Rejected deletion");
                    loadPendingRequests();
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            }
        },
        [API_BASE, adminToken, loadPendingRequests],
    );

    const handleLeaveCommunity = useCallback(
        async (communityId) => {
            if (
                !window.confirm("Are you sure you want to leave this community?")
            ) {
                return;
            }

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${communityId}/leave`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                    },
                );
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    alert("Left community");
                    setSelectedCommunity(null);
                    loadCommunities();
                } else {
                    alert(data.msg || "Failed to leave");
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            }
        },
        [API_BASE, loadCommunities, userId],
    );

    const handleJoinCommunity = useCallback(
        async (communityId, fallbackCommunity = null) => {
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${communityId}/join`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                    },
                );
                const data = await res.json();

                if (res.ok) {
                    alert("Joined community!");
                    loadCommunityDetails(communityId);
                    loadCommunities();
                    return;
                }

                const msg = data?.msg || "Failed to join";
                if (
                    res.status === 403 &&
                    String(msg).toLowerCase().includes("banned")
                ) {
                    await openBanAppealModal({
                        communityId,
                        fallbackCommunity: fallbackCommunity || {
                            _id: communityId,
                            name: "",
                        },
                    });
                    return;
                }
                alert(msg);
            } catch (err) {
                console.error(err);
                alert("Error joining community");
            }
        },
        [
            API_BASE,
            loadCommunities,
            loadCommunityDetails,
            openBanAppealModal,
            userId,
        ],
    );

    const handleViewCommunity = useCallback(
        async (community) => {
            const communityId = community?._id;
            if (!communityId) return;

            window.history.pushState(
                {},
                "",
                `?communityId=${communityId}&userId=${userId}`,
            );
            const fullCommunity = await loadSingleCommunity(communityId);
            await loadCommunityPosts(communityId);

            if (hasAdminOrModeratorAccess(fullCommunity || community, userId)) {
                await Promise.all([
                    loadCommunityDetails(communityId),
                    loadReportedPosts(communityId),
                ]);
            }
        },
        [
            loadCommunityDetails,
            loadCommunityPosts,
            loadReportedPosts,
            loadSingleCommunity,
            userId,
        ],
    );

    const handleCreatePost = useCallback(
        async (e) => {
            e.preventDefault();
            if (!newPostText.trim() && newPostImages.length === 0) return;
            if (!selectedCommunity?._id) return;

            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("text", newPostText);
            newPostImages.forEach((file) => formData.append("images", file));
            if (newPostTags.length) {
                formData.append("tags", JSON.stringify(newPostTags));
            }

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/posts`,
                    {
                        method: "POST",
                        body: formData,
                    },
                );

                if (res.ok) {
                    setNewPostText("");
                    setNewPostImages([]);
                    setNewPostPreviews([]);
                    setNewPostTags([]);
                    loadCommunityPosts(selectedCommunity._id);
                } else {
                    const data = await res.json();
                    alert(data.msg || "Failed to create post");
                }
            } catch (err) {
                console.log(err);
                alert("Error creating post");
            }
        },
        [
            API_BASE,
            loadCommunityPosts,
            newPostImages,
            newPostTags,
            newPostText,
            selectedCommunity?._id,
            userId,
        ],
    );

    const handleLikePost = useCallback(
        async (postId) => {
            if (!selectedCommunity?._id) return;
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/like`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                    },
                );
                if (res.ok) loadCommunityPosts(selectedCommunity._id);
            } catch (err) {
                console.error(err);
            }
        },
        [API_BASE, loadCommunityPosts, selectedCommunity?._id, userId],
    );

    const handleAddComment = useCallback(
        async (postId) => {
            if (!selectedCommunity?._id) return;
            const text = newComment[postId]?.trim();
            if (!text) return;

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/comment`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, text }),
                    },
                );
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    setNewComment((prev) => ({ ...prev, [postId]: "" }));
                    loadCommunityPosts(selectedCommunity._id);
                } else {
                    alert(data.msg || "Failed to add comment");
                }
            } catch (err) {
                console.error(err);
                alert("Error adding comment");
            }
        },
        [
            API_BASE,
            loadCommunityPosts,
            newComment,
            selectedCommunity?._id,
            userId,
        ],
    );

    const handleDeleteComment = useCallback(
        async (postId, commentIdx) => {
            if (!selectedCommunity?._id) return;
            if (!window.confirm("Delete this comment?")) return;

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/comments/${commentIdx}`,
                    {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                    },
                );
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    loadCommunityPosts(selectedCommunity._id);
                } else {
                    alert(data.msg || "Failed to delete comment");
                }
            } catch (err) {
                console.error(err);
                alert("Error deleting comment");
            }
        },
        [API_BASE, loadCommunityPosts, selectedCommunity?._id, userId],
    );

    const handleDeletePost = useCallback(
        async (postId) => {
            if (!selectedCommunity?._id) return;
            if (!window.confirm("Delete this post?")) return;

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}`,
                    {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                    },
                );
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    alert("Post deleted");
                    loadCommunityPosts(selectedCommunity._id);
                } else {
                    alert(data.msg || "Failed to delete post");
                }
            } catch (err) {
                console.log(err);
                alert("Error deleting post");
            }
        },
        [API_BASE, loadCommunityPosts, selectedCommunity?._id, userId],
    );

    const handleReportPost = useCallback(
        async (postId) => {
            if (!selectedCommunity?._id || !userId) {
                alert(
                    "Session expired. Please log in again and reopen this community.",
                );
                return;
            }

            const payload = reportFormData[postId] || {};
            if (!String(payload.reason || "").trim()) {
                alert("Please select a reason");
                return;
            }

            setReportActionLoading((prev) => ({ ...prev, [postId]: true }));
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/report`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId,
                            reason: payload.reason,
                            details: payload.details || "",
                        }),
                    },
                );
                const data = await res.json();

                if (res.ok) {
                    alert(data.msg || "Post reported");
                    setShowReportForm((prev) => ({ ...prev, [postId]: false }));
                    setReportFormData((prev) => ({
                        ...prev,
                        [postId]: { reason: "", details: "" },
                    }));
                } else {
                    alert(data.msg || "Failed to report post");
                }
            } catch (err) {
                console.error("Error reporting post:", err);
                alert("Error reporting post");
            } finally {
                setReportActionLoading((prev) => ({
                    ...prev,
                    [postId]: false,
                }));
            }
        },
        [API_BASE, reportFormData, selectedCommunity?._id, userId],
    );

    const handleReviewReportedPost = useCallback(
        async (postId, action) => {
            if (!selectedCommunity?._id) return;

            const payload = reviewData[postId] || {};
            const shouldBanAuthor =
                action === "delete" && Boolean(payload.banAuthor);
            const resolvedAction = shouldBanAuthor ? "ban" : action;

            if (resolvedAction === "ban" && !String(payload.note || "").trim()) {
                alert("Please provide the ban reason");
                return;
            }

            if (
                resolvedAction === "delete" &&
                !String(payload.note || "").trim()
            ) {
                alert("Please provide why the post is being deleted");
                return;
            }

            if (
                resolvedAction === "ban" &&
                payload.banType === "temporary" &&
                !payload.expiresAt
            ) {
                alert("Please provide when the temporary ban should end");
                return;
            }

            setReportActionLoading((prev) => ({ ...prev, [postId]: true }));
            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/review-report`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId,
                            action: resolvedAction,
                            reviewNote: payload.note || "",
                            banType: payload.banType || "permanent",
                            expiresAt:
                                payload.banType === "temporary"
                                    ? payload.expiresAt || ""
                                    : "",
                        }),
                    },
                );
                const data = await res.json();

                if (res.ok) {
                    alert(data.msg || "Report reviewed");
                    await refreshSelectedCommunity();
                } else {
                    alert(data.msg || "Failed to review report");
                }
            } catch (err) {
                console.error("Error reviewing report:", err);
                alert("Error reviewing report");
            } finally {
                setReportActionLoading((prev) => ({
                    ...prev,
                    [postId]: false,
                }));
            }
        },
        [
            API_BASE,
            refreshSelectedCommunity,
            reviewData,
            selectedCommunity?._id,
            userId,
        ],
    );

    const handleSubmitBanAppeal = useCallback(async () => {
        if (!selectedCommunity?._id) return;

        if (!appealDraft.trim()) {
            alert("Please explain why you should be let back in");
            return;
        }

        setAppealSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE}/communities/${selectedCommunity._id}/appeal-ban`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId,
                        appealMessage: appealDraft,
                    }),
                },
            );
            const data = await res.json();

            if (res.ok) {
                alert(data.msg || "Appeal submitted");
                setAppealDraft("");
                await Promise.all([
                    loadSingleCommunity(selectedCommunity._id),
                    loadCommunityDetails(selectedCommunity._id),
                    loadCommunities(),
                ]);
            } else {
                alert(data.msg || "Failed to submit appeal");
            }
        } catch (err) {
            console.error("Error submitting ban appeal:", err);
            alert("Error submitting appeal");
        } finally {
            setAppealSubmitting(false);
        }
    }, [
        API_BASE,
        appealDraft,
        loadCommunities,
        loadCommunityDetails,
        loadSingleCommunity,
        selectedCommunity?._id,
        userId,
    ]);

    const handleReviewBanAppeal = useCallback(
        async (memberId, action) => {
            if (!selectedCommunity?._id) return;

            const payload = reviewData[`appeal-${memberId}`] || {};
            setAppealReviewLoading((prev) => ({ ...prev, [memberId]: true }));

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/review-ban-appeal`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId,
                            targetUserId: memberId,
                            action,
                            reviewNote: payload.note || "",
                        }),
                    },
                );
                const data = await res.json();

                if (res.ok) {
                    alert(data.msg || "Appeal reviewed");
                    await refreshSelectedCommunity();
                } else {
                    alert(data.msg || "Failed to review appeal");
                }
            } catch (err) {
                console.error("Error reviewing ban appeal:", err);
                alert("Error reviewing appeal");
            } finally {
                setAppealReviewLoading((prev) => ({
                    ...prev,
                    [memberId]: false,
                }));
            }
        },
        [
            API_BASE,
            refreshSelectedCommunity,
            reviewData,
            selectedCommunity?._id,
            userId,
        ],
    );

    const handleUnbanUser = useCallback(
        async (memberId) => {
            if (!selectedCommunity?._id) return;

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/unban-user`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId,
                            targetUserId: memberId,
                        }),
                    },
                );
                const data = await res.json();

                if (res.ok) {
                    alert(data.msg || "User unbanned successfully");
                    await Promise.all([
                        loadCommunityDetails(selectedCommunity._id),
                        loadSingleCommunity(selectedCommunity._id),
                        loadCommunities(),
                    ]);
                } else {
                    alert(data.msg || "Failed to unban user");
                }
            } catch (err) {
                console.error("Error unbanning user:", err);
                alert("Error unbanning user");
            }
        },
        [
            API_BASE,
            loadCommunities,
            loadCommunityDetails,
            loadSingleCommunity,
            selectedCommunity?._id,
            userId,
        ],
    );

    const handleBanUser = useCallback(
        async (memberId) => {
            const memberBanData = banData[memberId];
            if (!memberBanData) {
                alert("Please fill in ban details");
                return;
            }
            if (!selectedCommunity?._id) {
                alert("No community selected");
                return;
            }

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/ban-user`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId,
                            targetUserId: memberId,
                            banType: memberBanData.banType || "permanent",
                            reason: memberBanData.reason || "",
                            expiresAt: memberBanData.expiresAt || "",
                        }),
                    },
                );
                const data = await res.json();

                if (res.ok) {
                    alert("User banned successfully");
                    setShowBanForm((prev) => ({ ...prev, [memberId]: false }));
                    setBanData((prev) => ({ ...prev, [memberId]: null }));
                    await refreshSelectedCommunity();
                } else {
                    alert(data.msg || "Failed to ban user");
                }
            } catch (err) {
                console.error("Error banning user:", err);
                alert("Error banning user");
            }
        },
        [
            API_BASE,
            banData,
            refreshSelectedCommunity,
            selectedCommunity?._id,
            userId,
        ],
    );

    const handlePromoteModerator = useCallback(
        async (memberId) => {
            if (!selectedCommunity?._id) return;

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/promote`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, targetUserId: memberId }),
                    },
                );
                if (res.ok) {
                    alert("Promoted!");
                    loadCommunityDetails(selectedCommunity._id);
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            }
        },
        [API_BASE, loadCommunityDetails, selectedCommunity?._id, userId],
    );

    const handleDemoteModerator = useCallback(
        async (memberId) => {
            if (!selectedCommunity?._id) return;

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/demote-moderator`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, targetUserId: memberId }),
                    },
                );
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    alert("Demoted!");
                    loadCommunityDetails(selectedCommunity._id);
                } else {
                    alert(data.msg || "Error demoting user");
                }
            } catch (err) {
                console.log(err);
                alert("Error demoting user");
            }
        },
        [API_BASE, loadCommunityDetails, selectedCommunity?._id, userId],
    );

    const handleAddMember = useCallback(
        async (usernameToAdd) => {
            if (!usernameToAdd) {
                alert("Please enter a username");
                return;
            }
            if (!selectedCommunity?._id) return;

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/add-member`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId,
                            targetUsername: usernameToAdd,
                        }),
                    },
                );
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    alert("Member added");
                    loadCommunityDetails(selectedCommunity._id);
                } else {
                    alert(data.msg || "Failed to add member");
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            }
        },
        [API_BASE, loadCommunityDetails, selectedCommunity?._id, userId],
    );

    const handleRemoveMember = useCallback(
        async (memberId) => {
            if (!selectedCommunity?._id) return;
            if (!window.confirm("Remove member?")) return;

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${selectedCommunity._id}/remove-member`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, targetUserId: memberId }),
                    },
                );
                if (res.ok) {
                    alert("Removed");
                    loadCommunityDetails(selectedCommunity._id);
                }
            } catch (err) {
                console.log(err);
                alert("Error");
            }
        },
        [API_BASE, loadCommunityDetails, selectedCommunity?._id, userId],
    );

    const handleRequestDeletion = useCallback(
        async (communityId) => {
            if (
                !window.confirm(
                    "Request deletion of this community? A site admin will review your request.",
                )
            ) {
                return;
            }

            try {
                const res = await fetch(
                    `${API_BASE}/communities/${communityId}/request-deletion`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                    },
                );
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    alert(
                        "Deletion request submitted. Waiting for admin approval.",
                    );
                } else {
                    alert(data.msg || "Failed to request deletion");
                }
            } catch (err) {
                console.log(err);
                alert("Error requesting deletion");
            }
        },
        [API_BASE, userId],
    );

    const handleUpdateCommunityImage = useCallback(async () => {
        if (!selectedCommunity?._id) return;
        if (!newCommunityCoverImage) {
            alert("Please select an image first");
            return;
        }

        setUpdatingCommunityImage(true);
        try {
            const formData = new FormData();
            formData.append("coverImage", newCommunityCoverImage);

            const res = await fetch(
                `${API_BASE}/communities/${selectedCommunity._id}/cover-image?userId=${encodeURIComponent(userId)}`,
                {
                    method: "POST",
                    body: formData,
                },
            );
            const data = await res.json();

            if (res.ok) {
                alert(data.msg || "Community image updated");
                await loadSingleCommunity(selectedCommunity._id);
                await loadCommunities();
                setNewCommunityCoverImage(null);
            } else {
                alert(data.msg || "Failed to update community image");
            }
        } catch (err) {
            console.error("Error updating community image:", err);
            alert("Error updating community image");
        } finally {
            setUpdatingCommunityImage(false);
        }
    }, [
        API_BASE,
        loadCommunities,
        loadSingleCommunity,
        newCommunityCoverImage,
        selectedCommunity?._id,
        userId,
    ]);

    const handleUpdateCommunityRules = useCallback(async () => {
        if (!selectedCommunity?._id) return;

        setSavingCommunityRules(true);
        try {
            const res = await fetch(
                `${API_BASE}/communities/${selectedCommunity._id}/rules`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId,
                        rules: communityRulesDraft,
                    }),
                },
            );
            const data = await res.json();

            if (res.ok) {
                alert(data.msg || "Community rules updated");
                await loadSingleCommunity(selectedCommunity._id);
                await loadCommunities();
            } else {
                alert(data.msg || "Failed to update community rules");
            }
        } catch (err) {
            console.error("Error updating community rules:", err);
            alert("Error updating community rules");
        } finally {
            setSavingCommunityRules(false);
        }
    }, [
        API_BASE,
        communityRulesDraft,
        loadCommunities,
        loadSingleCommunity,
        selectedCommunity?._id,
        userId,
    ]);

    const removeTag = useCallback((tag) => {
        setNewPostTags((prev) => prev.filter((t) => t !== tag));
    }, []);

    const handleBackToList = useCallback(() => {
        setSelectedCommunity(null);
        setShowCommunityAdminPanel(false);
        window.history.pushState({}, "", `?userId=${userId}`);
    }, [userId]);

    const handleToggleComments = useCallback((postId) => {
        setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
    }, []);

    const handleCommentChange = useCallback((postId, value) => {
        setNewComment((prev) => ({ ...prev, [postId]: value }));
    }, []);

    const handleToggleReport = useCallback((postId) => {
        setShowReportForm((prev) => ({ ...prev, [postId]: !prev[postId] }));
        setReportFormData((prev) =>
            prev[postId]
                ? prev
                : { ...prev, [postId]: { reason: "", details: "" } },
        );
    }, []);

    const handleReportFieldChange = useCallback((postId, field, value) => {
        setReportFormData((prev) => ({
            ...prev,
            [postId]: { ...prev[postId], [field]: value },
        }));
    }, []);

    const handleCancelReport = useCallback((postId) => {
        setShowReportForm((prev) => ({ ...prev, [postId]: false }));
    }, []);

    const handleReviewDataChange = useCallback((key, patch) => {
        setReviewData((prev) => ({
            ...prev,
            [key]: { ...prev[key], ...patch },
        }));
    }, []);

    const handleToggleBanForm = useCallback((memberId, force) => {
        setShowBanForm((prev) => {
            const nextValue = typeof force === "boolean" ? force : !prev[memberId];
            return { ...prev, [memberId]: nextValue };
        });
        setBanData((prev) =>
            prev[memberId] ? prev : { ...prev, [memberId]: defaultBanData },
        );
    }, []);

    const handleBanDataChange = useCallback((memberId, patch) => {
        setBanData((prev) => ({
            ...prev,
            [memberId]: { ...(prev[memberId] || defaultBanData), ...patch },
        }));
    }, []);

    const categorizedCommunities = useMemo(
        () => categorizeCommunitiesByStatus(communities, userId),
        [communities, userId],
    );

    const currentUserBanEntry = useMemo(
        () => getActiveBanEntry(selectedCommunity, userId),
        [selectedCommunity, userId],
    );

    const pendingAppeals = useMemo(
        () =>
            (communityMembers.bannedUsers || []).filter(
                (banEntry) => banEntry.appealStatus === "pending",
            ),
        [communityMembers.bannedUsers],
    );

    return {
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
    };
};

export default useCommunitiesPageController;
