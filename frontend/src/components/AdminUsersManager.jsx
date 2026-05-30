import { useEffect, useMemo, useState } from "react";
import { toast } from "../utils/toast";
import { API_URL } from "../api/auth";

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

const fmtDate = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

export default function AdminUsersManager({ adminToken }) {
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ users: [], total: 0, totalPages: 1 });

  const headers = useMemo(
    () => ({ "x-admin-token": adminToken || "", "Content-Type": "application/json" }),
    [adminToken],
  );

  const refresh = async (nextPage = page, nextSearch = search) => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", "20");
      if (String(nextSearch || "").trim()) params.set("search", String(nextSearch).trim());
      const result = await fetchJson(`/moderation/users?${params.toString()}`, { headers });
      setData({
        users: Array.isArray(result?.users) ? result.users : [],
        total: Number(result?.total || 0),
        totalPages: Number(result?.totalPages || 1),
      });
      setPage(Number(result?.page || nextPage));
    } catch (err) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const runUserAction = async (userId, path, payload) => {
    if (!adminToken || !userId) return;
    setBusyUserId(String(userId));
    try {
      const result = await fetchJson(path, { method: "POST", headers, body: JSON.stringify(payload || {}) });
      toast.success(result?.msg || "Action completed");
      await refresh();
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setBusyUserId("");
    }
  };

  return (
    <div className="moderation-queue">
      <div className="moderation-queue-header">
        <div>
          <h2 className="moderation-queue-title">User Management</h2>
          <p className="moderation-queue-subtitle">Search and moderate users</p>
        </div>
        <button type="button" className="moderation-queue-refresh" onClick={() => refresh()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username or email…"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="moderation-queue-refresh"
          onClick={() => refresh(1, search)}
          disabled={loading}
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="moderation-queue-loading">Loading users…</div>
      ) : data.users.length === 0 ? (
        <div className="moderation-queue-empty">
          <h3 className="moderation-queue-empty-title">No users found</h3>
          <p className="moderation-queue-empty-desc">Try a different search query.</p>
        </div>
      ) : (
        <div className="moderation-queue-table">
          <div className="moderation-queue-table-head" style={{ gridTemplateColumns: "240px 1fr 260px" }}>
            <div>User</div>
            <div>Email</div>
            <div>Actions</div>
          </div>

          {data.users.map((user) => {
            const u = user || {};
            const isBusy = busyUserId === String(u._id);
            const isBanned = Boolean(u?.moderation?.isBanned);
            const suspendedUntil = u?.moderation?.suspendedUntil ? new Date(u.moderation.suspendedUntil) : null;
            const isSuspended = suspendedUntil && suspendedUntil.getTime() > Date.now();

            return (
              <div key={u._id} className="moderation-queue-row" style={{ gridTemplateColumns: "240px 1fr 260px" }}>
                <div className="moderation-post">
                  <div className="moderation-author">{u.username || "Unknown"}</div>
                  <div className="moderation-preview">
                    created: {fmtDate(u.createdAt)}
                  </div>
                  {isBanned && <div className="moderation-flag">banned</div>}
                  {isSuspended && <div className="moderation-flag">suspended</div>}
                </div>

                <div className="moderation-post">
                  <div className="moderation-author">{u.email || "—"}</div>
                  <div className="moderation-preview">
                    warnings: {Number(u?.moderation?.warningCount || 0)} · violations: {Number(u?.moderation?.violationCount || 0)}
                  </div>
                </div>

                <div className="moderation-actions">
                  <button
                    type="button"
                    className="moderation-action warn"
                    disabled={isBusy}
                    onClick={() => {
                      const note = window.prompt("Warn note (optional):", "") || "";
                      runUserAction(u._id, `/moderation/users/${u._id}/warn`, { note });
                    }}
                  >
                    Warn
                  </button>
                  <button
                    type="button"
                    className="moderation-action suspend"
                    disabled={isBusy}
                    onClick={() => {
                      const daysRaw = window.prompt("Suspend days (1-365):", "7");
                      const days = Number.parseInt(daysRaw || "7", 10) || 7;
                      const note = window.prompt("Suspend note (optional):", "") || "";
                      runUserAction(u._id, `/moderation/users/${u._id}/suspend`, { days, note });
                    }}
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    className="moderation-action ban"
                    disabled={isBusy}
                    onClick={() => {
                      const reason = window.prompt("Ban reason:", "Policy violation") || "Policy violation";
                      runUserAction(u._id, `/moderation/users/${u._id}/ban`, { reason, note: reason });
                    }}
                  >
                    Ban
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">Page {page} / {data.totalPages} · {data.total} users</div>
          <div className="flex gap-2">
            <button
              type="button"
              className="moderation-queue-refresh"
              disabled={loading || page <= 1}
              onClick={() => refresh(page - 1, search)}
            >
              Prev
            </button>
            <button
              type="button"
              className="moderation-queue-refresh"
              disabled={loading || page >= data.totalPages}
              onClick={() => refresh(page + 1, search)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
