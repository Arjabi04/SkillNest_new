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
      const res = await fetch("http://localhost:4000/api/forgot-password", {
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
    <div className="forgot-page">
  <div className="forgot-container">
    <h1 className="forgot-brand">SkillNest</h1>
    <div className="form-wrapper">
      <h2 className="forgot-heading">Forgot Password</h2>
      <h3 className="forgot-subheading">
        Enter your email to receive a reset link
      </h3>
      <form onSubmit={handleSubmit} className="forgot-form">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">{loading ? "Sending..." : "Send Reset Link"}</button>
      </form>
      {message && <p className="forgot-message">{message}</p>}
      <p className="forgot-helper">
        Remembered your password? <Link to="/login">Back to Login</Link>
      </p>
    </div>
  </div>
</div>
  );
}
