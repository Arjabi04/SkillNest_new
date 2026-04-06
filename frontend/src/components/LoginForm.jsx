import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { Link } from "react-router-dom";
import loginImage from "../assets/login-image.jpg";
import logo from "../assets/Logo.png";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="m3 3 18 18" />
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
      <path d="M9.88 5.09A9.77 9.77 0 0 1 12 5c7 0 11 7 11 7a18.7 18.7 0 0 1-3.23 4.36" />
      <path d="M6.61 6.61A18.53 18.53 0 0 0 1 12s4 7 11 7a10.8 10.8 0 0 0 5.39-1.39" />
    </svg>
  );
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const nextErrors = {};
    const email = form.email.trim();
    const password = form.password;

    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    if (serverError) setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setServerError("");
    setSubmitting(true);

    try {
      const data = await login(form.email.trim().toLowerCase(), form.password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user._id || data.user.id);
      setForm({ email: "", password: "" });
      
      // Navigate based on whether user has interests
      if (data.hasInterests) {
        navigate("/explore");
      } else {
        navigate(`/choose-interests?userId=${data.user._id || data.user.id}`);
      }
    } catch (err) {
      setServerError(err?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
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
        <img src={logo} alt="SkillNest Logo" className="h-30 mb-24" />

        {/* Form wrapper */}
        <div className="flex flex-col justify-center items-start w-full max-w-md">
          <h3 className="text-2xl font-medium text-black text-left w-full">Welcome Back!</h3>
          <h3 className="font-light text-gray-800 text-left w-full mb-8">Enter your email and password</h3>

          {serverError && (
            <div className="w-full mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {serverError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-md gap-5" noValidate>
            <div className="w-full">
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                className={`w-full px-3 py-3 text-base rounded-lg border transition-colors duration-300 focus:outline-none ${
                  fieldErrors.email ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-600"
                }`}
              />
              {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
            </div>

            <div className="w-full">
              <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={`w-full px-3 py-3 pr-12 text-base rounded-lg border transition-colors duration-300 focus:outline-none ${
                    fieldErrors.password ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
            </div>
            
            <p className="text-center w-full text-sm">
              <Link to="/forgot-password" className="text-indigo-600 no-underline hover:underline">
                Forgot password?
              </Link>
            </p>
            
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full px-3 py-3 text-base rounded-lg border-none bg-indigo-600 text-white transition-colors duration-300 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center w-full text-sm mt-4">
            Don't have an account? <Link to="/signup" className="text-indigo-600 no-underline hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}