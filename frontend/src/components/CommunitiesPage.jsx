import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.png';
import defaultHeader from '../assets/default-header.jpeg';
import defaultAvatar from '../assets/default-avatar.jpg';
import { clearAuth } from '../utils/tokenUtils';

// SVG Icon Components
const Users = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const Plus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const Check = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const X = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const Shield = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const Crown = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l7 7 7-7M5 21h14M5 21l2-6m12 6l-2-6" />
  </svg>
);
const Settings = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const Ban = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);
const UserMinus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
  </svg>
);
const AlertCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const Heart = ({ className, filled = false }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const MessageCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const CommunitiesPage = () => {
  const [communities, setCommunities] = useState([]);
  const [pendingRequests, setPendingRequests] = useState({ pendingCreations: [], pendingDeletions: [] });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showCommunityAdminPanel, setShowCommunityAdminPanel] = useState(false);
  const [communityMembers, setCommunityMembers] = useState({ members: [], admins: [], moderators: [], bannedUsers: [] });
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostTags, setNewPostTags] = useState([]);
  const [newPostPreview, setNewPostPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBanForm, setShowBanForm] = useState({});
  const [banData, setBanData] = useState({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [newComment, setNewComment] = useState({});

  // const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const location = useLocation();
  const API_BASE = 'http://localhost:4000/api';
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId') || localStorage.getItem('userId');
  const adminToken = localStorage.getItem('adminToken');

  const isHome = location.pathname === '/';
  const isProfile = location.pathname.startsWith('/profile');
  const isCommunities = location.pathname.startsWith('/communities');
  const isMarketplace = location.pathname.startsWith('/marketplace');
  const isEvents = location.pathname.startsWith('/events');
  const isNotifications = location.pathname.startsWith('/notifications');
  const isSettings = location.pathname.startsWith('/settings');

  useEffect(() => {
    checkAdminStatus();
    loadCommunities();
    
    // Check if a community ID is in URL params
    const communityIdParam = new URLSearchParams(window.location.search).get('communityId');
    if (communityIdParam) {
      // Find and load that community
      const loadCommunityFromParam = async () => {
        try {
          const res = await fetch(`${API_BASE}/communities/${communityIdParam}?userId=${userId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedCommunity(data);
            await loadCommunityPosts(communityIdParam);
          }
        } catch (err) {
          console.error('Error loading community:', err);
        }
      };
      loadCommunityFromParam();
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadPendingRequests();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!newPostImage) return setNewPostPreview(null);
    const objectUrl = URL.createObjectURL(newPostImage);
    setNewPostPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [newPostImage]);

  const addTagsFromText = () => {
    const hashtagRegex = /#(\w+)/g;
    const matches = newPostText.match(hashtagRegex) || [];
    const pieces = matches.map(tag => tag.slice(1));
    const merged = Array.from(new Set([...newPostTags, ...pieces]));
    setNewPostTags(merged);
  };

  const removeTag = (tag) => {
    setNewPostTags((prev) => prev.filter((t) => t !== tag));
  };

  const checkAdminStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-admin`, {
        headers: { 'x-admin-token': adminToken || '' }
      });
      const data = await res.json();
      setIsAdmin(data.isAdmin || false);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadCommunities = async () => {
    try {
      const adminParam = isAdmin ? '&admin=true' : '';
      const url = `${API_BASE}/communities?userId=${userId}${adminParam}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setCommunities(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/communities/pending/all`, {
        headers: { 'x-admin-token': adminToken || '' }
      });
      const data = await res.json();
      if (res.ok) setPendingRequests(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadCommunityDetails = async (communityId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/members?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setCommunityMembers(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadCommunityPosts = async (communityId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/posts`);
      const data = await res.json();
      if (res.ok) setCommunityPosts(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    formData.append('creatorId', userId);
    try {
      const res = await fetch(`${API_BASE}/communities`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setShowCreateModal(false);
        e.target.reset();
        alert('Community request submitted!');
        if (isAdmin) loadPendingRequests();
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed');
      }
    } catch (err) {
      alert('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommunity = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${id}/approve`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' }
      });
      if (res.ok) {
        alert('Approved!');
        loadPendingRequests();
        loadCommunities();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleRejectCommunity = async (id) => {
    if (!window.confirm('Reject?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${id}/reject`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' }
      });
      if (res.ok) {
        alert('Rejected');
        loadPendingRequests();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleApproveDeletion = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${id}/approve-deletion`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' }
      });
      if (res.ok) {
        alert('Approved deletion!');
        loadPendingRequests();
        loadCommunities();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleRejectDeletion = async (id) => {
    if (!window.confirm('Reject deletion?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${id}/reject-deletion`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' }
      });
      if (res.ok) {
        alert('Rejected deletion');
        loadPendingRequests();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    if (!window.confirm('Are you sure you want to leave this community?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        alert('Left community');
        setSelectedCommunity(null);
        loadCommunities();
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to leave');
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Joined community!');
        loadCommunityDetails(communityId);
        loadCommunities();
      } else {
        alert(data.msg || 'Failed to join');
      }
    } catch (err) {
      console.error(err);
      alert('Error joining community');
    }
  };

  const handleViewCommunity = async (community) => {
    setSelectedCommunity(community);
    // Add community ID to URL params
    window.history.pushState({}, '', `?communityId=${community._id}&userId=${userId}`);
    await loadCommunityPosts(community._id);
    if (isCommunityAdmin(community) || isCommunityModerator(community)) {
      await loadCommunityDetails(community._id);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImage) return;
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('text', newPostText);
    if (newPostImage) {
      formData.append('image', newPostImage);
    }
    if (newPostTags.length) {
      formData.append('tags', JSON.stringify(newPostTags));
    }
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/posts`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setNewPostText('');
        setNewPostImage(null);
        setNewPostPreview(null);
        setNewPostTags([]);
        loadCommunityPosts(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to create post');
      }
    } catch (err) {
      alert('Error creating post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
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
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text })
      });
      if (res.ok) {
        setNewComment({ ...newComment, [postId]: '' });
        loadCommunityPosts(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to add comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding comment');
    }
  };

  const handleDeleteComment = async (postId, commentIdx) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}/comments/${commentIdx}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        loadCommunityPosts(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to delete comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting comment');
    }
  };

  const handleAddMember = async (usernameToAdd) => {
    if (!usernameToAdd) {
      alert('Please enter a username');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/add-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUsername: usernameToAdd })
      });
      if (res.ok) {
        alert('Member added');
        loadCommunityDetails(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to add member');
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove member?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/remove-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId: memberId })
      });
      if (res.ok) {
        alert('Removed');
        loadCommunityDetails(selectedCommunity._id);
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        alert('Post deleted');
        loadCommunityPosts(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to delete post');
      }
    } catch (err) {
      alert('Error deleting post');
    }
  };

  const handleBanUser = async (memberId) => {
    const memberBanData = banData[memberId];
    if (!memberBanData) {
      alert('Please fill in ban details');
      return;
    }
    
    if (!selectedCommunity) {
      alert('No community selected');
      return;
    }
    
    try {
      const requestBody = {
        userId,
        targetUserId: memberId,
        banType: memberBanData.banType || 'permanent',
        reason: memberBanData.reason || '',
        expiresAt: memberBanData.expiresAt || ''
      };
      
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/ban-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('User banned successfully');
        // Clear the ban form for this member
        setShowBanForm({ ...showBanForm, [memberId]: false });
        setBanData({ ...banData, [memberId]: null });
        loadCommunityDetails(selectedCommunity._id);
      } else {
        alert(data.msg || 'Failed to ban user');
      }
    } catch (err) {
      console.error('Error banning user:', err);
      alert('Error banning user');
    }
  };

  const handlePromoteModerator = async (memberId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId: memberId })
      });
      if (res.ok) {
        alert('Promoted!');
        loadCommunityDetails(selectedCommunity._id);
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleDemoteModerator = async (memberId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/demote-moderator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId: memberId })
      });
      if (res.ok) {
        alert('Demoted!');
        loadCommunityDetails(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Error demoting user');
      }
    } catch (err) {
      alert('Error demoting user');
    }
  };

  const handleRequestDeletion = async (communityId) => {
    if (!window.confirm('Request deletion of this community? A site admin will review your request.')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/request-deletion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        alert('Deletion request submitted. Waiting for admin approval.');
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to request deletion');
      }
    } catch (err) {
      alert('Error requesting deletion');
    }
  };

  const isCommunityAdmin = (community) => {
    if (!community?.admins || !userId) return false;
    return community.admins.some(admin => {
      const adminId = typeof admin === 'string' ? admin : admin._id;
      return adminId === userId;
    });
  };

  const isCommunityModerator = (community) => {
    if (!community?.moderators || !userId) return false;
    return community.moderators.some(mod => {
      const modId = typeof mod === 'string' ? mod : mod._id;
      return modId === userId;
    });
  };

  const isMember = (community) => {
    if (!community?.members || !userId) return false;
    return community.members.some(member => {
      const memberId = typeof member === 'string' ? member : member._id;
      return memberId === userId;
    });
  };

  const getRoleLabel = (community) => {
    if (isCommunityAdmin(community)) return 'Admin';
    if (isCommunityModerator(community)) return 'Moderator';
    if (isMember(community)) return 'Member';
    return null;
  };

  // COMMUNITY DETAIL VIEW (RENDERED IF A COMMUNITY IS SELECTED)
  if (selectedCommunity) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-50 border-r border-gray-200 bg-white py-8 px-6 gap-6 fixed inset-y-0 left-0">
          <div className="px-1">
            <img src={logo} alt="SkillNest Logo" className="h-20 mb-2" />
            <p className="mt-1 text-xs text-gray-500">Your learning space</p>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"><span>Home</span></Link>
            <Link to={`/profile?userId=${userId}`} className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"><span>Profile</span></Link>
            <Link to="/communities" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600"><span>Communities</span></Link>
            <Link to="/marketplace" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"><span>Marketplace</span></Link>
            <Link to="/events" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"><span>Events</span></Link>
            <Link to="/notifications" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"><span>Notifications</span></Link>
            <Link to="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"><span>Settings</span></Link>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left border-none bg-transparent cursor-pointer"
            >
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Detail Content */}
        <div className="flex-1 md:ml-72 flex justify-center px-4 py-8">
          <div className="w-full max-w-4xl space-y-6">
            <button 
              onClick={() => {
                setSelectedCommunity(null);
                window.history.pushState({}, '', `?userId=${userId}`);
              }}
              className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Back to List
            </button>

            <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              {selectedCommunity.coverImage ? (
                <img src={selectedCommunity.coverImage} className="w-full h-48 object-cover" alt="" />
              ) : (
                <img src={defaultHeader} className="w-full h-48 object-cover" alt="Default header" />
              )}
              <div className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-black text-gray-900">{selectedCommunity.name}</h1>
                    <p className="text-gray-500 mt-2">{selectedCommunity.description}</p>
                    <div className="mt-4 flex gap-3">
                      {isMember(selectedCommunity) ? (
                        <button 
                          onClick={() => handleLeaveCommunity(selectedCommunity._id)} 
                          className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                        >
                          Leave Community
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleJoinCommunity(selectedCommunity._id)} 
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                        >
                          Join Community
                        </button>
                      )}
                    </div>
                  </div>
                  {(isCommunityAdmin(selectedCommunity) || isCommunityModerator(selectedCommunity)) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        loadCommunityDetails(selectedCommunity._id);
                        setShowCommunityAdminPanel(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      <Settings className="w-4 h-4" /> Manage
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Post Feed */}
            <div className="space-y-4">
               {isMember(selectedCommunity) && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                   <div className="p-4">
                     <div className="flex gap-3 mb-4">
                       <img
                         src={selectedCommunity.currentUserImage || defaultAvatar}
                         alt="Avatar"
                         className="w-10 h-10 rounded-full object-cover shrink-0"
                       />
                       <div className="flex-1">
                         <textarea
                           value={newPostText}
                           onChange={(e) => setNewPostText(e.target.value)}
                           placeholder="What's on your mind?"
                           className="w-full px-4 py-3 rounded-lg border-none resize-none text-base font-sans text-gray-700 placeholder-gray-400 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                           rows="4"
                         />
                       </div>
                     </div>

                     {newPostPreview && (
                       <div className="relative mb-4 rounded-lg overflow-hidden border border-gray-200">
                         <img
                           src={newPostPreview}
                           alt="Post Preview"
                           className="w-full max-h-96 object-cover"
                         />
                         <button
                           onClick={() => {
                             setNewPostImage(null);
                             setNewPostPreview(null);
                           }}
                           className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                           title="Remove image"
                         >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                           </svg>
                         </button>
                       </div>
                     )}

                     <div className="mt-2 mb-3 flex flex-wrap items-center gap-2 px-1">
                       {newPostTags.map((tag) => (
                         <span
                           key={tag}
                           className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                         >
                           <span>#{tag}</span>
                           <button
                             type="button"
                             onClick={() => removeTag(tag)}
                             className="text-blue-500 hover:text-blue-700"
                           >
                             ×
                           </button>
                         </span>
                       ))}
                     </div>

                     <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                       <div className="flex items-center gap-4">
                         <label className="flex items-center gap-2 text-gray-600 hover:text-blue-500 cursor-pointer transition-colors">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                           <span className="text-sm font-medium">Photo</span>
                           <input 
                             type="file" 
                             accept="image/*"
                             onChange={(e) => setNewPostImage(e.target.files[0])} 
                             className="hidden" 
                           />
                         </label>
                       </div>
                       <button 
                         onClick={handleCreatePost}
                         disabled={!newPostText.trim() && !newPostImage}
                         className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                       >
                         Post
                       </button>
                     </div>
                   </div>
                 </div>
               )}
               
               <div className="space-y-4">
                 {communityPosts.map(post => (
                    <div key={post._id} className="bg-white p-6 rounded-3xl border border-gray-200 relative">
                       <div className="flex items-center gap-3 mb-4">
                         <img src={post.user?.profileImage || defaultAvatar} className="w-10 h-10 rounded-full border" alt="" />
                         <div className="flex-1">
                           <span className="font-bold text-sm text-gray-900 block">{post.user?.username || 'Unknown User'}</span>
                           <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                         </div>
                       </div>
                       {post.text && <p className="text-gray-800 mb-3">{post.text}</p>}
                       {post.image && (
                         <div className="rounded-xl overflow-hidden mb-3 border border-gray-200 bg-gray-50 flex items-center justify-center max-h-96">
                           <img src={post.image} className="w-full h-auto object-contain" alt="" />
                         </div>
                       )}
                       {Array.isArray(post.tags) && post.tags.length > 0 && (
                         <div className="flex flex-wrap gap-2 mb-3">
                           {post.tags.map((tag) => (
                             <span key={tag} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium">
                               #{tag}
                             </span>
                           ))}
                         </div>
                       )}
                       <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                         {(() => {
                           const isLiked = post.likes?.some(likeUserId => {
                             const id = typeof likeUserId === 'string' ? likeUserId : likeUserId._id;
                             return id === userId;
                           });
                           return (
                             <button 
                               onClick={() => handleLikePost(post._id)}
                               className={`flex items-center gap-2 text-sm transition-colors ${
                                 isLiked 
                                   ? 'text-red-600' 
                                   : 'text-gray-600 hover:text-red-600'
                               }`}
                             >
                               <Heart className="w-5 h-5" filled={isLiked} />
                               {post.likes?.length || 0}
                             </button>
                           );
                         })()}
                         <button 
                           onClick={() => setExpandedComments({ ...expandedComments, [post._id]: !expandedComments[post._id] })}
                           className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                         >
                           <MessageCircle className="w-5 h-5" />
                           {post.comments?.length || 0}
                         </button>
                       </div>
                       {expandedComments[post._id] && (
                         <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                           <div className="space-y-2 max-h-48 overflow-y-auto">
                             {post.comments?.map((comment, idx) => {
                               const commentUserId = typeof comment.user === 'string' ? comment.user : comment.user._id;
                               const isCommentOwner = commentUserId === userId;
                               const isAdmin = isCommunityAdmin(selectedCommunity);
                               const canDelete = isCommentOwner || isAdmin;
                               return (
                                 <div key={idx} className="bg-gray-50 p-3 rounded-lg relative">
                                   <div className="flex flex-col items-start gap-2 mb-3">
                                     <img src={comment.user?.profileImage || defaultAvatar} className="w-8 h-8 rounded-full" alt="" />
                                     <div className="flex items-center gap-2 w-full">
                                       <span className="font-semibold text-sm">{comment.user?.username}</span>
                                       {canDelete && (
                                         <button 
                                           onClick={() => handleDeleteComment(post._id, idx)}
                                           className="ml-auto text-gray-400 hover:text-red-600 text-xs font-medium"
                                         >
                                           Delete
                                         </button>
                                       )}
                                     </div>
                                   </div>
                                   <p className="text-sm text-gray-700">{comment.text}</p>
                                 </div>
                               );
                             })}
                           </div>
                           <div className="flex gap-2">
                             <input 
                               type="text"
                               value={newComment[post._id] || ''}
                               onChange={(e) => setNewComment({ ...newComment, [post._id]: e.target.value })}
                               placeholder="Add a comment..."
                               className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                             />
                             <button 
                               onClick={() => handleAddComment(post._id)}
                               className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                             >
                               Post
                             </button>
                           </div>
                         </div>
                       )}
                       {(() => {
                         const postUserId = typeof post.user === 'string' ? post.user : post.user._id;
                         const isPostOwner = postUserId === userId;
                         const isAdmin = isCommunityAdmin(selectedCommunity);
                         const isMod = isCommunityModerator(selectedCommunity);
                         const canDelete = isPostOwner || isAdmin || isMod;
                         
                         return canDelete ? (
                           <button 
                             onClick={() => handleDeletePost(post._id)} 
                             className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-sm font-medium"
                           >
                             Delete
                           </button>
                         ) : null;
                       })()}
                    </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT DRAWER ADMIN PANEL */}
        {showCommunityAdminPanel && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCommunityAdminPanel(false)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b flex justify-between items-center bg-gray-900 text-white">
                <h2 className="font-black flex items-center gap-2"><Shield className="w-5 h-5" /> Community Admin</h2>
                <button onClick={() => setShowCommunityAdminPanel(false)}><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Members</h3>
                {isCommunityAdmin(selectedCommunity) && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Add Member</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Username"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        id="addMemberInput"
                      />
                      <button
                        onClick={() => {
                          const usernameToAdd = document.getElementById('addMemberInput').value.trim();
                          handleAddMember(usernameToAdd);
                          document.getElementById('addMemberInput').value = '';
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {communityMembers.members?.map(member => (
                    <div key={member._id} className="bg-gray-50 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <img src={member.profileImage || defaultAvatar} className="w-10 h-10 rounded-full border" alt="" />
                          <span className="font-bold text-sm text-gray-900">{member.username}</span>
                        </div>
                        <div className="flex gap-2">
                          {isCommunityAdmin(selectedCommunity) && (
                            <button 
                              onClick={() => {
                                const isMod = communityMembers.moderators?.some(mod => {
                                  const modId = typeof mod === 'string' ? mod : mod._id;
                                  return modId === member._id;
                                });
                                if (isMod) {
                                  handleDemoteModerator(member._id);
                                } else {
                                  handlePromoteModerator(member._id);
                                }
                              }} 
                              className={`p-2 rounded-lg ${ 
                                communityMembers.moderators?.some(mod => {
                                  const modId = typeof mod === 'string' ? mod : mod._id;
                                  return modId === member._id;
                                }) 
                                  ? 'hover:bg-yellow-100 text-yellow-600' 
                                  : 'hover:bg-blue-100 text-blue-600'
                              }`}
                              title={communityMembers.moderators?.some(mod => {
                                const modId = typeof mod === 'string' ? mod : mod._id;
                                return modId === member._id;
                              }) ? 'Demote from Moderator' : 'Promote to Moderator'}
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setShowBanForm({ 
                                ...showBanForm, 
                                [member._id]: !showBanForm[member._id] 
                              });
                              if (!banData[member._id]) {
                                setBanData({ 
                                  ...banData, 
                                  [member._id]: { banType: 'permanent', reason: '', expiresAt: '' }
                                });
                              }
                            }} 
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRemoveMember(member._id)} className="p-2 hover:bg-gray-200 text-gray-500 rounded-lg"><UserMinus className="w-4 h-4" /></button>
                        </div>
                      </div>
                      
                      {/* Inline Ban Form */}
                      {showBanForm[member._id] && (
                        <div className="px-4 pb-4 border-t border-gray-200 bg-red-50">
                          <div className="pt-3 space-y-3">
                            <h4 className="font-bold text-sm text-red-700">Ban {member.username}</h4>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Ban Type</label>
                              <select 
                                value={banData[member._id]?.banType || 'permanent'} 
                                onChange={(e) => setBanData({
                                  ...banData,
                                  [member._id]: { ...banData[member._id], banType: e.target.value }
                                })}
                                className="w-full p-2 text-sm border border-gray-300 rounded"
                              >
                                <option value="temporary">Temporary</option>
                                <option value="permanent">Permanent</option>
                              </select>
                            </div>
                            
                            {banData[member._id]?.banType === 'temporary' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Expires At</label>
                                <input 
                                  type="datetime-local" 
                                  value={banData[member._id]?.expiresAt || ''} 
                                  onChange={(e) => setBanData({
                                    ...banData,
                                    [member._id]: { ...banData[member._id], expiresAt: e.target.value }
                                  })}
                                  className="w-full p-2 text-sm border border-gray-300 rounded" 
                                />
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                              <textarea 
                                value={banData[member._id]?.reason || ''} 
                                onChange={(e) => setBanData({
                                  ...banData,
                                  [member._id]: { ...banData[member._id], reason: e.target.value }
                                })}
                                className="w-full p-2 text-sm border border-gray-300 rounded" 
                                placeholder="Reason for ban..."
                                rows="2"
                              />
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={() => setShowBanForm({ ...showBanForm, [member._id]: false })} 
                                className="flex-1 px-3 py-2 bg-gray-400 text-white rounded text-sm font-medium hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleBanUser(member._id)} 
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                              >
                                Ban User
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isCommunityAdmin(selectedCommunity) && (
                  <button 
                    onClick={() => handleRequestDeletion(selectedCommunity._id)} 
                    className="mt-6 w-full px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                  >
                    Request Community Deletion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN LIST VIEW (The Grid UI)
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Sidebar navigation */}
      <aside className="hidden lg:flex flex-col w-50 border-r border-gray-200 bg-white py-8 px-6 gap-6 fixed inset-y-0 left-0">
        <div className="px-1">
          <img src={logo} alt="SkillNest Logo" className="h-20 mb-2" />
          <p className="mt-1 text-xs text-gray-500">Your learning space</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <span>Home</span>
          </Link>
          <Link
            to={`/profile?userId=${userId}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <span>Profile</span>
          </Link>
          <Link
            to="/communities"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600"
          >
            <span>Communities</span>
          </Link>
          <Link
            to="/marketplace"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <span>Marketplace</span>
          </Link>
          <Link
            to="/events"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <span>Events</span>
          </Link>
          <Link
            to="/notifications"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <span>Notifications</span>
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <span>Settings</span>
          </Link>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left border-none bg-transparent cursor-pointer"
          >
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full px-6 py-10">
          
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Explore Communities</h1>
              <p className="text-slate-500 font-medium text-lg">Join collaborative spaces tailored to your learning path.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {isAdmin && (
                <button 
                  onClick={() => setShowAdminDashboard(true)}
                  className="flex-1 md:flex-none px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4 text-blue-500" /> 
                  Admin <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px]">{pendingRequests.pendingCreations.length}</span>
                </button>
              )}
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create
              </button>
            </div>
          </header>

          {/* THE GRID LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {communities.map((community) => (
              <div 
                key={community._id}
                onClick={() => handleViewCommunity(community)}
                className="group relative bg-white rounded-[32px] border border-slate-100 p-4 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col h-full"
              >
                {/* Image Container */}
                <div className="relative w-full h-48 rounded-[24px] overflow-hidden bg-slate-100 mb-5">
                  <img 
                    src={community.coverImage || defaultHeader} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                    alt={community.name} 
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {getRoleLabel(community) && (
                      <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                        {getRoleLabel(community)}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="px-2 flex-1 flex flex-col">
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    {community.name}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6">
                    {community.description}
                  </p>
                  
                  {/* Stats & Action */}
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                         ))}
                      </div>
                      <span className="text-xs font-bold text-slate-500">{community.members?.length || 0}</span>
                    </div>

                    {isMember(community) ? (
                      <button className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors">
                        Open
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleJoinCommunity(community._id); }}
                        className="px-5 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[101] flex justify-center items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Create Community</h3>
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input name="name" required className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" required className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interests (comma separated)</label>
                <input name="interests" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cover Image</label>
                <input name="coverImage" type="file" className="w-full p-2 border rounded" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <div className="fixed inset-0 z-[101] flex justify-center items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdminDashboard(false)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Admin Dashboard</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold mb-2">Pending Community Creations</h4>
                <div className="space-y-2">
                  {pendingRequests.pendingCreations.map(community => (
                    <div key={community._id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                      <div>
                        <p className="font-bold">{community.name}</p>
                        <p className="text-sm text-gray-600">{community.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveCommunity(community._id)} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                        <button onClick={() => handleRejectCommunity(community._id)} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-2">Pending Deletions</h4>
                <div className="space-y-2">
                  {pendingRequests.pendingDeletions.map(community => (
                    <div key={community._id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                      <div>
                        <p className="font-bold">{community.name}</p>
                        <p className="text-sm text-gray-600">Requested by: {community.deletionRequestedBy?.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveDeletion(community._id)} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                        <button onClick={() => handleRejectDeletion(community._id)} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[101] flex justify-center items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout? Your session will expire.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;