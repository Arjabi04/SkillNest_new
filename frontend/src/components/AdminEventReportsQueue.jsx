import { useEffect, useMemo, useState } from "react";
import { toast } from "../utils/toast";
import { API_URL } from "../api/auth";

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

const AdminEventReportsQueue = ({ adminToken, onCountsChange }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [details, setDetails] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const headers = useMemo(
    () => ({ "x-admin-token": adminToken || "", "Content-Type": "application/json" }),
    [adminToken],
  );

  const refresh = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const data = await fetchJson(`/events/reports/queue?status=pending&limit=50`, { headers });
      setItems(Array.isArray(data?.items) ? data.items : []);
      const events = Number(data?.totals?.events || 0);
      const reports = Number(data?.totals?.reports || 0);
      onCountsChange?.({ events, reports });
    } catch (err) {
      toast.error(err.message || "Failed to load event reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const openDetails = async (eventId) => {
    setSelectedEventId(eventId);
    setDetails(null);
    try {
      const data = await fetchJson(`/events/reports/events/${eventId}`, { headers });
      setDetails(data);
    } catch (err) {
      toast.error(err.message || "Failed to load report details");
    }
  };

  const closeDetails = () => {
    setSelectedEventId(null);
    setDetails(null);
  };

  const runAction = async (path, options = {}) => {
    if (!adminToken) return;
    setActionBusy(true);
    try {
      const data = await fetchJson(path, { headers, ...options });
      toast.success(data?.msg || "Action completed");
      await refresh();
      closeDetails();
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
          <h2 className="moderation-queue-title">Event Reports</h2>
          <p className="moderation-queue-subtitle">Reported events awaiting review</p>
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
          <h3 className="moderation-queue-empty-title">No reported events</h3>
          <p className="moderation-queue-empty-desc">Nothing pending review right now.</p>
        </div>
      ) : (
        <div className="moderation-queue-table">
          <div className="moderation-queue-table-head">
            <div>Event</div>
            <div>Reports</div>
            <div>Organizer</div>
            <div>Reasons</div>
            <div>First Report</div>
            <div />
          </div>

          {items.map((item) => {
            const event = item.event || {};
            const reasons = Array.isArray(item.reasonsSummary) ? item.reasonsSummary.slice(0, 3) : [];

            return (
              <div key={item.eventId} className="moderation-queue-row">
                <div className="moderation-post">
                  <div className="moderation-author">{event.title || "Untitled"}</div>
                  <div className="moderation-preview">
                    {event.startDate ? new Date(event.startDate).toLocaleString() : "—"}
                  </div>
                </div>

                <div className="moderation-counts">
                  <div className="moderation-count">{item.uniqueReportCount} users</div>
                  <div className="moderation-subcount">{item.reportCount} total</div>
                </div>

                <div className="moderation-post">
                  <div className="moderation-author">{event.organizer?.username || "Unknown"}</div>
                  <div className="moderation-preview">
                    {event.organizer?.email || ""}
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
                    onClick={() => openDetails(item.eventId)}
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedEventId && (
        <div className="moderation-modal">
          <button type="button" className="moderation-modal-backdrop" onClick={closeDetails} aria-label="Close" />
          <div className="moderation-modal-card">
            <div className="moderation-modal-header">
              <div>
                <h3 className="moderation-modal-title">Review Reported Event</h3>
                <p className="moderation-modal-subtitle">Event ID: {selectedEventId}</p>
              </div>
              <button type="button" className="moderation-modal-close" onClick={closeDetails}>✕</button>
            </div>

            {!details ? (
              <div className="moderation-modal-loading">Loading…</div>
            ) : (
              <div className="moderation-modal-body">
                <div className="moderation-modal-post">
                  <div className="moderation-modal-author">
                    {details.event?.title || "Untitled"}{" "}
                    <span className="moderation-modal-author-sub">
                      organizer: {details.event?.organizer?.username || "Unknown"} {details.event?.organizer?.email ? `(${details.event.organizer.email})` : ""}
                    </span>
                  </div>
                  <div className="moderation-modal-text">{details.event?.description || "—"}</div>
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
                        {r.details ? (
                          <div className="moderation-modal-report-desc">{r.details}</div>
                        ) : (
                          <div className="moderation-modal-report-desc muted">No details</div>
                        )}
                        <div className="moderation-modal-report-meta">
                          reporter: {r.reporter?.username || "Unknown"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="moderation-modal-actions">
                  <button
                    type="button"
                    className="moderation-action dismiss"
                    disabled={actionBusy}
                    onClick={() => {
                      if (!window.confirm("Dismiss all reports for this event?")) return;
                      runAction(`/events/reports/events/${selectedEventId}/dismiss`, {
                        method: "POST",
                        body: JSON.stringify({}),
                      });
                    }}
                  >
                    {actionBusy ? "Working..." : "Dismiss Reports"}
                  </button>
                  <button
                    type="button"
                    className="moderation-action remove"
                    disabled={actionBusy}
                    onClick={() => {
                      if (!window.confirm("Delete this event? This cannot be undone.")) return;
                      runAction(`/events/reports/events/${selectedEventId}`, {
                        method: "DELETE",
                      });
                    }}
                  >
                    {actionBusy ? "Working..." : "Delete Event"}
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

export default AdminEventReportsQueue;
