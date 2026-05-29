import { useEffect, useMemo, useState } from "react";
import { toast } from "../utils/toast";

const RAW_API_BASE = import.meta.env.VITE_API_URL;
const API_URL = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE
  : `${RAW_API_BASE.replace(/\/$/, "")}/api`;

const priorityMeta = (level) => {
  switch (String(level || "").toLowerCase()) {
    case "critical":
      return { label: "Critical", cls: "critical" };
    case "high":
      return { label: "High", cls: "high" };
    case "medium":
      return { label: "Medium", cls: "medium" };
    default:
      return { label: "Low", cls: "low" };
  }
};

const timeAgo = (date) => {
  const ts = date ? new Date(date).getTime() : 0;
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const fetchJson = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.msg || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
};

const AdminModerationQueue = ({ adminToken, onCountsChange }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [details, setDetails] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const headers = useMemo(
    () => ({ "x-admin-token": adminToken || "", "Content-Type": "application/json" }),
    [adminToken]
  );

  const refresh = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const data = await fetchJson(`/moderation/queue?status=pending&limit=50`, { headers });
      setItems(Array.isArray(data?.items) ? data.items : []);
      const posts = Number(data?.totals?.posts || 0);
      const reports = Number(data?.totals?.reports || 0);
      onCountsChange?.({ posts, reports });
    } catch (err) {
      toast.error(err.message || "Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const openDetails = async (postId) => {
    setSelectedPostId(postId);
    setDetails(null);
    setActionNote("");
    try {
      const data = await fetchJson(`/moderation/posts/${postId}`, { headers });
      setDetails(data);
    } catch (err) {
      toast.error(err.message || "Failed to load post details");
    }
  };

  const closeDetails = () => {
    setSelectedPostId(null);
    setDetails(null);
    setActionNote("");
  };

  const runPostAction = async (path, payload = {}) => {
    if (!selectedPostId) return;
    setActionBusy(true);
    try {
      const data = await fetchJson(path, { method: "POST", headers, body: JSON.stringify(payload) });
      toast.success(data?.msg || "Action completed");
      await refresh();
      await openDetails(selectedPostId);
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionBusy(false);
    }
  };

  const runUserAction = async (path, payload = {}) => {
    setActionBusy(true);
    try {
      const data = await fetchJson(path, { method: "POST", headers, body: JSON.stringify(payload) });
      toast.success(data?.msg || "Action completed");
      await refresh();
      await openDetails(selectedPostId);
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="moderation-queue">
      <div className="moderation-queue-header">
        <div>
          <h2 className="moderation-queue-title">Moderation Queue</h2>
          <p className="moderation-queue-subtitle">Reported posts sorted by priority and recency</p>
        </div>
        <button
          type="button"
          className="moderation-queue-refresh"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="moderation-queue-loading">Loading reports…</div>
      ) : items.length === 0 ? (
        <div className="moderation-queue-empty">
          <h3 className="moderation-queue-empty-title">No reported posts</h3>
          <p className="moderation-queue-empty-desc">Nothing pending review right now.</p>
        </div>
      ) : (
        <div className="moderation-queue-table">
          <div className="moderation-queue-table-head">
            <div>Priority</div>
            <div>Reports</div>
            <div>Post</div>
            <div>Reasons</div>
            <div>First Report</div>
            <div />
          </div>

          {items.map((item) => {
            const meta = priorityMeta(item.priorityLevel);
            const post = item.post || {};
            const reasons = Array.isArray(item.reasonsSummary) ? item.reasonsSummary.slice(0, 3) : [];

            return (
              <div key={item.postId} className="moderation-queue-row">
                <div>
                  <span className={`moderation-badge ${meta.cls}`}>{meta.label}</span>
                  <div className="moderation-score">score: {item.priorityScore ?? 0}</div>
                  {item?.flags?.massReportingSuspected && (
                    <div className="moderation-flag">mass-reporting suspected</div>
                  )}
                </div>

                <div className="moderation-counts">
                  <div className="moderation-count">{item.uniqueReportCount} users</div>
                  <div className="moderation-subcount">{item.reportCount} total</div>
                </div>

                <div className="moderation-post">
                  <div className="moderation-author">{post.user?.username || "Unknown"}</div>
                  <div className="moderation-preview">
                    {(post.text || "").slice(0, 140) || "—"}
                    {(post.text || "").length > 140 ? "…" : ""}
                  </div>
                </div>

                <div className="moderation-reasons">
                  {reasons.length ? (
                    reasons.map((r) => (
                      <div key={r.reason} className="moderation-reason">
                        {r.reason} <span className="moderation-reason-count">({r.count})</span>
                      </div>
                    ))
                  ) : (
                    <div className="moderation-reason">—</div>
                  )}
                </div>

                <div className="moderation-time">{timeAgo(item.firstReportedAt)}</div>

                <div className="moderation-actions">
                  <button
                    type="button"
                    className="moderation-action view"
                    onClick={() => openDetails(item.postId)}
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPostId && (
        <div className="moderation-modal">
          <button type="button" className="moderation-modal-backdrop" onClick={closeDetails} aria-label="Close" />
          <div className="moderation-modal-card">
            <div className="moderation-modal-header">
              <div>
                <h3 className="moderation-modal-title">Review Reported Post</h3>
                <p className="moderation-modal-subtitle">Post ID: {selectedPostId}</p>
              </div>
              <button type="button" className="moderation-modal-close" onClick={closeDetails}>✕</button>
            </div>

            {!details ? (
              <div className="moderation-modal-loading">Loading…</div>
            ) : (
              <div className="moderation-modal-body">
                <div className="moderation-modal-post">
                  <div className="moderation-modal-author">
                    {details.post?.user?.username || "Unknown"}{" "}
                    <span className="moderation-modal-author-sub">{details.post?.user?.email || ""}</span>
                  </div>
                  <div className="moderation-modal-text">{details.post?.text || "—"}</div>
                </div>

                <div className="moderation-modal-section">
                  <h4 className="moderation-modal-section-title">Reports</h4>
                  <div className="moderation-modal-reports">
                    {(details.reports || []).map((r) => (
                      <div key={r._id} className="moderation-modal-report">
                        <div className="moderation-modal-report-top">
                          <div className="moderation-modal-report-reason">{r.reason}</div>
                          <div className="moderation-modal-report-time">{timeAgo(r.createdAt)}</div>
                        </div>
                        {r.description ? (
                          <div className="moderation-modal-report-desc">{r.description}</div>
                        ) : (
                          <div className="moderation-modal-report-desc muted">No description</div>
                        )}
                        <div className="moderation-modal-report-meta">
                          reporter: {r.reportedBy?.username || "Unknown"} · trust {Number(r.reportedBy?.trustScore ?? 0.5).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="moderation-modal-section">
                  <h4 className="moderation-modal-section-title">Admin Note</h4>
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="moderation-modal-note"
                    placeholder="Add context for the moderation log…"
                  />
                </div>

                <div className="moderation-modal-actions">
                  <button
                    type="button"
                    className="moderation-action dismiss"
                    disabled={actionBusy}
                    onClick={() => runPostAction(`/moderation/posts/${selectedPostId}/dismiss`, { note: actionNote })}
                  >
                    Dismiss Reports
                  </button>
                  <button
                    type="button"
                    className="moderation-action remove"
                    disabled={actionBusy}
                    onClick={() => runPostAction(`/moderation/posts/${selectedPostId}/remove`, { note: actionNote })}
                  >
                    Remove Post
                  </button>

                  <div className="moderation-divider" />

                  <button
                    type="button"
                    className="moderation-action warn"
                    disabled={actionBusy}
                    onClick={() => runUserAction(`/moderation/users/${details.post?.user?._id}/warn`, { postId: selectedPostId, note: actionNote })}
                  >
                    Warn User
                  </button>
                  <button
                    type="button"
                    className="moderation-action suspend"
                    disabled={actionBusy}
                    onClick={() => runUserAction(`/moderation/users/${details.post?.user?._id}/suspend`, { days: 7, note: actionNote })}
                  >
                    Suspend 7d
                  </button>
                  <button
                    type="button"
                    className="moderation-action ban"
                    disabled={actionBusy}
                    onClick={() => runUserAction(`/moderation/users/${details.post?.user?._id}/ban`, { reason: actionNote || "Policy violation", note: actionNote })}
                  >
                    Ban User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModerationQueue;
