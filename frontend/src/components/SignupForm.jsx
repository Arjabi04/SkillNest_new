import { useState } from "react";
import { signup } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";

export default function SignupForm() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await signup(form.username, form.email, form.password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user._id);
      setMessage(`🎉 Welcome, ${data.user.username}!`);
      setForm({ username: "", email: "", password: "" });

      // New users always go to choose-interests
      if (data.isNew) {
        setTimeout(() => {
          navigate(`/choose-interests?userId=${data.user._id}`);
        }, 500);
      } else {
        // This shouldn't happen for new signups, but just in case
        setTimeout(() => {
          navigate("/explore");
        }, 500);
      }
    } catch (err) {
      setMessage("⚠️ Signup failed. Try again.");
    }
  };

  return (
    <div className="flex h-screen w-screen font-sans">
      {/* Left side: Image */}
      <div 
        className="hidden lg:flex flex-1 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/src/assets/signup_image.jpg')" }}
      ></div>

      {/* Right side: Form container */}
      <div className="w-full lg:w-125 h-screen flex flex-col items-center justify-center p-12 bg-gray-50 shadow-lg rounded-bl-lg">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">SkillNest</h1>
        <h2 className="text-2xl font-medium text-gray-900 text-center mb-4">Sign Up</h2>
        <h3 className="font-light text-gray-600 text-center mb-8">Create your account</h3>

        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-6 items-center">
          <input 
            name="username" 
            placeholder="Username" 
            value={form.username} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-3 text-base rounded-lg border border-gray-300 transition-colors duration-300 focus:border-indigo-600 focus:outline-none"
          />
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-3 text-base rounded-lg border border-gray-300 transition-colors duration-300 focus:border-indigo-600 focus:outline-none"
          />
          <input 
            name="password" 
            type="password" 
            placeholder="Password" 
            value={form.password} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-3 text-base rounded-lg border border-gray-300 transition-colors duration-300 focus:border-indigo-600 focus:outline-none"
          />
          <button 
            type="submit"
            className="w-full px-3 py-3 text-base rounded-lg border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-300 hover:bg-indigo-700"
          >
            Sign Up
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-700 text-center">{message}</p>}
        <p className="text-center w-full mt-4 text-sm">
          Already have an account? <Link to="/login" className="text-indigo-600 no-underline hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}