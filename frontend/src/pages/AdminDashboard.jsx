import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { verifyAdmin } from "../api/auth";

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState({ 
    pendingCreations: [], 
    pendingDeletions: [],
    pendingEventCreations: []
  });
  const [activeTab, setActiveTab] = useState("community-creations");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await verifyAdmin();
      if (adminStatus.isAdmin) {
        setIsAdmin(true);
        fetchPendingRequests();
      } else {
        navigate("/admin/login");
      }
    } catch (err) {
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const [communitiesRes, eventsRes] = await Promise.all([
        fetch("http://localhost:4000/api/communities/pending/all", {
          headers: {
            "x-admin-token": adminToken || "",
          },
        }),
        fetch("http://localhost:4000/api/events/pending/all", {
          headers: {
            "x-admin-token": adminToken || "",
          },
        })
      ]);

      const communitiesData = await communitiesRes.json();
      const eventsData = await eventsRes.json();

      setPendingRequests({
        pendingCreations: communitiesRes.ok ? (communitiesData.pendingCreations || []) : [],
        pendingDeletions: communitiesRes.ok ? (communitiesData.pendingDeletions || []) : [],
        pendingEventCreations: eventsRes.ok ? (eventsData.pendingEventCreations || []) : []
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveEventCreation = async (eventId) => {
    const adminToken = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`http://localhost:4000/api/events/${eventId}/approve`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Event approved successfully!");
        fetchPendingRequests();
      } else {
        alert(data.msg || "Failed to approve event");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving event");
    }
  };

  const handleRejectEventCreation = async (eventId) => {
    const adminToken = localStorage.getItem("adminToken");
    if (!window.confirm("Are you sure you want to reject this event? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/events/${eventId}/reject`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Event rejected");
        fetchPendingRequests();
      } else {
        alert(data.msg || "Failed to reject event");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting event");
    }
  };

  const handleApproveCreation = async (communityId) => {
    const adminToken = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/approve`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Community approved successfully!");
        fetchPendingRequests();
      } else {
        alert(data.msg || "Failed to approve");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving community");
    }
  };

  const handleRejectCreation = async (communityId) => {
    const adminToken = localStorage.getItem("adminToken");
    if (!window.confirm("Are you sure you want to reject this community? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/reject`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Community rejected");
        fetchPendingRequests();
      } else {
        alert(data.msg || "Failed to reject");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting community");
    }
  };

  const handleApproveDeletion = async (communityId) => {
    const adminToken = localStorage.getItem("adminToken");
    if (!window.confirm("⚠️ WARNING: This will permanently delete the community and ALL its posts. This action cannot be undone. Are you sure?")) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/approve-deletion`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Community deletion approved and executed");
        fetchPendingRequests();
      } else {
        alert(data.msg || "Failed to approve deletion");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving deletion");
    }
  };

  const handleRejectDeletion = async (communityId) => {
    const adminToken = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/reject-deletion`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Deletion request rejected");
        fetchPendingRequests();
      } else {
        alert(data.msg || "Failed to reject deletion");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting deletion");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdmin");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const totalCreationRequests = pendingRequests.pendingCreations.length + pendingRequests.pendingEventCreations.length;
  const totalPending = totalCreationRequests + pendingRequests.pendingDeletions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Manage community requests and platform settings</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Admin Mode
              </span>
              <button
                onClick={() => navigate("/communities")}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                View Communities
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Creations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalCreationRequests}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Deletions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {pendingRequests.pendingDeletions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalPending}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("community-creations")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "community-creations"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Community Creations ({pendingRequests.pendingCreations.length})
              </button>
              <button
                onClick={() => setActiveTab("event-creations")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "event-creations"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Event Creations ({pendingRequests.pendingEventCreations.length})
              </button>
              <button
                onClick={() => setActiveTab("deletions")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "deletions"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pending Deletions ({pendingRequests.pendingDeletions.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "community-creations" && (
              <div>
                {pendingRequests.pendingCreations.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending community creations</h3>
                    <p className="mt-1 text-sm text-gray-500">All community creation requests have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.pendingCreations.map((community) => (
                      <div
                        key={community._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{community.name}</h3>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                Pending
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">{community.description}</p>
                            
                            {community.coverImage && (
                              <img
                                src={community.coverImage}
                                alt="Cover"
                                className="w-full max-w-md h-48 object-cover rounded-lg mb-4"
                              />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Created by:</p>
                                <p className="font-medium text-gray-900">
                                  {community.creator?.username || "Unknown"}
                                </p>
                                <p className="text-gray-600 text-xs">{community.creator?.email || ""}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Requested on:</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(community.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>

                            {community.interests && community.interests.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm text-gray-500 mb-2">Interests:</p>
                                <div className="flex flex-wrap gap-2">
                                  {community.interests.map((interest, i) => (
                                    <span
                                      key={i}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="ml-6 flex flex-col gap-2">
                            <button
                              onClick={() => handleApproveCreation(community._id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium whitespace-nowrap"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectCreation(community._id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium whitespace-nowrap"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "event-creations" && (
              <div>
                {pendingRequests.pendingEventCreations.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending event creations</h3>
                    <p className="mt-1 text-sm text-gray-500">All event creation requests have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.pendingEventCreations.map((event) => (
                      <div
                        key={event._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-blue-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Pending
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">{event.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Created by:</p>
                                <p className="font-medium text-gray-900">{event.organizer?.username || "Unknown"}</p>
                                <p className="text-gray-600 text-xs">{event.organizer?.email || ""}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Starts on:</p>
                                <p className="font-medium text-gray-900">
                                  {event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  }) : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="ml-6 flex flex-col gap-2">
                            <button
                              onClick={() => handleApproveEventCreation(event._id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium whitespace-nowrap"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectEventCreation(event._id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium whitespace-nowrap"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "deletions" && (
              <div>
                {pendingRequests.pendingDeletions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending deletions</h3>
                    <p className="mt-1 text-sm text-gray-500">All deletion requests have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.pendingDeletions.map((community) => (
                      <div
                        key={community._id}
                        className="border border-red-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-red-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{community.name}</h3>
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                Deletion Requested
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">{community.description}</p>

                            <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
                              <p className="text-sm font-medium text-red-800 mb-1">
                                ⚠️ Warning: This action is permanent
                              </p>
                              <p className="text-xs text-red-700">
                                Approving this deletion will permanently remove the community and all associated posts. This cannot be undone.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Requested by:</p>
                                <p className="font-medium text-gray-900">
                                  {community.deletionRequestedBy?.username || "Unknown"}
                                </p>
                                <p className="text-gray-600 text-xs">{community.deletionRequestedBy?.email || ""}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Original creator:</p>
                                <p className="font-medium text-gray-900">
                                  {community.creator?.username || "Unknown"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Members:</p>
                                <p className="font-medium text-gray-900">
                                  {community.members?.length || 0} members
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Requested on:</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(community.updatedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="ml-6 flex flex-col gap-2">
                            <button
                              onClick={() => handleApproveDeletion(community._id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium whitespace-nowrap"
                            >
                              ✓ Approve Deletion
                            </button>
                            <button
                              onClick={() => handleRejectDeletion(community._id)}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium whitespace-nowrap"
                            >
                              ✗ Reject Request
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Future Admin Sections - Scalable Design */}
        {/* <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Admin Functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-medium text-gray-900 mb-2">User Management</h3>
              <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
              <span className="text-xs text-gray-400 mt-2 block">Coming soon</span>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-medium text-gray-900 mb-2">Content Moderation</h3>
              <p className="text-sm text-gray-500">Review and moderate posts and comments</p>
              <span className="text-xs text-gray-400 mt-2 block">Coming soon</span>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-medium text-gray-900 mb-2">Analytics & Reports</h3>
              <p className="text-sm text-gray-500">View platform statistics and insights</p>
              <span className="text-xs text-gray-400 mt-2 block">Coming soon</span>
            </div>
          </div>
        </div> */}
      </main>
    </div>
  );
}

export default AdminDashboard;
