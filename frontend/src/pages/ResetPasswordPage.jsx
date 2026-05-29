// src/components/ResetPasswordPage.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ResetPassword.css";

export default function ResetPasswordPage() {
  const { token } = useParams(); // get token from URL
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (password !== confirmPassword) {
      setMessage("⚠️ Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/forgot-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.msg || "Could not reset password. Please try again.");
        return;
      }

      setMessage(data.msg || "Password reset successful. Redirecting to login...");
      setPassword("");
      setConfirmPassword("");

      // Give users a moment to read the success message, then return to login.
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <h1 className="reset-password-logo">SkillNest</h1>
        <h2 className="reset-password-title">Reset Password</h2>

        <form className="reset-password-form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="reset-password-input"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="reset-password-input"
          />
          <button type="submit" className="reset-password-submit">Reset Password</button>
        </form>

        {message && <p className="reset-password-message">{message}</p>}
      </div>
    </div>
  );
}
