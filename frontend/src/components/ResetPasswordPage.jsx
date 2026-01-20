// src/components/ResetPasswordPage.jsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import "./ResetPassword.css"; 

export default function ResetPasswordPage() {
  const { token } = useParams(); // get token from URL
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
      const res = await fetch(`http://localhost:4000/api/forgot-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      setMessage(data.msg);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-container">
        <h1 className="reset-brand">SkillNest</h1>
        <h2 className="reset-heading">Reset Password</h2>

        <form className="reset-form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>

        {message && <p className="reset-message">{message}</p>}
      </div>
    </div>
  );
}
