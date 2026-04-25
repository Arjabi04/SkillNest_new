import { useState } from "react";
import { signup } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import signupImage from "../assets/signup_image.jpg";
import "./SignupForm.css";

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
    <div className="signup-page">
      {/* Left side: Image */}
      <div 
        className="signup-image-container"
        style={{ backgroundImage: `url('${signupImage}')` }}
      ></div>

      {/* Right side: Form container */}
      <div className="signup-form-container">
        <img src={logo} alt="SkillNest Logo" className="signup-logo" />
        <h3 className="signup-title">Sign Up</h3>
        <h3 className="signup-subtitle">Create your account</h3>

        {serverError && (
          <div className="signup-error-alert" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form" noValidate>
          <div className="signup-form-group">
            <label htmlFor="signup-username" className="signup-label">Username</label>
            <input 
              id="signup-username"
              name="username" 
              placeholder="Choose a username" 
              value={form.username} 
              onChange={handleChange}
              autoComplete="username"
              aria-invalid={Boolean(fieldErrors.username)}
              className={`signup-input ${fieldErrors.username ? "has-error" : ""}`}
            />
            {fieldErrors.username && <p className="signup-field-error">{fieldErrors.username}</p>}
          </div>

          <div className="signup-form-group">
            <label htmlFor="signup-email" className="signup-label">Email</label>
            <input 
              id="signup-email"
              name="email" 
              type="email" 
              placeholder="you@example.com" 
              value={form.email} 
              onChange={handleChange}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              className={`signup-input ${fieldErrors.email ? "has-error" : ""}`}
            />
            {fieldErrors.email && <p className="signup-field-error">{fieldErrors.email}</p>}
          </div>

          <div className="signup-form-group">
            <label htmlFor="signup-password" className="signup-label">Password</label>
            <div className="signup-password-wrapper">
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
                className={`signup-input signup-password-input ${fieldErrors.password ? "has-error" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="signup-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password && <p className="signup-field-error">{fieldErrors.password}</p>}
          </div>

          <div className="signup-form-group">
            <label htmlFor="signup-confirm-password" className="signup-label">Confirm Password</label>
            <div className="signup-password-wrapper">
              <input 
                id="signup-confirm-password"
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password" 
                value={form.confirmPassword} 
                onChange={handleChange}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                className={`signup-input signup-password-input ${fieldErrors.confirmPassword ? "has-error" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="signup-password-toggle"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="signup-field-error">{fieldErrors.confirmPassword}</p>}
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="signup-submit"
          >
            {submitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="signup-login-text">
          Already have an account? <Link to="/login" className="signup-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
