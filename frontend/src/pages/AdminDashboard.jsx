import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, verifyAdmin } from "../api/auth";
import AdminModerationQueue from "../components/AdminModerationQueue";
import AdminMarketplaceReportsQueue from "../components/AdminMarketplaceReportsQueue";
import AdminEventReportsQueue from "../components/AdminEventReportsQueue";
import AdminUsersManager from "../components/AdminUsersManager";
import AdminAdminsManager from "../components/AdminAdminsManager";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState({ 
    pendingCreations: [], 
    pendingDeletions: [],
    pendingEventCreations: []
  });
  const [moderationCounts, setModerationCounts] = useState({ posts: 0, reports: 0 });
  const [marketplaceCounts, setMarketplaceCounts] = useState({ products: 0, reports: 0 });
  const [eventReportCounts, setEventReportCounts] = useState({ events: 0, reports: 0 });
  const [activeTab, setActiveTab] = useState("community-creations");
  const navigate = useNavigate();

  const activeGroup =
    activeTab === "moderation" ||
    activeTab === "marketplace-reports" ||
    activeTab === "event-reports"
      ? "reports"
      : activeTab === "users" || activeTab === "admins"
        ? "manage"
        : "requests";

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await verifyAdmin();
      if (adminStatus.isAdmin) {
        setIsAdmin(true);
        fetchPendingRequests();
        fetchMarketplaceReportCounts();
        fetchEventReportCounts();
      } else {
        navigate("/admin/login");
      }
    } catch {
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketplaceReportCounts = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/marketplace/reports/queue?status=pending&limit=1`, {
        headers: {
          "x-admin-token": adminToken || "",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMarketplaceCounts({
          products: Number(data?.totals?.products || 0),
          reports: Number(data?.totals?.reports || 0),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventReportCounts = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/events/reports/queue?status=pending&limit=1`, {
        headers: {
          "x-admin-token": adminToken || "",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEventReportCounts({
          events: Number(data?.totals?.events || 0),
          reports: Number(data?.totals?.reports || 0),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const [communitiesRes, eventsRes] = await Promise.all([
        fetch(`${API_URL}/communities/pending/all`, {
          headers: {
            "x-admin-token": adminToken || "",
          },
        }),
        fetch(`${API_URL}/events/pending/all`, {
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
      const res = await fetch(`${API_URL}/events/${eventId}/approve`, {
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
      const res = await fetch(`${API_URL}/events/${eventId}/reject`, {
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
      const res = await fetch(`${API_URL}/communities/${communityId}/approve`, {
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
      const res = await fetch(`${API_URL}/communities/${communityId}/reject`, {
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
      const res = await fetch(`${API_URL}/communities/${communityId}/approve-deletion`, {
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
      const res = await fetch(`${API_URL}/communities/${communityId}/reject-deletion`, {
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
      <div className="admin-dashboard-loader">
        <div className="admin-dashboard-loader-content">
          <div className="admin-dashboard-spinner"></div>
          <p className="admin-dashboard-loader-text">Verifying admin access...</p>
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
    <div className="admin-dashboard-page">
      {/* Header */}
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-inner">
          <div className="admin-dashboard-header-flex">
            <div>
              <h1 className="admin-dashboard-title">Admin Dashboard</h1>
              <p className="admin-dashboard-subtitle">Manage requests and moderate reported content</p>
            </div>
            <div className="admin-dashboard-actions">
              <span className="admin-dashboard-badge">
                Admin Mode
              </span>
              <button
                onClick={handleLogout}
                className="admin-dashboard-logout-btn"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-dashboard-main">
        {/* Stats Cards */}
        <div className="admin-dashboard-stats-grid">
          <div className="admin-dashboard-stat-card">
            <div className="admin-dashboard-stat-flex">
              <div>
                <p className="admin-dashboard-stat-label">Pending Creations</p>
                <p className="admin-dashboard-stat-value">
                  {totalCreationRequests}
                </p>
              </div>
              <div className="admin-dashboard-stat-icon-wrapper yellow">
                <svg className="admin-dashboard-stat-icon yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="admin-dashboard-stat-card">
            <div className="admin-dashboard-stat-flex">
              <div>
                <p className="admin-dashboard-stat-label">Pending Deletions</p>
                <p className="admin-dashboard-stat-value">
                  {pendingRequests.pendingDeletions.length}
                </p>
              </div>
              <div className="admin-dashboard-stat-icon-wrapper red">
                <svg className="admin-dashboard-stat-icon red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
          </div>

          <div className="admin-dashboard-stat-card">
            <div className="admin-dashboard-stat-flex">
              <div>
                <p className="admin-dashboard-stat-label">Total Pending</p>
                <p className="admin-dashboard-stat-value">
                  {totalPending}
                </p>
              </div>
              <div className="admin-dashboard-stat-icon-wrapper indigo">
                <svg className="admin-dashboard-stat-icon indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-dashboard-tabs-container">
          <div className="admin-dashboard-tabs-nav-wrapper">
            <div className="admin-dashboard-tab-toolbar">
              <button
                type="button"
                onClick={() => setActiveTab("community-creations")}
                className={`admin-dashboard-tab-group-btn ${
                  activeGroup === "requests" ? "active" : "inactive"
                }`}
              >
                Requests
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("moderation")}
                className={`admin-dashboard-tab-group-btn ${
                  activeGroup === "reports" ? "active" : "inactive"
                }`}
              >
                Reports
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`admin-dashboard-tab-group-btn ${
                  activeGroup === "manage" ? "active" : "inactive"
                }`}
              >
                Manage
              </button>
            </div>

            {activeGroup === "requests" ? (
              <nav className="admin-dashboard-tabs-nav" aria-label="Requests tabs">
                <button
                  onClick={() => setActiveTab("community-creations")}
                  className={`admin-dashboard-tab ${
                    activeTab === "community-creations" ? "active" : "inactive"
                  }`}
                >
                  Community Creations ({pendingRequests.pendingCreations.length})
                </button>
                <button
                  onClick={() => setActiveTab("event-creations")}
                  className={`admin-dashboard-tab ${
                    activeTab === "event-creations" ? "active" : "inactive"
                  }`}
                >
                  Event Creations ({pendingRequests.pendingEventCreations.length})
                </button>
                <button
                  onClick={() => setActiveTab("deletions")}
                  className={`admin-dashboard-tab ${
                    activeTab === "deletions" ? "active" : "inactive"
                  }`}
                >
                  Pending Deletions ({pendingRequests.pendingDeletions.length})
                </button>
              </nav>
            ) : activeGroup === "reports" ? (
              <nav className="admin-dashboard-tabs-nav" aria-label="Reports tabs">
                <button
                  onClick={() => setActiveTab("moderation")}
                  className={`admin-dashboard-tab ${
                    activeTab === "moderation" ? "active" : "inactive"
                  }`}
                >
                  Post Reports ({moderationCounts.posts})
                </button>
                <button
                  onClick={() => setActiveTab("marketplace-reports")}
                  className={`admin-dashboard-tab ${
                    activeTab === "marketplace-reports" ? "active" : "inactive"
                  }`}
                >
                  Marketplace ({marketplaceCounts.products})
                </button>
                <button
                  onClick={() => setActiveTab("event-reports")}
                  className={`admin-dashboard-tab ${
                    activeTab === "event-reports" ? "active" : "inactive"
                  }`}
                >
                  Events ({eventReportCounts.events})
                </button>
              </nav>
            ) : (
              <nav className="admin-dashboard-tabs-nav" aria-label="Management tabs">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`admin-dashboard-tab ${
                    activeTab === "users" ? "active" : "inactive"
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab("admins")}
                  className={`admin-dashboard-tab ${
                    activeTab === "admins" ? "active" : "inactive"
                  }`}
                >
                  Admins
                </button>
              </nav>
            )}
          </div>

          {/* Tab Content */}
          <div className="admin-dashboard-tabs-content">
            {activeTab === "community-creations" && (
              <div>
                {pendingRequests.pendingCreations.length === 0 ? (
                  <div className="admin-dashboard-empty-state">
                    <svg className="admin-dashboard-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="admin-dashboard-empty-title">No pending community creations</h3>
                    <p className="admin-dashboard-empty-desc">All community creation requests have been processed.</p>
                  </div>
                ) : (
                  <div className="admin-dashboard-list">
                    {pendingRequests.pendingCreations.map((community) => (
                      <div
                        key={community._id}
                        className="admin-dashboard-item-card"
                      >
                        <div className="admin-dashboard-item-flex">
                          <div className="admin-dashboard-item-content">
                            <div className="admin-dashboard-item-header">
                              <h3 className="admin-dashboard-item-title">{community.name}</h3>
                              <span className="admin-dashboard-item-badge yellow">
                                Pending
                              </span>
                            </div>
                            <p className="admin-dashboard-item-desc">{community.description}</p>
                            
                            {community.coverImage && (
                              <img
                                src={community.coverImage}
                                alt="Cover"
                                className="admin-dashboard-item-image"
                              />
                            )}

                            <div className="admin-dashboard-item-meta-grid">
                              <div>
                                <p className="admin-dashboard-meta-label">Created by:</p>
                                <p className="admin-dashboard-meta-value">
                                  {community.creator?.username || "Unknown"}
                                </p>
                                <p className="admin-dashboard-meta-subvalue">{community.creator?.email || ""}</p>
                              </div>
                              <div>
                                <p className="admin-dashboard-meta-label">Requested on:</p>
                                <p className="admin-dashboard-meta-value">
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
                              <div>
                                <p className="admin-dashboard-interests-label">Interests:</p>
                                <div className="admin-dashboard-interests-list">
                                  {community.interests.map((interest, i) => (
                                    <span
                                      key={i}
                                      className="admin-dashboard-interest-tag"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="admin-dashboard-item-actions">
                            <button
                              onClick={() => handleApproveCreation(community._id)}
                              className="admin-dashboard-action-btn approve"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectCreation(community._id)}
                              className="admin-dashboard-action-btn reject"
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
                  <div className="admin-dashboard-empty-state">
                    <svg className="admin-dashboard-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="admin-dashboard-empty-title">No pending event creations</h3>
                    <p className="admin-dashboard-empty-desc">All event creation requests have been processed.</p>
                  </div>
                ) : (
                  <div className="admin-dashboard-list">
                    {pendingRequests.pendingEventCreations.map((event) => (
                      <div
                        key={event._id}
                        className="admin-dashboard-item-card blue-bg"
                      >
                        <div className="admin-dashboard-item-flex">
                          <div className="admin-dashboard-item-content">
                            <div className="admin-dashboard-item-header">
                              <h3 className="admin-dashboard-item-title">{event.title}</h3>
                              <span className="admin-dashboard-item-badge blue">
                                Pending
                              </span>
                            </div>
                            <p className="admin-dashboard-item-desc">{event.description}</p>

                            <div className="admin-dashboard-item-meta-grid">
                              <div>
                                <p className="admin-dashboard-meta-label">Created by:</p>
                                <p className="admin-dashboard-meta-value">{event.organizer?.username || "Unknown"}</p>
                                <p className="admin-dashboard-meta-subvalue">{event.organizer?.email || ""}</p>
                              </div>
                              <div>
                                <p className="admin-dashboard-meta-label">Starts on:</p>
                                <p className="admin-dashboard-meta-value">
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

                          <div className="admin-dashboard-item-actions">
                            <button
                              onClick={() => handleApproveEventCreation(event._id)}
                              className="admin-dashboard-action-btn approve"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectEventCreation(event._id)}
                              className="admin-dashboard-action-btn reject"
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
                  <div className="admin-dashboard-empty-state">
                    <svg className="admin-dashboard-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <h3 className="admin-dashboard-empty-title">No pending deletions</h3>
                    <p className="admin-dashboard-empty-desc">All deletion requests have been processed.</p>
                  </div>
                ) : (
                  <div className="admin-dashboard-list">
                    {pendingRequests.pendingDeletions.map((community) => (
                      <div
                        key={community._id}
                        className="admin-dashboard-item-card red-border"
                      >
                        <div className="admin-dashboard-item-flex">
                          <div className="admin-dashboard-item-content">
                            <div className="admin-dashboard-item-header">
                              <h3 className="admin-dashboard-item-title">{community.name}</h3>
                              <span className="admin-dashboard-item-badge red">
                                Deletion Requested
                              </span>
                            </div>
                            <p className="admin-dashboard-item-desc">{community.description}</p>

                            <div className="admin-dashboard-item-warning">
                              <p className="admin-dashboard-item-warning-title">
                                ⚠️ Warning: This action is permanent
                              </p>
                              <p className="admin-dashboard-item-warning-desc">
                                Approving this deletion will permanently remove the community and all associated posts. This cannot be undone.
                              </p>
                            </div>

                            <div className="admin-dashboard-item-meta-grid">
                              <div>
                                <p className="admin-dashboard-meta-label">Requested by:</p>
                                <p className="admin-dashboard-meta-value">
                                  {community.deletionRequestedBy?.username || "Unknown"}
                                </p>
                                <p className="admin-dashboard-meta-subvalue">{community.deletionRequestedBy?.email || ""}</p>
                              </div>
                              <div>
                                <p className="admin-dashboard-meta-label">Original creator:</p>
                                <p className="admin-dashboard-meta-value">
                                  {community.creator?.username || "Unknown"}
                                </p>
                              </div>
                              <div>
                                <p className="admin-dashboard-meta-label">Members:</p>
                                <p className="admin-dashboard-meta-value">
                                  {community.members?.length || 0} members
                                </p>
                              </div>
                              <div>
                                <p className="admin-dashboard-meta-label">Requested on:</p>
                                <p className="admin-dashboard-meta-value">
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

                          <div className="admin-dashboard-item-actions">
                            <button
                              onClick={() => handleApproveDeletion(community._id)}
                              className="admin-dashboard-action-btn approve-deletion"
                            >
                              ✓ Approve Deletion
                            </button>
                            <button
                              onClick={() => handleRejectDeletion(community._id)}
                              className="admin-dashboard-action-btn reject-deletion"
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

            {activeTab === "moderation" && (
              <AdminModerationQueue
                adminToken={localStorage.getItem("adminToken")}
                onCountsChange={(counts) => setModerationCounts(counts)}
              />
            )}

            {activeTab === "marketplace-reports" && (
              <AdminMarketplaceReportsQueue
                adminToken={localStorage.getItem("adminToken")}
                onCountsChange={(counts) => setMarketplaceCounts(counts)}
              />
            )}

            {activeTab === "event-reports" && (
              <AdminEventReportsQueue
                adminToken={localStorage.getItem("adminToken")}
                onCountsChange={(counts) => setEventReportCounts(counts)}
              />
            )}

            {activeTab === "users" && (
              <AdminUsersManager adminToken={localStorage.getItem("adminToken")} />
            )}

            {activeTab === "admins" && (
              <AdminAdminsManager adminToken={localStorage.getItem("adminToken")} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
