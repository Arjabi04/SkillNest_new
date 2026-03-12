import { useState } from "react";
import { signup } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import signupImage from "../assets/signup_image.jpg";

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

export default function SignupForm() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const nextErrors = {};
    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!username) {
      nextErrors.username = "Username is required";
    } else if (username.length < 3) {
      nextErrors.username = "Username must be at least 3 characters";
    }

    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
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
      const data = await signup(form.username.trim(), form.email.trim().toLowerCase(), form.password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user._id);
      setForm({ username: "", email: "", password: "", confirmPassword: "" });

      // New users always go to choose-interests
      if (data.isNew) {
        navigate(`/choose-interests?userId=${data.user._id}`);
      } else {
        // This shouldn't happen for new signups, but just in case
        navigate("/explore");
      }
    } catch (err) {
      setServerError(err?.message || "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen font-sans">
      {/* Left side: Image */}
      <div 
        className="hidden lg:flex flex-1 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${signupImage}')` }}
      ></div>

      {/* Right side: Form container */}
      <div className="w-full lg:w-150 h-screen overflow-y-auto flex flex-col items-center justify-center px-8 py-6 bg-gray-50 shadow-lg rounded-bl-lg">
        <img src={logo} alt="SkillNest Logo" className="h-28 mb-8" />
        <h3 className="text-2xl font-medium text-center mb-2">Sign Up</h3>
        <h3 className="font-light text-gray-600 text-center mb-5">Create your account</h3>

        {serverError && (
          <div className="mb-5 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-xl gap-3 items-center" noValidate>
          <div className="w-full">
            <label htmlFor="signup-username" className="mb-1 block text-sm font-medium text-gray-700">Username</label>
            <input 
              id="signup-username"
              name="username" 
              placeholder="Choose a username" 
              value={form.username} 
              onChange={handleChange}
              autoComplete="username"
              aria-invalid={Boolean(fieldErrors.username)}
              className={`w-full px-3 py-3 text-base rounded-lg border transition-colors duration-300 focus:outline-none ${
                fieldErrors.username ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-600"
              }`}
            />
            {fieldErrors.username && <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>}
          </div>

          <div className="w-full">
            <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input 
              id="signup-email"
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
            <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input 
                id="signup-password"
                name="password" 
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters" 
                value={form.password} 
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
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

          <div className="w-full">
            <label htmlFor="signup-confirm-password" className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <input 
                id="signup-confirm-password"
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password" 
                value={form.confirmPassword} 
                onChange={handleChange}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                className={`w-full px-3 py-3 pr-12 text-base rounded-lg border transition-colors duration-300 focus:outline-none ${
                  fieldErrors.confirmPassword ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-600"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full px-3 py-3 text-base rounded-lg border-none bg-indigo-600 text-white transition-colors duration-300 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center w-full mt-4 text-sm">
          Already have an account? <Link to="/login" className="text-indigo-600 no-underline hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
