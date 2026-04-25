import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { adminLogin } from "../api/auth";
import "./AdminLogin.css";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await adminLogin(form.username, form.password);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("isAdmin", "true");
      setMessage("✅ Admin login successful!");
      setForm({ username: "", password: "" });
      
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    } catch (err) {
      setMessage(err.message || "⚠️ Admin login failed. Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1 className="admin-login-title">SkillNest</h1>
          <h2 className="admin-login-subtitle">Admin Portal</h2>
          <p className="admin-login-description">Administrative access only</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-form-group">
            <label htmlFor="username" className="admin-login-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter admin username"
              value={form.username}
              onChange={handleChange}
              required
              className="admin-login-input"
            />
          </div>

          <div className="admin-login-form-group">
            <label htmlFor="password" className="admin-login-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter admin password"
              value={form.password}
              onChange={handleChange}
              required
              className="admin-login-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-login-submit"
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        {message && (
          <p className={`admin-login-message ${
            message.includes("✅") ? "admin-login-message-success" : "admin-login-message-error"
          }`}>
            {message}
          </p>
        )}

        <div className="admin-login-footer">
          <Link
            to="/login"
            className="admin-login-link"
          >
            ← Back to User Login
          </Link>
        </div>

        <div className="admin-login-note">
          <p className="admin-login-note-text">
            <strong>Note:</strong> Only authorized administrators can access this portal.
          </p>
        </div>
      </div>
    </div>
  );
}
