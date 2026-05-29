import { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setMessage(data.msg);
      setEmail("");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h1 className="forgot-password-logo">SkillNest</h1>
        <div className="forgot-password-content">
          <h2 className="forgot-password-title">Forgot Password</h2>
          <h3 className="forgot-password-subtitle">
            Enter your email to receive a reset link
          </h3>
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="forgot-password-input"
            />
            <button type="submit" className="forgot-password-submit">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          {message && <p className="forgot-password-message">{message}</p>}
          <p className="forgot-password-footer">
            Remembered your password? <Link to="/login" className="forgot-password-link">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
