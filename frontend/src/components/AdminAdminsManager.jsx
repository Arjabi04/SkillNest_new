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

export default function AdminAdminsManager({ adminToken }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ username: "", password: "" });

  const headers = useMemo(
    () => ({ "x-admin-token": adminToken || "", "Content-Type": "application/json" }),
    [adminToken],
  );

  const loadAdmins = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const data = await fetchJson("/admin/accounts", { headers });
      setAdmins(Array.isArray(data?.admins) ? data.admins : []);
    } catch (err) {
      toast.error(err.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const createAdmin = async (e) => {
    e.preventDefault();
    if (!adminToken) return;
    const username = String(form.username || "").trim().toLowerCase();
    const password = String(form.password || "");
    if (!username || !password) {
      toast.error("Username and password are required");
      return;
    }
    setBusy(true);
    try {
      const data = await fetchJson("/admin/accounts", {
        method: "POST",
        headers,
        body: JSON.stringify({ username, password }),
      });
      toast.success(data?.msg || "Admin created");
      setForm({ username: "", password: "" });
      await loadAdmins();
    } catch (err) {
      toast.error(err.message || "Failed to create admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="moderation-queue">
      <div className="moderation-queue-header">
        <div>
          <h2 className="moderation-queue-title">Admin Accounts</h2>
          <p className="moderation-queue-subtitle">Create additional admins and view existing ones</p>
        </div>
        <button type="button" className="moderation-queue-refresh" onClick={loadAdmins} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Create admin</h3>
        <form className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" onSubmit={createAdmin}>
          <input
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="username (email)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={busy}
          />
          <input
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="password (min 8 chars)"
            type="password"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="moderation-queue-loading">Loading admins…</div>
      ) : admins.length === 0 ? (
        <div className="moderation-queue-empty">
          <h3 className="moderation-queue-empty-title">No admin accounts</h3>
          <p className="moderation-queue-empty-desc">Create one to enable additional logins.</p>
        </div>
      ) : (
        <div className="mt-4 moderation-queue-table">
          <div className="moderation-queue-table-head" style={{ gridTemplateColumns: "260px 1fr 220px" }}>
            <div>Username</div>
            <div>Created</div>
            <div>Created By</div>
          </div>
          {admins.map((a) => (
            <div key={a.id} className="moderation-queue-row" style={{ gridTemplateColumns: "260px 1fr 220px" }}>
              <div className="moderation-post">
                <div className="moderation-author">{a.username}</div>
              </div>
              <div className="moderation-post">
                <div className="moderation-preview">{fmtDate(a.createdAt)}</div>
              </div>
              <div className="moderation-post">
                <div className="moderation-preview">{a.createdBy || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

