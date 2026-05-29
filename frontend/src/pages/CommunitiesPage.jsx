import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layouts/Sidebar";
import CommunityCard from "../components/CommunityCard";
import TagInput from "../components/TagInput";
import PostComposer from "../components/PostComposer";
import PageHeader from "../components/PageHeader";
import useSidebarLayout from "../hooks/useSidebarLayout";
import defaultHeader from "../assets/default-header.jpeg";
import defaultAvatar from "../assets/default-avatar.jpg";
import {
    Users,
    Plus,
    Check,
    X,
    Shield,
    Crown,
    Settings,
    Ban,
    UserMinus,
    AlertCircle,
    Heart,
    MessageCircle,
    Flag,
} from "../components/community/CommunityIcons";
import { clearAuth } from "../utils/tokenUtils";
import {
    isCommunityAdmin,
    isCommunityModerator,
    isCommunityMember,
    hasAdminOrModeratorAccess,
    categorizeCommunitiesByStatus,
} from "../utils/communityUtils";
import { API_URL } from "../api/auth";
import CreateCommunityModal from "../components/community/CreateCommunityModal";
import AdminDashboardModal from "../components/community/AdminDashboardModal";

const CommunitiesPage = () => {
    const [communities, setCommunities] = useState([]);
    const [recommendedCommunities, setRecommendedCommunities] = useState([]);
    const { mainContentClass } = useSidebarLayout();
    const [pendingRequests, setPendingRequests] = useState({
        pendingCreations: [],
        pendingDeletions: [],
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [showCommunityAdminPanel, setShowCommunityAdminPanel] =
        useState(false);
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
    const [showBanForm, setShowBanForm] = useState({});
    const [banData, setBanData] = useState({});
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

    // const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        clearAuth();
        navigate("/login");
    };

    const API_BASE = `${API_URL}`;
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId") || localStorage.getItem("userId");
    const adminToken = localStorage.getItem("adminToken");

    const getActiveBanEntry = (community, targetUserId) => {
        if (!community?.bannedUsers || !targetUserId) {
            return null;
        }

        return (
            community.bannedUsers.find((banEntry) => {
                const bannedUserId =
                    typeof banEntry.user === "string"
                        ? banEntry.user
                        : banEntry.user?._id;
                if (bannedUserId !== targetUserId) {
                    return false;
                }
                if (banEntry.banType === "permanent") {
                    return true;
                }
                return Boolean(
                    banEntry.banType === "temporary" &&
                    banEntry.expiresAt &&
                    new Date(banEntry.expiresAt) > new Date(),
                );
            }) || null
        );
    };

    useEffect(() => {
        console.log("CommunitiesPage mounted with userId:", userId);
        if (!userId) {
            console.error("No userId found! Checking localStorage...");
            console.log("localStorage userId:", localStorage.getItem("userId"));
            return;
        }

        checkAdminStatus();
        loadCommunities();

        // Check if a community ID is in URL params
        const communityIdParam = new URLSearchParams(
            window.location.search,
        ).get("communityId");
        if (communityIdParam) {
            // Find and load that community
            const loadCommunityFromParam = async () => {
                try {
                    const res = await fetch(
                        `${API_BASE}/communities/${communityIdParam}?userId=${userId}`,
                    );
                    if (res.ok) {
                        const data = await res.json();
                        setSelectedCommunity(data);
                        await loadCommunityPosts(communityIdParam);
                        if (hasAdminOrModeratorAccess(data, userId)) {
                            await Promise.all([
                                loadCommunityDetails(communityIdParam),
                                loadReportedPosts(communityIdParam),
                            ]);
                        }
                    }
                } catch (err) {
                    console.error("Error loading community:", err);
                }
            };
            loadCommunityFromParam();
        }
    }, [
        API_BASE,
        checkAdminStatus,
        loadCommunities,
        loadCommunityDetails,
        loadCommunityPosts,
        loadReportedPosts,
        userId,
    ]);

    useEffect(() => {
        if (isAdmin) {
            loadPendingRequests();
        }
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
        if (!showCommunityAdminPanel || !selectedCommunity?._id) {
            return;
        }

        loadCommunityDetails(selectedCommunity._id);
        loadReportedPosts(selectedCommunity._id);
    }, [
        showCommunityAdminPanel,
        selectedCommunity._id,
        loadCommunityDetails,
        loadReportedPosts,
    ]);

    const removeTag = (tag) => {
        setNewPostTags((prev) => prev.filter((t) => t !== tag));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const checkAdminStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/verify-admin`, {
                headers: { "x-admin-token": adminToken || "" },
            });
            const data = await res.json();
            setIsAdmin(data.isAdmin || false);
        } catch (err) {
            console.error("Error:", err);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const loadCommunities = useCallback(async () => {
        try {
            setLoading(true);
            const adminParam = isAdmin ? "&admin=true" : "";
            const url = `${API_BASE}/communities?userId=${userId}${adminParam}`;
            console.log("Loading communities from:", url);
            const res = await fetch(url);
            const data = await res.json();
            console.log("Communities data:", data);
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
    });

    const loadRecommendedCommunities = async (fallbackCommunities = []) => {
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
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const loadCommunityDetails = useCallback(async (communityId) => {
        try {
            const res = await fetch(
                `${API_BASE}/communities/${communityId}/members?userId=${userId}`,
            );
            const data = await res.json();
            if (res.ok) setCommunityMembers(data);
        } catch (err) {
            console.error("Error:", err);
        }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const loadCommunityPosts = useCallback(async (communityId) => {
        try {
            const res = await fetch(
                `${API_BASE}/communities/${communityId}/posts`,
            );
            const data = await res.json();
            if (res.ok) setCommunityPosts(data);
        } catch (err) {
            console.error("Error:", err);
        }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const loadReportedPosts = useCallback(async (communityId) => {
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
    });

    const fetchSingleCommunity = async (communityId) => {
        try {
            const res = await fetch(
                `${API_BASE}/communities/${communityId}?userId=${userId}`,
            );
            const data = await res.json();
            if (res.ok) {
                return data;
            }
            return null;
        } catch (err) {
            console.error("Error loading community details:", err);
            return null;
        }
    };

    const loadSingleCommunity = async (communityId) => {
        const data = await fetchSingleCommunity(communityId);
        if (data) {
            setSelectedCommunity(data);
        }
        return data;
    };

    const openBanAppealModal = async ({ communityId, fallbackCommunity }) => {
        if (!communityId) return;

        setBanAppealDraft("");
        try {
            const community = await fetchSingleCommunity(communityId);
            const resolvedCommunity = community ||
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
    };

    const closeBanAppealModal = () => {
        setBanAppealModal({ open: false, community: null, banEntry: null });
        setBanAppealDraft("");
        setBanAppealSubmitting(false);
    };

    const handleSubmitBanAppealFromModal = async () => {
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
    };

    const openCommunityAdminPanel = async () => {
        if (!selectedCommunity?._id) {
            return;
        }

        setShowCommunityAdminPanel(true);
        await Promise.all([
            loadSingleCommunity(selectedCommunity._id),
            loadCommunityDetails(selectedCommunity._id),
            loadReportedPosts(selectedCommunity._id),
        ]);
    };

    const handleCreateCommunity = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        formData.append("creatorId", userId);
        // Add interests array to FormData
        if (communityInterests.length > 0) {
            formData.append("interests", JSON.stringify(communityInterests));
        }
        try {
            const res = await fetch(`${API_BASE}/communities`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setShowCreateModal(false);
                setCommunityInterests([]); // Reset interests
                e.target.reset();
                alert(
                    data.msg ||
                        "Your community is being reviewed by the admin. Please wait for approval.",
                );
                if (isAdmin) loadPendingRequests();
            } else {
                const data = await res.json();
                alert(data.msg || "Failed");
            }
        } catch (err) {
            console.log(err);
            alert("Error");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveCommunity = async (id) => {
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
    };

    const handleRejectCommunity = async (id) => {
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
    };

    const handleApproveDeletion = async (id) => {
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
    };

    const handleRejectDeletion = async (id) => {
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
    };

    const handleLeaveCommunity = async (communityId) => {
        if (!window.confirm("Are you sure you want to leave this community?"))
            return;
        try {
            const res = await fetch(
                `${API_BASE}/communities/${communityId}/leave`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                },
            );
            if (res.ok) {
                alert("Left community");
                setSelectedCommunity(null);
                loadCommunities();
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to leave");
            }
        } catch (err) {
            console.log(err);
            alert("Error");
        }
    };

    const handleJoinCommunity = async (
        communityId,
        fallbackCommunity = null,
    ) => {
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
            } else {
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
            }
        } catch (err) {
            console.error(err);
            alert("Error joining community");
        }
    };

    const handleViewCommunity = async (community) => {
        const communityId = community?._id;
        if (!communityId) return;

        // Add community ID to URL params
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
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostText.trim() && newPostImages.length === 0) return;
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
    };

    const handleLikePost = async (postId) => {
        try {
            const res = await fetch(
                `${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/like`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                },
            );
            if (res.ok) {
                loadCommunityPosts(selectedCommunity._id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddComment = async (postId) => {
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
            if (res.ok) {
                setNewComment({ ...newComment, [postId]: "" });
                loadCommunityPosts(selectedCommunity._id);
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to add comment");
            }
        } catch (err) {
            console.error(err);
            alert("Error adding comment");
        }
    };

    const handleDeleteComment = async (postId, commentIdx) => {
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
            if (res.ok) {
                loadCommunityPosts(selectedCommunity._id);
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to delete comment");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting comment");
        }
    };

    const handleAddMember = async (usernameToAdd) => {
        if (!usernameToAdd) {
            alert("Please enter a username");
            return;
        }
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
            if (res.ok) {
                alert("Member added");
                loadCommunityDetails(selectedCommunity._id);
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to add member");
            }
        } catch (err) {
            console.log(err);
            alert("Error");
        }
    };

    const handleRemoveMember = async (memberId) => {
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
    };

    const handleDeletePost = async (postId) => {
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
            if (res.ok) {
                alert("Post deleted");
                loadCommunityPosts(selectedCommunity._id);
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to delete post");
            }
        } catch (err) {
            console.log(err);
            alert("Error deleting post");
        }
    };

    const handleReportPost = async (postId) => {
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
            setReportActionLoading((prev) => ({ ...prev, [postId]: false }));
        }
    };

    const handleReviewReportedPost = async (postId, action) => {
        const payload = reviewData[postId] || {};
        const shouldBanAuthor =
            action === "delete" && Boolean(payload.banAuthor);
        const resolvedAction = shouldBanAuthor ? "ban" : action;

        if (resolvedAction === "ban" && !String(payload.note || "").trim()) {
            alert("Please provide the ban reason");
            return;
        }

        if (resolvedAction === "delete" && !String(payload.note || "").trim()) {
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
                await Promise.all([
                    loadCommunityPosts(selectedCommunity._id),
                    loadCommunityDetails(selectedCommunity._id),
                    loadReportedPosts(selectedCommunity._id),
                    loadSingleCommunity(selectedCommunity._id),
                    loadCommunities(),
                ]);
            } else {
                alert(data.msg || "Failed to review report");
            }
        } catch (err) {
            console.error("Error reviewing report:", err);
            alert("Error reviewing report");
        } finally {
            setReportActionLoading((prev) => ({ ...prev, [postId]: false }));
        }
    };

    const handleSubmitBanAppeal = async () => {
        if (!selectedCommunity?._id) {
            return;
        }

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
    };

    const handleReviewBanAppeal = async (memberId, action) => {
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
                await Promise.all([
                    loadCommunityDetails(selectedCommunity._id),
                    loadCommunityPosts(selectedCommunity._id),
                    loadReportedPosts(selectedCommunity._id),
                    loadSingleCommunity(selectedCommunity._id),
                    loadCommunities(),
                ]);
            } else {
                alert(data.msg || "Failed to review appeal");
            }
        } catch (err) {
            console.error("Error reviewing ban appeal:", err);
            alert("Error reviewing appeal");
        } finally {
            setAppealReviewLoading((prev) => ({ ...prev, [memberId]: false }));
        }
    };

    const handleUnbanUser = async (memberId) => {
        if (!selectedCommunity?._id) {
            return;
        }

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
    };

    const handleBanUser = async (memberId) => {
        const memberBanData = banData[memberId];
        if (!memberBanData) {
            alert("Please fill in ban details");
            return;
        }

        if (!selectedCommunity) {
            alert("No community selected");
            return;
        }

        try {
            const requestBody = {
                userId,
                targetUserId: memberId,
                banType: memberBanData.banType || "permanent",
                reason: memberBanData.reason || "",
                expiresAt: memberBanData.expiresAt || "",
            };

            const res = await fetch(
                `${API_BASE}/communities/${selectedCommunity._id}/ban-user`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                },
            );

            const data = await res.json();

            if (res.ok) {
                alert("User banned successfully");
                // Clear the ban form for this member
                setShowBanForm({ ...showBanForm, [memberId]: false });
                setBanData({ ...banData, [memberId]: null });
                await Promise.all([
                    loadCommunityDetails(selectedCommunity._id),
                    loadCommunityPosts(selectedCommunity._id),
                    loadReportedPosts(selectedCommunity._id),
                    loadSingleCommunity(selectedCommunity._id),
                    loadCommunities(),
                ]);
            } else {
                alert(data.msg || "Failed to ban user");
            }
        } catch (err) {
            console.error("Error banning user:", err);
            alert("Error banning user");
        }
    };

    const handlePromoteModerator = async (memberId) => {
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
    };

    const handleDemoteModerator = async (memberId) => {
        try {
            const res = await fetch(
                `${API_BASE}/communities/${selectedCommunity._id}/demote-moderator`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, targetUserId: memberId }),
                },
            );
            if (res.ok) {
                alert("Demoted!");
                loadCommunityDetails(selectedCommunity._id);
            } else {
                const data = await res.json();
                alert(data.msg || "Error demoting user");
            }
        } catch (err) {
            console.log(err);
            alert("Error demoting user");
        }
    };

    const handleRequestDeletion = async (communityId) => {
        if (
            !window.confirm(
                "Request deletion of this community? A site admin will review your request.",
            )
        )
            return;
        try {
            const res = await fetch(
                `${API_BASE}/communities/${communityId}/request-deletion`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                },
            );
            if (res.ok) {
                alert(
                    "Deletion request submitted. Waiting for admin approval.",
                );
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to request deletion");
            }
        } catch (err) {
            console.log(err);
            alert("Error requesting deletion");
        }
    };

    const handleUpdateCommunityImage = async () => {
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
    };

    const handleUpdateCommunityRules = async () => {
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
    };

    const currentUserBanEntry = getActiveBanEntry(selectedCommunity, userId);
    const pendingAppeals = (communityMembers.bannedUsers || []).filter(
        (banEntry) => banEntry.appealStatus === "pending",
    );

    // COMMUNITY DETAIL VIEW (RENDERED IF A COMMUNITY IS SELECTED)
    if (selectedCommunity) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans flex">
                {/* Sidebar */}
                {!showCommunityAdminPanel && (
                    <Sidebar
                        showLogoutConfirm={showLogoutConfirm}
                        setShowLogoutConfirm={setShowLogoutConfirm}
                        onLogout={handleLogout}
                    />
                )}

                {/* Detail Content */}
                <div
                    className={`flex-1 transition-all duration-300 flex justify-center px-4 py-8 ${showCommunityAdminPanel ? "lg:ml-0 xl:ml-0" : "lg:ml-16 xl:ml-64"}`}>
                    <div className="w-full max-w-4xl space-y-6">
                        <button
                            onClick={() => {
                                setSelectedCommunity(null);
                                window.history.pushState(
                                    {},
                                    "",
                                    `?userId=${userId}`,
                                );
                            }}
                            className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
                            <X className="w-4 h-4" /> Back to List
                        </button>

                        <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                            {selectedCommunity.coverImage ? (
                                <img
                                    src={selectedCommunity.coverImage}
                                    className="w-full h-48 object-cover"
                                    alt=""
                                />
                            ) : (
                                <img
                                    src={defaultHeader}
                                    className="w-full h-48 object-cover"
                                    alt="Default header"
                                />
                            )}
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
                                                <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4">
                                                    <p className="text-sm font-black text-red-900">
                                                        You are currently banned
                                                        from this community
                                                    </p>
                                                    <p className="mt-2 text-sm text-red-800">
                                                        {currentUserBanEntry.reason ||
                                                            "The community staff removed you from this community."}
                                                    </p>
                                                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                                                        {currentUserBanEntry.banType ===
                                                            "temporary" &&
                                                        currentUserBanEntry.expiresAt
                                                            ? `Temporary ban until ${new Date(currentUserBanEntry.expiresAt).toLocaleString()}`
                                                            : "Permanent ban"}
                                                    </p>
                                                    <div className="mt-4 rounded-2xl border border-red-100 bg-white p-4">
                                                        <p className="text-sm font-bold text-slate-900">
                                                            Plead your case
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Explain what
                                                            happened and why you
                                                            should be allowed
                                                            back.
                                                        </p>
                                                        <textarea
                                                            value={appealDraft}
                                                            onChange={(e) =>
                                                                setAppealDraft(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            rows={4}
                                                            disabled={
                                                                currentUserBanEntry.appealStatus ===
                                                                    "pending" ||
                                                                appealSubmitting
                                                            }
                                                            placeholder="Write your appeal to the community staff..."
                                                            className="mt-3 w-full rounded-xl border border-red-200 bg-white p-3 text-sm disabled:bg-slate-50"
                                                        />
                                                        {currentUserBanEntry.appealStatus ===
                                                            "pending" && (
                                                            <p className="mt-3 text-sm font-medium text-amber-700">
                                                                Your appeal is
                                                                pending review.
                                                            </p>
                                                        )}
                                                        {currentUserBanEntry.appealStatus ===
                                                            "rejected" &&
                                                            currentUserBanEntry.appealReviewNote && (
                                                                <p className="mt-3 text-sm text-slate-600">
                                                                    Last staff
                                                                    note:{" "}
                                                                    {
                                                                        currentUserBanEntry.appealReviewNote
                                                                    }
                                                                </p>
                                                            )}
                                                        <button
                                                            onClick={
                                                                handleSubmitBanAppeal
                                                            }
                                                            disabled={
                                                                appealSubmitting ||
                                                                currentUserBanEntry.appealStatus ===
                                                                    "pending"
                                                            }
                                                            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                                                            {appealSubmitting
                                                                ? "Submitting appeal..."
                                                                : currentUserBanEntry.appealStatus ===
                                                                    "rejected"
                                                                  ? "Submit another appeal"
                                                                  : "Submit appeal"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : isCommunityMember(
                                                  selectedCommunity,
                                                  userId,
                                              ) ? (
                                                <button
                                                    onClick={() =>
                                                        handleLeaveCommunity(
                                                            selectedCommunity._id,
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                                                    Leave Community
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleJoinCommunity(
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
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await openCommunityAdminPanel();
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                            <Settings className="w-4 h-4" />{" "}
                                            Manage
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Post Feed */}
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
                                    onRemoveTag={removeTag}
                                    onImageSelect={(e) => {
                                        const files = Array.from(
                                            e.target.files || [],
                                        );
                                        setNewPostImages(files.slice(0, 6));
                                    }}
                                    imageLabel="Photo"
                                    onSubmit={handleCreatePost}
                                    submitDisabled={
                                        !newPostText.trim() &&
                                        newPostImages.length === 0
                                    }
                                    containerClassName="bg-white rounded-xl shadow-sm border border-gray-200"
                                />
                            )}

                            <div className="space-y-4">
                                {communityPosts.map((post) => (
                                    <div
                                        key={post._id}
                                        className="bg-white p-6 rounded-3xl border border-gray-200 relative">
                                        <div className="flex items-center gap-3 mb-4">
                                            <img
                                                src={
                                                    post.user?.profileImage ||
                                                    defaultAvatar
                                                }
                                                className="w-10 h-10 rounded-full border"
                                                alt=""
                                            />
                                            <div className="flex-1">
                                                <span className="font-bold text-sm text-gray-900 block">
                                                    {post.user?.username ||
                                                        "Unknown User"}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(
                                                        post.createdAt,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        {post.text && (
                                            <p className="text-gray-800 mb-3">
                                                {post.text}
                                            </p>
                                        )}
                                        {post.image && (
                                            <div className="rounded-xl overflow-hidden mb-3 border border-gray-200 bg-gray-50 flex items-center justify-center max-h-96">
                                                <img
                                                    src={post.image}
                                                    className="w-full h-auto object-contain"
                                                    alt=""
                                                />
                                            </div>
                                        )}
                                        {Array.isArray(post.tags) &&
                                            post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {post.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        {showReportForm[post._id] && (
                                            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                                <h4 className="text-sm font-bold text-amber-900 mb-3">
                                                    Report post
                                                </h4>
                                                <div className="space-y-3">
                                                    <select
                                                        value={
                                                            reportFormData[
                                                                post._id
                                                            ]?.reason || ""
                                                        }
                                                        onChange={(e) =>
                                                            setReportFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [post._id]:
                                                                        {
                                                                            ...prev[
                                                                                post
                                                                                    ._id
                                                                            ],
                                                                            reason: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                }),
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-amber-200 bg-white p-2 text-sm">
                                                        <option value="">
                                                            Select reason
                                                        </option>
                                                        <option value="Spam">
                                                            Spam
                                                        </option>
                                                        <option value="Harassment">
                                                            Harassment
                                                        </option>
                                                        <option value="Hate speech">
                                                            Hate speech
                                                        </option>
                                                        <option value="Misinformation">
                                                            Misinformation
                                                        </option>
                                                        <option value="Rule violation">
                                                            Rule violation
                                                        </option>
                                                    </select>
                                                    <textarea
                                                        value={
                                                            reportFormData[
                                                                post._id
                                                            ]?.details || ""
                                                        }
                                                        onChange={(e) =>
                                                            setReportFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [post._id]:
                                                                        {
                                                                            ...prev[
                                                                                post
                                                                                    ._id
                                                                            ],
                                                                            details:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                }),
                                                            )
                                                        }
                                                        rows={3}
                                                        placeholder="Add details for the community staff..."
                                                        className="w-full rounded-lg border border-amber-200 bg-white p-3 text-sm"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                setShowReportForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [post._id]: false,
                                                                    }),
                                                                )
                                                            }
                                                            className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800">
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleReportPost(
                                                                    post._id,
                                                                )
                                                            }
                                                            disabled={Boolean(
                                                                reportActionLoading[
                                                                    post._id
                                                                ],
                                                            )}
                                                            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                                                            {reportActionLoading[
                                                                post._id
                                                            ]
                                                                ? "Submitting..."
                                                                : "Submit report"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                                            {(() => {
                                                const isLiked =
                                                    post.likes?.some(
                                                        (likeUserId) => {
                                                            const id =
                                                                typeof likeUserId ===
                                                                "string"
                                                                    ? likeUserId
                                                                    : likeUserId._id;
                                                            return (
                                                                id === userId
                                                            );
                                                        },
                                                    );
                                                return (
                                                    <button
                                                        onClick={() =>
                                                            handleLikePost(
                                                                post._id,
                                                            )
                                                        }
                                                        className={`flex items-center gap-2 text-sm transition-colors ${
                                                            isLiked
                                                                ? "text-red-600"
                                                                : "text-gray-600 hover:text-red-600"
                                                        }`}>
                                                        <Heart
                                                            className="w-5 h-5"
                                                            filled={isLiked}
                                                        />
                                                        {post.likes?.length ||
                                                            0}
                                                    </button>
                                                );
                                            })()}
                                            <button
                                                onClick={() =>
                                                    setExpandedComments({
                                                        ...expandedComments,
                                                        [post._id]:
                                                            !expandedComments[
                                                                post._id
                                                            ],
                                                    })
                                                }
                                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                                <MessageCircle className="w-5 h-5" />
                                                {post.comments?.length || 0}
                                            </button>
                                        </div>
                                        {expandedComments[post._id] && (
                                            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {post.comments?.map(
                                                        (comment, idx) => {
                                                            const commentUserId =
                                                                typeof comment.user ===
                                                                "string"
                                                                    ? comment.user
                                                                    : comment
                                                                          .user
                                                                          ._id;
                                                            const isCommentOwner =
                                                                commentUserId ===
                                                                userId;
                                                            const isAdmin =
                                                                isCommunityAdmin(
                                                                    selectedCommunity,
                                                                    userId,
                                                                );
                                                            const canDelete =
                                                                isCommentOwner ||
                                                                isAdmin;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="bg-gray-50 p-3 rounded-lg relative">
                                                                    <div className="flex flex-col items-start gap-2 mb-3">
                                                                        <img
                                                                            src={
                                                                                comment
                                                                                    .user
                                                                                    ?.profileImage ||
                                                                                defaultAvatar
                                                                            }
                                                                            className="w-8 h-8 rounded-full"
                                                                            alt=""
                                                                        />
                                                                        <div className="flex items-center gap-2 w-full">
                                                                            <span className="font-semibold text-sm">
                                                                                {
                                                                                    comment
                                                                                        .user
                                                                                        ?.username
                                                                                }
                                                                            </span>
                                                                            {canDelete && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleDeleteComment(
                                                                                            post._id,
                                                                                            idx,
                                                                                        )
                                                                                    }
                                                                                    className="ml-auto text-gray-400 hover:text-red-600 text-xs font-medium">
                                                                                    Delete
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700">
                                                                        {
                                                                            comment.text
                                                                        }
                                                                    </p>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={
                                                            newComment[
                                                                post._id
                                                            ] || ""
                                                        }
                                                        onChange={(e) =>
                                                            setNewComment({
                                                                ...newComment,
                                                                [post._id]:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        placeholder="Add a comment..."
                                                        className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            handleAddComment(
                                                                post._id,
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                                        Post
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {(() => {
                                            const postUserId = String(
                                                typeof post.user === "string"
                                                    ? post.user
                                                    : post.user?._id || "",
                                            );
                                            const isPostOwner =
                                                postUserId ===
                                                String(userId || "");
                                            const isAdmin = isCommunityAdmin(
                                                selectedCommunity,
                                                userId,
                                            );
                                            const isMod = isCommunityModerator(
                                                selectedCommunity,
                                                userId,
                                            );
                                            const canDelete =
                                                isPostOwner || isAdmin || isMod;
                                            const canReport =
                                                isCommunityMember(
                                                    selectedCommunity,
                                                    userId,
                                                ) && !isPostOwner;

                                            if (!canDelete && !canReport) {
                                                return null;
                                            }

                                            return (
                                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                                    {canReport && (
                                                        <button
                                                            onClick={() => {
                                                                setShowReportForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [post._id]:
                                                                            !prev[
                                                                                post
                                                                                    ._id
                                                                            ],
                                                                    }),
                                                                );
                                                                if (
                                                                    !reportFormData[
                                                                        post._id
                                                                    ]
                                                                ) {
                                                                    setReportFormData(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [post._id]:
                                                                                {
                                                                                    reason: "",
                                                                                    details:
                                                                                        "",
                                                                                },
                                                                        }),
                                                                    );
                                                                }
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                                                            <Flag className="w-3.5 h-3.5" />
                                                            Report
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() =>
                                                                handleDeletePost(
                                                                    post._id,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium">
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT DRAWER ADMIN PANEL */}
                {showCommunityAdminPanel && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowCommunityAdminPanel(false)}
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
                                            Review reports first, then adjust
                                            settings or member access.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setShowCommunityAdminPanel(false)
                                        }
                                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                                        {reportedPosts.reduce(
                                            (total, post) =>
                                                total +
                                                (post.reports?.length || 0),
                                            0,
                                        )}{" "}
                                        open reports
                                    </div>
                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                        {reportedPosts.length} reported posts
                                    </div>
                                    <button
                                        onClick={() =>
                                            loadReportedPosts(
                                                selectedCommunity._id,
                                            )
                                        }
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
                                                Each card shows the reported
                                                content, the reason, and
                                                controls to dismiss, delete, or
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
                                                <div
                                                    key={post._id}
                                                    className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">
                                                                {post.user
                                                                    ?.username ||
                                                                    "Unknown User"}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Posted{" "}
                                                                {new Date(
                                                                    post.createdAt,
                                                                ).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-900">
                                                            {post.reports
                                                                ?.length ||
                                                                0}{" "}
                                                            report
                                                            {post.reports
                                                                ?.length === 1
                                                                ? ""
                                                                : "s"}
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
                                                                No text caption
                                                                on this post.
                                                            </p>
                                                        )}
                                                        {post.image && (
                                                            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                                                <img
                                                                    src={
                                                                        post.image
                                                                    }
                                                                    alt="Reported post"
                                                                    className="max-h-80 w-full object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                        {Array.isArray(
                                                            post.tags,
                                                        ) &&
                                                            post.tags.length >
                                                                0 && (
                                                                <div className="mt-4 flex flex-wrap gap-2">
                                                                    {post.tags.map(
                                                                        (
                                                                            tag,
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    tag
                                                                                }
                                                                                className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                                                                #
                                                                                {
                                                                                    tag
                                                                                }
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>

                                                    <div className="mt-4 rounded-2xl border border-amber-100 bg-white/90 p-4">
                                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
                                                            Reports received
                                                        </p>
                                                        <div className="mt-3 space-y-3">
                                                            {post.reports?.map(
                                                                (report) => (
                                                                    <div
                                                                        key={
                                                                            report._id
                                                                        }
                                                                        className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 text-sm text-slate-700">
                                                                        <p className="font-bold text-slate-900">
                                                                            {report
                                                                                .reporter
                                                                                ?.username ||
                                                                                "Member"}{" "}
                                                                            reported
                                                                            this
                                                                            for{" "}
                                                                            {
                                                                                report.reason
                                                                            }
                                                                        </p>
                                                                        {report.details ? (
                                                                            <p className="mt-1 text-sm text-slate-600">
                                                                                {
                                                                                    report.details
                                                                                }
                                                                            </p>
                                                                        ) : (
                                                                            <p className="mt-1 text-sm italic text-slate-400">
                                                                                No
                                                                                extra
                                                                                details
                                                                                provided.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/70 p-4">
                                                        <p className="text-sm font-bold text-slate-900">
                                                            Moderation note
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Delete post is
                                                            default. Tick the
                                                            option below if you
                                                            also want to ban the
                                                            author.
                                                        </p>

                                                        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={Boolean(
                                                                    reviewData[
                                                                        post._id
                                                                    ]
                                                                        ?.banAuthor,
                                                                )}
                                                                onChange={(e) =>
                                                                    setReviewData(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [post._id]:
                                                                                {
                                                                                    ...prev[
                                                                                        post
                                                                                            ._id
                                                                                    ],
                                                                                    banAuthor:
                                                                                        e
                                                                                            .target
                                                                                            .checked,
                                                                                },
                                                                        }),
                                                                    )
                                                                }
                                                                className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                                                            />
                                                            Tick to ban author
                                                            after deleting this
                                                            post
                                                        </label>

                                                        {Boolean(
                                                            reviewData[post._id]
                                                                ?.banAuthor,
                                                        ) && (
                                                            <div className="mt-4">
                                                                <label className="mb-1 block text-xs font-medium text-slate-700">
                                                                    Ban Type
                                                                </label>
                                                                <select
                                                                    value={
                                                                        reviewData[
                                                                            post
                                                                                ._id
                                                                        ]
                                                                            ?.banType ||
                                                                        "permanent"
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setReviewData(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [post._id]:
                                                                                    {
                                                                                        ...prev[
                                                                                            post
                                                                                                ._id
                                                                                        ],
                                                                                        banType:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    },
                                                                            }),
                                                                        )
                                                                    }
                                                                    className="w-full rounded-xl border border-red-200 bg-white p-2 text-sm">
                                                                    <option value="temporary">
                                                                        Temporary
                                                                    </option>
                                                                    <option value="permanent">
                                                                        Permanent
                                                                    </option>
                                                                </select>
                                                            </div>
                                                        )}

                                                        {Boolean(
                                                            reviewData[post._id]
                                                                ?.banAuthor,
                                                        ) &&
                                                            (reviewData[
                                                                post._id
                                                            ]?.banType ||
                                                                "permanent") ===
                                                                "temporary" && (
                                                                <div className="mt-4">
                                                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                                                        Expires
                                                                        At
                                                                    </label>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={
                                                                            reviewData[
                                                                                post
                                                                                    ._id
                                                                            ]
                                                                                ?.expiresAt ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setReviewData(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [post._id]:
                                                                                        {
                                                                                            ...prev[
                                                                                                post
                                                                                                    ._id
                                                                                            ],
                                                                                            expiresAt:
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                        },
                                                                                }),
                                                                            )
                                                                        }
                                                                        className="w-full rounded-xl border border-red-200 bg-white p-2 text-sm"
                                                                    />
                                                                </div>
                                                            )}

                                                        <textarea
                                                            value={
                                                                reviewData[
                                                                    post._id
                                                                ]?.note || ""
                                                            }
                                                            onChange={(e) =>
                                                                setReviewData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [post._id]:
                                                                            {
                                                                                ...prev[
                                                                                    post
                                                                                        ._id
                                                                                ],
                                                                                note: e
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                            rows={3}
                                                            placeholder="Add reason (required for delete or ban)."
                                                            className="mt-4 w-full rounded-2xl border border-red-200 bg-white p-3 text-sm"
                                                        />
                                                    </div>

                                                    <div className="mt-4 flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleReviewReportedPost(
                                                                    post._id,
                                                                    "dismiss",
                                                                )
                                                            }
                                                            disabled={Boolean(
                                                                reportActionLoading[
                                                                    post._id
                                                                ],
                                                            )}
                                                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                                            Not an issue
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleReviewReportedPost(
                                                                    post._id,
                                                                    "delete",
                                                                )
                                                            }
                                                            disabled={Boolean(
                                                                reportActionLoading[
                                                                    post._id
                                                                ],
                                                            )}
                                                            className="flex-1 rounded-2xl bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                                                            {reportActionLoading[
                                                                post._id
                                                            ]
                                                                ? "Reviewing..."
                                                                : reviewData[
                                                                        post._id
                                                                    ]?.banAuthor
                                                                  ? "Delete post + ban author"
                                                                  : "Delete post"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-900">
                                        Community Settings
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Update the cover image and rules without
                                        leaving moderation mode.
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
                                                    setNewCommunityCoverImage(
                                                        e.target.files?.[0] ||
                                                            null,
                                                    )
                                                }
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                            <button
                                                onClick={
                                                    handleUpdateCommunityImage
                                                }
                                                disabled={
                                                    !newCommunityCoverImage ||
                                                    updatingCommunityImage
                                                }
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
                                                onChange={(e) =>
                                                    setCommunityRulesDraft(
                                                        e.target.value,
                                                    )
                                                }
                                                rows={5}
                                                placeholder="Write rules for members..."
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                            <button
                                                onClick={
                                                    handleUpdateCommunityRules
                                                }
                                                disabled={savingCommunityRules}
                                                className="mt-2 w-full px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed">
                                                {savingCommunityRules
                                                    ? "Saving rules..."
                                                    : "Save Rules"}
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-900">
                                        Members
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Promote, ban, or remove members from the
                                        community.
                                    </p>
                                    {isCommunityAdmin(
                                        selectedCommunity,
                                        userId,
                                    ) && (
                                        <div className="mb-6 mt-5 p-4 bg-blue-50 rounded-2xl">
                                            <h4 className="text-sm font-bold text-gray-700 mb-3">
                                                Add Member
                                            </h4>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter Username"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    id="addMemberInput"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const usernameToAdd =
                                                            document
                                                                .getElementById(
                                                                    "addMemberInput",
                                                                )
                                                                .value.trim();
                                                        handleAddMember(
                                                            usernameToAdd,
                                                        );
                                                        document.getElementById(
                                                            "addMemberInput",
                                                        ).value = "";
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {communityMembers.members?.map(
                                            (member) => (
                                                <div
                                                    key={member._id}
                                                    className="bg-gray-50 rounded-2xl overflow-hidden">
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={
                                                                    member.profileImage ||
                                                                    defaultAvatar
                                                                }
                                                                className="w-10 h-10 rounded-full border"
                                                                alt=""
                                                            />
                                                            <span className="font-bold text-sm text-gray-900">
                                                                {
                                                                    member.username
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {isCommunityAdmin(
                                                                selectedCommunity,
                                                                userId,
                                                            ) && (
                                                                <button
                                                                    onClick={() => {
                                                                        const isMod =
                                                                            communityMembers.moderators?.some(
                                                                                (
                                                                                    mod,
                                                                                ) => {
                                                                                    const modId =
                                                                                        typeof mod ===
                                                                                        "string"
                                                                                            ? mod
                                                                                            : mod._id;
                                                                                    return (
                                                                                        modId ===
                                                                                        member._id
                                                                                    );
                                                                                },
                                                                            );
                                                                        if (
                                                                            isMod
                                                                        ) {
                                                                            handleDemoteModerator(
                                                                                member._id,
                                                                            );
                                                                        } else {
                                                                            handlePromoteModerator(
                                                                                member._id,
                                                                            );
                                                                        }
                                                                    }}
                                                                    className={`p-2 rounded-lg ${
                                                                        communityMembers.moderators?.some(
                                                                            (
                                                                                mod,
                                                                            ) => {
                                                                                const modId =
                                                                                    typeof mod ===
                                                                                    "string"
                                                                                        ? mod
                                                                                        : mod._id;
                                                                                return (
                                                                                    modId ===
                                                                                    member._id
                                                                                );
                                                                            },
                                                                        )
                                                                            ? "hover:bg-yellow-100 text-yellow-600"
                                                                            : "hover:bg-blue-100 text-blue-600"
                                                                    }`}
                                                                    title={
                                                                        communityMembers.moderators?.some(
                                                                            (
                                                                                mod,
                                                                            ) => {
                                                                                const modId =
                                                                                    typeof mod ===
                                                                                    "string"
                                                                                        ? mod
                                                                                        : mod._id;
                                                                                return (
                                                                                    modId ===
                                                                                    member._id
                                                                                );
                                                                            },
                                                                        )
                                                                            ? "Demote from Moderator"
                                                                            : "Promote to Moderator"
                                                                    }>
                                                                    <Crown className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    setShowBanForm(
                                                                        {
                                                                            ...showBanForm,
                                                                            [member._id]:
                                                                                !showBanForm[
                                                                                    member
                                                                                        ._id
                                                                                ],
                                                                        },
                                                                    );
                                                                    if (
                                                                        !banData[
                                                                            member
                                                                                ._id
                                                                        ]
                                                                    ) {
                                                                        setBanData(
                                                                            {
                                                                                ...banData,
                                                                                [member._id]:
                                                                                    {
                                                                                        banType:
                                                                                            "permanent",
                                                                                        reason: "",
                                                                                        expiresAt:
                                                                                            "",
                                                                                    },
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg">
                                                                <Ban className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveMember(
                                                                        member._id,
                                                                    )
                                                                }
                                                                className="p-2 hover:bg-gray-200 text-gray-500 rounded-lg">
                                                                <UserMinus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Inline Ban Form */}
                                                    {showBanForm[
                                                        member._id
                                                    ] && (
                                                        <div className="px-4 pb-4 border-t border-gray-200 bg-red-50">
                                                            <div className="pt-3 space-y-3">
                                                                <h4 className="font-bold text-sm text-red-700">
                                                                    Ban{" "}
                                                                    {
                                                                        member.username
                                                                    }
                                                                </h4>

                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Ban Type
                                                                    </label>
                                                                    <select
                                                                        value={
                                                                            banData[
                                                                                member
                                                                                    ._id
                                                                            ]
                                                                                ?.banType ||
                                                                            "permanent"
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setBanData(
                                                                                {
                                                                                    ...banData,
                                                                                    [member._id]:
                                                                                        {
                                                                                            ...banData[
                                                                                                member
                                                                                                    ._id
                                                                                            ],
                                                                                            banType:
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                        },
                                                                                },
                                                                            )
                                                                        }
                                                                        className="w-full p-2 text-sm border border-gray-300 rounded">
                                                                        <option value="temporary">
                                                                            Temporary
                                                                        </option>
                                                                        <option value="permanent">
                                                                            Permanent
                                                                        </option>
                                                                    </select>
                                                                </div>

                                                                {banData[
                                                                    member._id
                                                                ]?.banType ===
                                                                    "temporary" && (
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                            Expires
                                                                            At
                                                                        </label>
                                                                        <input
                                                                            type="datetime-local"
                                                                            value={
                                                                                banData[
                                                                                    member
                                                                                        ._id
                                                                                ]
                                                                                    ?.expiresAt ||
                                                                                ""
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setBanData(
                                                                                    {
                                                                                        ...banData,
                                                                                        [member._id]:
                                                                                            {
                                                                                                ...banData[
                                                                                                    member
                                                                                                        ._id
                                                                                                ],
                                                                                                expiresAt:
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                            },
                                                                                    },
                                                                                )
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
                                                                        value={
                                                                            banData[
                                                                                member
                                                                                    ._id
                                                                            ]
                                                                                ?.reason ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setBanData(
                                                                                {
                                                                                    ...banData,
                                                                                    [member._id]:
                                                                                        {
                                                                                            ...banData[
                                                                                                member
                                                                                                    ._id
                                                                                            ],
                                                                                            reason: e
                                                                                                .target
                                                                                                .value,
                                                                                        },
                                                                                },
                                                                            )
                                                                        }
                                                                        className="w-full p-2 text-sm border border-gray-300 rounded"
                                                                        placeholder="Reason for ban..."
                                                                        rows="2"
                                                                    />
                                                                </div>

                                                                <div className="flex gap-2 pt-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            setShowBanForm(
                                                                                {
                                                                                    ...showBanForm,
                                                                                    [member._id]: false,
                                                                                },
                                                                            )
                                                                        }
                                                                        className="flex-1 px-3 py-2 bg-gray-400 text-white rounded text-sm font-medium hover:bg-gray-500">
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleBanUser(
                                                                                member._id,
                                                                            )
                                                                        }
                                                                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700">
                                                                        Ban User
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">
                                                    Ban Appeals
                                                </h4>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Banned users can plead their
                                                    case here. Approving an
                                                    appeal restores them to the
                                                    community.
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                                                {pendingAppeals.length} pending
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-4">
                                            {pendingAppeals.length === 0 ? (
                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                                                    No pending appeals right
                                                    now.
                                                </div>
                                            ) : (
                                                pendingAppeals.map(
                                                    (banEntry) => {
                                                        const bannedUser =
                                                            banEntry.user;
                                                        const bannedUserId =
                                                            typeof bannedUser ===
                                                            "string"
                                                                ? bannedUser
                                                                : bannedUser?._id;
                                                        const appealKey = `appeal-${bannedUserId}`;
                                                        return (
                                                            <div
                                                                key={
                                                                    bannedUserId
                                                                }
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
                                                                                {banEntry.banType ===
                                                                                    "temporary" &&
                                                                                banEntry.expiresAt
                                                                                    ? `Temporary ban until ${new Date(banEntry.expiresAt).toLocaleString()}`
                                                                                    : "Permanent ban"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleUnbanUser(
                                                                                bannedUserId,
                                                                            )
                                                                        }
                                                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                                                        Unban
                                                                        directly
                                                                    </button>
                                                                </div>

                                                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                                        Appeal
                                                                        message
                                                                    </p>
                                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                                                        {
                                                                            banEntry.appealMessage
                                                                        }
                                                                    </p>
                                                                </div>

                                                                <textarea
                                                                    value={
                                                                        reviewData[
                                                                            appealKey
                                                                        ]
                                                                            ?.note ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setReviewData(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [appealKey]:
                                                                                    {
                                                                                        ...prev[
                                                                                            appealKey
                                                                                        ],
                                                                                        note: e
                                                                                            .target
                                                                                            .value,
                                                                                    },
                                                                            }),
                                                                        )
                                                                    }
                                                                    rows={3}
                                                                    placeholder="Optional note for the banned user"
                                                                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                                                                />

                                                                <div className="mt-4 flex gap-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            handleReviewBanAppeal(
                                                                                bannedUserId,
                                                                                "reject",
                                                                            )
                                                                        }
                                                                        disabled={Boolean(
                                                                            appealReviewLoading[
                                                                                bannedUserId
                                                                            ],
                                                                        )}
                                                                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                                                        Reject
                                                                        appeal
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleReviewBanAppeal(
                                                                                bannedUserId,
                                                                                "approve",
                                                                            )
                                                                        }
                                                                        disabled={Boolean(
                                                                            appealReviewLoading[
                                                                                bannedUserId
                                                                            ],
                                                                        )}
                                                                        className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                                                        {appealReviewLoading[
                                                                            bannedUserId
                                                                        ]
                                                                            ? "Reviewing..."
                                                                            : "Approve and restore"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )
                                            )}
                                        </div>
                                    </div>
                                    {isCommunityAdmin(
                                        selectedCommunity,
                                        userId,
                                    ) && (
                                        <button
                                            onClick={() =>
                                                handleRequestDeletion(
                                                    selectedCommunity._id,
                                                )
                                            }
                                            className="mt-6 w-full px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                                            Request Community Deletion
                                        </button>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Categorize communities based on user status
    const categorizedCommunities = categorizeCommunitiesByStatus(
        communities,
        userId,
    );

    // MAIN LAYOUT (Explore Communities Center + My Communities Right Sidebar)
    return (
        <div className="min-h-screen bg-slate-50 font-sans flex">
            {/* Left Sidebar */}
            <Sidebar
                showLogoutConfirm={showLogoutConfirm}
                setShowLogoutConfirm={setShowLogoutConfirm}
                onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <main className={`flex-1 ${mainContentClass}`}>
                <div className="max-w-400 mx-auto w-full px-6 py-8 flex gap-8">
                    {/* Center Content - Explore Communities */}
                    <div className="flex-1 max-w-4xl">
                        {loading ? (
                            <div className="space-y-8">
                                <div className="animate-pulse">
                                    <div className="h-8 bg-slate-200 rounded w-64 mb-4"></div>
                                    <div className="h-4 bg-slate-100 rounded w-96"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                                            <div className="h-32 bg-slate-200 rounded-lg mb-4"></div>
                                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <PageHeader
                                    className="mb-12"
                                    eyebrow="Communities"
                                    title="Explore Communities"
                                    description="Discover new collaborative spaces and connect with like-minded learners."
                                />

                                <div className="flex items-center gap-4 mt-8">
                                    {isAdmin && (
                                        <button
                                            onClick={() =>
                                                setShowAdminDashboard(true)
                                            }
                                            className="px-6 py-3.5 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-white hover:shadow-lg hover:border-blue-200 transition-all flex items-center justify-center gap-2 group">
                                            <Shield className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                                            Admin
                                            {pendingRequests.pendingCreations
                                                .length > 0 && (
                                                <span className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                                                    {
                                                        pendingRequests
                                                            .pendingCreations
                                                            .length
                                                    }
                                                </span>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-5 h-5" /> Create
                                        Community
                                    </button>
                                </div>

                                {/* Explore Communities Grid */}
                                {recommendedCommunities.length > 0 ? (
                                    <section>
                                        <div className="flex items-center gap-3 mb-8">
                                            <svg
                                                className="w-6 h-6 text-blue-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                            <h2 className="text-2xl font-bold text-slate-800">
                                                Discover New Communities
                                            </h2>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {recommendedCommunities.length}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {recommendedCommunities.map(
                                                (community) => (
                                                    <CommunityCard
                                                        key={community._id}
                                                        community={community}
                                                        userId={userId}
                                                        onViewCommunity={
                                                            handleViewCommunity
                                                        }
                                                        onJoinCommunity={
                                                            handleJoinCommunity
                                                        }
                                                        isRecommended={true}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </section>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <svg
                                                className="w-10 h-10 text-blue-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 mb-2">
                                            No New Communities to Explore
                                        </h3>
                                        <p className="text-slate-500 mb-6">
                                            All communities are either joined or
                                            pending. Check back later for new
                                            ones!
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Sidebar - My Communities */}
                    <aside className="w-80 space-y-6">
                        {/* Communities I Lead */}
                        {categorizedCommunities.myCommunitiesOwned.length >
                            0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Crown className="w-5 h-5 text-yellow-600" />
                                    <h3 className="font-bold text-slate-900">
                                        Communities I Lead
                                    </h3>
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                        {
                                            categorizedCommunities
                                                .myCommunitiesOwned.length
                                        }
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {categorizedCommunities.myCommunitiesOwned.map(
                                        (community) => (
                                            <div
                                                key={community._id}
                                                onClick={() =>
                                                    handleViewCommunity(
                                                        community,
                                                    )
                                                }
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-50 cursor-pointer transition-colors border border-yellow-200">
                                                <img
                                                    src={
                                                        community.coverImage ||
                                                        defaultHeader
                                                    }
                                                    className="w-12 h-12 rounded-lg object-cover border border-yellow-200"
                                                    alt={community.name}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-slate-900 truncate">
                                                        {community.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {community.members
                                                            ?.length || 0}{" "}
                                                        members
                                                    </p>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {/* My Communities */}
                        {categorizedCommunities.myCommunitiesJoined.length >
                            0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-5 h-5 text-green-600" />
                                    <h3 className="font-bold text-slate-900">
                                        My Communities
                                    </h3>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        {
                                            categorizedCommunities
                                                .myCommunitiesJoined.length
                                        }
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {categorizedCommunities.myCommunitiesJoined.map(
                                        (community) => (
                                            <div
                                                key={community._id}
                                                onClick={() =>
                                                    handleViewCommunity(
                                                        community,
                                                    )
                                                }
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 cursor-pointer transition-colors border border-green-200">
                                                <img
                                                    src={
                                                        community.coverImage ||
                                                        defaultHeader
                                                    }
                                                    className="w-12 h-12 rounded-lg object-cover border border-green-200"
                                                    alt={community.name}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-slate-900 truncate">
                                                        {community.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {community.members
                                                            ?.length || 0}{" "}
                                                        members
                                                    </p>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pending Requests */}
                        {categorizedCommunities.pendingRequests.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    <h3 className="font-bold text-slate-900">
                                        Pending Requests
                                    </h3>
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                        {
                                            categorizedCommunities
                                                .pendingRequests.length
                                        }
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {categorizedCommunities.pendingRequests.map(
                                        (community) => (
                                            <div
                                                key={community._id}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                                                <img
                                                    src={
                                                        community.coverImage ||
                                                        defaultHeader
                                                    }
                                                    className="w-12 h-12 rounded-lg object-cover opacity-75"
                                                    alt={community.name}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-slate-900 truncate">
                                                        {community.name}
                                                    </h4>
                                                    <p className="text-xs text-yellow-600 font-medium">
                                                        Pending approval
                                                    </p>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {categorizedCommunities.myCommunitiesOwned.length ===
                            0 &&
                            categorizedCommunities.myCommunitiesJoined
                                .length === 0 &&
                            categorizedCommunities.pendingRequests.length ===
                                0 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-2">
                                        No Communities Yet
                                    </h3>
                                    <p className="text-slate-500 text-sm mb-6">
                                        Join some communities to see them here!
                                    </p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Create
                                        Community
                                    </button>
                                </div>
                            )}
                    </aside>
                </div>
            </main>

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

            {/* Ban Appeal Modal (shown when user is banned and cannot join) */}
            {banAppealModal.open && (
                <div className="fixed inset-0 z-50 flex justify-center items-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeBanAppealModal}
                    />
                    <div className="relative bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-slate-200">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-black text-lg text-slate-900">
                                    Banned from community
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    You are banned from{" "}
                                    <span className="font-bold text-slate-900">
                                        {banAppealModal.community?.name ||
                                            "this community"}
                                    </span>
                                    .
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeBanAppealModal}
                                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
                                Close
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {banAppealModal.banEntry?.sourcePostId && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-bold">
                                        Related post:
                                    </span>{" "}
                                    {String(
                                        banAppealModal.banEntry.sourcePostId,
                                    )}
                                </div>
                            )}

                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                <span className="font-bold">Reason:</span>{" "}
                                {banAppealModal.banEntry?.reason
                                    ? banAppealModal.banEntry.reason
                                    : "The community staff removed you from this community."}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-bold text-slate-900">
                                    Plead your case
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Explain what happened and why you should be
                                    allowed back. Community staff will review
                                    your appeal.
                                </p>
                                <textarea
                                    value={banAppealDraft}
                                    onChange={(e) =>
                                        setBanAppealDraft(e.target.value)
                                    }
                                    rows={4}
                                    disabled={
                                        banAppealSubmitting ||
                                        banAppealModal.banEntry
                                            ?.appealStatus === "pending"
                                    }
                                    placeholder="Write your appeal to the community staff..."
                                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm disabled:bg-slate-50"
                                />

                                {banAppealModal.banEntry?.appealStatus ===
                                    "pending" && (
                                    <p className="mt-3 text-sm font-medium text-amber-700">
                                        Your appeal is pending review.
                                    </p>
                                )}

                                {banAppealModal.banEntry?.appealStatus ===
                                    "rejected" &&
                                    banAppealModal.banEntry
                                        ?.appealReviewNote && (
                                        <p className="mt-3 text-sm text-slate-600">
                                            Last staff note:{" "}
                                            {
                                                banAppealModal.banEntry
                                                    .appealReviewNote
                                            }
                                        </p>
                                    )}

                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={closeBanAppealModal}
                                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200">
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmitBanAppealFromModal}
                                        disabled={
                                            banAppealSubmitting ||
                                            banAppealModal.banEntry
                                                ?.appealStatus === "pending"
                                        }
                                        className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">
                                        {banAppealSubmitting
                                            ? "Submitting..."
                                            : "Submit appeal"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunitiesPage;
