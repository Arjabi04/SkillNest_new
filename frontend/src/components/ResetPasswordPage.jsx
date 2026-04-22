// src/components/ResetPasswordPage.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
      const res = await fetch(`http://localhost:4000/api/forgot-password/${token}`, {
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
    <div className="flex justify-center items-center h-screen w-screen bg-slate-100 font-sans">
      <div className="w-[500px] min-h-[500px] p-12 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.08)] rounded-xl flex flex-col items-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-16">SkillNest</h1>
        <h2 className="text-3xl font-medium mb-16 text-slate-800">Reset Password</h2>

        <form className="w-full flex flex-col gap-8" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-3 py-3 text-base rounded-lg border border-slate-300 focus:border-indigo-600 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="px-3 py-3 text-base rounded-lg border border-slate-300 focus:border-indigo-600 focus:outline-none"
          />
          <button type="submit" className="px-3 py-3 text-lg rounded-lg border-none bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 transition-colors">Reset Password</button>
        </form>

        {message && <p className="mt-6 text-sm text-slate-700 text-center">{message}</p>}
      </div>
    </div>
  );
}
