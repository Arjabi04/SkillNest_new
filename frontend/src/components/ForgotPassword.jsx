import { useState } from "react";
import { Link } from "react-router-dom";

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
    <div className="flex justify-center items-center min-h-screen w-screen bg-slate-100 font-sans">
  <div className="w-[500px] p-12 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.08)] rounded-xl flex flex-col items-center text-center">
    <h1 className="text-4xl font-bold text-slate-800 mb-8">SkillNest</h1>
    <div className="w-full">
      <h2 className="text-3xl font-medium mb-4 text-slate-800">Forgot Password</h2>
      <h3 className="text-base font-light mb-8 text-slate-600">
        Enter your email to receive a reset link
      </h3>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 items-center">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full max-w-[350px] px-3 py-3 text-base rounded-lg border border-slate-300 text-center focus:border-indigo-600 focus:outline-none"
        />
        <button type="submit" className="w-full max-w-[350px] px-3 py-3 text-lg rounded-lg border-none bg-indigo-600 text-white cursor-pointer transition-colors hover:bg-indigo-700">{loading ? "Sending..." : "Send Reset Link"}</button>
      </form>
      {message && <p className="mt-6 text-sm text-slate-700 text-center">{message}</p>}
      <p className="mt-4 text-sm text-center">
        Remembered your password? <Link to="/login" className="text-indigo-600 no-underline hover:underline">Back to Login</Link>
      </p>
    </div>
  </div>
</div>
  );
}
