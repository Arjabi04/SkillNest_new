import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { Link } from "react-router-dom";
import loginImage from "../assets/login-image.jpg";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form.email, form.password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user._id || data.user.id);
      setMessage(`Logged in as ${data.user.username}`);
      setForm({ email: "", password: "" });
      
      // Navigate based on whether user has interests
      setTimeout(() => {
        if (data.hasInterests) {
          // Old user with interests -> go to explore
          navigate("/explore");
        } else {
          // New user without interests -> go to choose-interests
          navigate(`/choose-interests?userId=${data.user._id || data.user.id}`);
        }
      }, 500);
    } catch (err) {
      setMessage("⚠️ Login failed. Invalid credentials.");
    }
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Left side image */}
      <div className="hidden lg:flex flex-1 h-screen overflow-hidden items-center justify-center">
        <img src={loginImage} alt="Login illustration" className="w-full h-full object-cover block" />
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-150 h-screen flex flex-col items-center p-8 bg-gray-50 shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-32">SkillNest</h1>

        {/* Form wrapper */}
        <div className="flex flex-col justify-center items-start w-full max-w-md">
          <h3 className="text-2xl font-medium text-black text-left w-full">Welcome Back!</h3>
          <h3 className="font-light text-gray-800 text-left w-full mb-8">Enter your email and password</h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-md gap-8">
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
            
            <p className="text-center w-full text-sm">
              <Link to="/forgot-password" className="text-indigo-600 no-underline hover:underline">
                Forgot password?
              </Link>
            </p>
            
            <button 
              type="submit" 
              className="w-full px-3 py-3 text-base rounded-lg border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-300 hover:bg-indigo-700"
            >
              Login
            </button>
          </form>

          <p className="text-center w-full text-sm mt-4">
            Don't have an account? <Link to="/signup" className="text-indigo-600 no-underline hover:underline">Sign up</Link>
          </p>
          
          {message && <p className="login-message text-sm text-red-600 mt-4">{message}</p>}
        </div>
      </div>
    </div>
  );
}