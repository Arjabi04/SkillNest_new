import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import SignupForm from "./pages/SignupForm";
import LoginForm from "./pages/LoginForm";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ChooseInterests from "./pages/ChooseInterests";
import UserProfile from "./pages/UserProfile";
import ProfileViewPage from "./pages/ProfileViewPage";
import ExplorePage from "./pages/ExplorePage";
import CommunitiesPage from "./pages/CommunitiesPage";
import MarketplacePage from "./pages/MarketplacePage";
import EventsPage from "./pages/EventsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ToastContainer from "./components/ToastContainer";
import { useEffect } from "react";
import { clearAuth, isTokenValid } from "./utils/tokenUtils";
import { showToast } from "./utils/toast";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const originalAlert = window.alert;

    // Render all legacy alert() calls as non-blocking toasts.
    window.alert = (message) => {
      showToast(message || "Notice", { type: "info" });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    // Check token validity on app load and periodically
    const checkToken = () => {
      const token = localStorage.getItem("token");
      
      if (token && !isTokenValid(token)) {
        console.log("Token expired, clearing auth");
        clearAuth();
        navigate("/login");
      }
    };

    // Check on mount
    checkToken();

    // Check every 30 seconds
    const interval = setInterval(checkToken, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Home route starts on login */}
        <Route path="/" element={<ExplorePage />} />
        <Route path="/login" element={<LoginForm />} />

        <Route path="/signup" element={<SignupForm />} />
        {/* <Route path="/login" element={<LoginForm />} /> */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/choose-interests" element={<ChooseInterests />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/profile/view" element={<ProfileViewPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      </div>
    );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
export default App;