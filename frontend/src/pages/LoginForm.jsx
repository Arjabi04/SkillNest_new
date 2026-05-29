import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import loginImage from "../assets/login-image.jpg";
import logo from "../assets/Logo.png";
import "./LoginForm.css";

const EyeIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <path d="M2.1 12c1.7-4.4 6-8 9.9-8s8.2 3.6 9.9 8c-1.7 4.4-6 8-9.9 8s-8.2-3.6-9.9-8Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c3.9 0 8.2 3.6 9.9 7-0.6 1.5-1.7 3.1-3.1 4.4" />
        <path d="M6.2 6.2C4 7.8 2.5 10 2.1 12c1.7 4.4 6 8 9.9 8 1.5 0 3.1-.4 4.5-1.1" />
        <path d="M3 3l18 18" />
        <path d="M14.7 14.7A3 3 0 0 1 9.3 9.3" />
    </svg>
);

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
            const data = await login(
                form.email.trim().toLowerCase(),
                form.password,
            );
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.user._id || data.user.id);
            setForm({ email: "", password: "" });

            // Navigate based on whether user has interests
            if (data.hasInterests) {
                navigate("/explore");
            } else {
                navigate(
                    `/choose-interests?userId=${data.user._id || data.user.id}`,
                );
            }
        } catch (err) {
            setServerError(err?.message || "Login failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            {/* Left side image */}
            <div className="login-image-container">
                <img
                    src={loginImage}
                    alt="Login illustration"
                    className="login-image"
                />
            </div>

            {/* Right side form */}
            <div className="login-form-container">
                <img src={logo} alt="SkillNest Logo" className="login-logo" />

                {/* Form wrapper */}
                <div className="login-form-wrapper">
                    <h3 className="login-title">Welcome Back!</h3>
                    <h3 className="login-subtitle">
                        Enter your email and password
                    </h3>

                    {serverError && (
                        <div className="login-error-alert" role="alert">
                            {serverError}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="login-form"
                        noValidate>
                        <div className="login-form-group">
                            <label
                                htmlFor="login-email"
                                className="login-label">
                                Email
                            </label>
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                                aria-invalid={Boolean(fieldErrors.email)}
                                className={`login-input ${fieldErrors.email ? "has-error" : ""}`}
                            />
                            {fieldErrors.email && (
                                <p className="login-field-error">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div className="login-form-group">
                            <label
                                htmlFor="login-password"
                                className="login-label">
                                Password
                            </label>
                            <div className="login-password-wrapper">
                                <input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    aria-invalid={Boolean(fieldErrors.password)}
                                    className={`login-input login-password-input ${fieldErrors.password ? "has-error" : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="login-password-toggle"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }>
                                    {showPassword ? (
                                        <EyeOffIcon />
                                    ) : (
                                        <EyeIcon />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="login-field-error">
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <p className="login-forgot-password">
                            <Link to="/forgot-password" className="login-link">
                                Forgot password?
                            </Link>
                        </p>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="login-submit">
                            {submitting ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="login-signup-text">
                        Don't have an account?{" "}
                        <Link to="/signup" className="login-link">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
