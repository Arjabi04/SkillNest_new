import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import SignupForm from "./components/SignupForm";
import LoginForm from "./components/LoginForm";
import ResetPasswordPage from "./components/ResetPasswordPage";
import ForgotPasswordPage from "./components/ForgotPassword";
import ChooseInterests from "./components/ChooseInterests";
import UserProfile from "./components/UserProfile";
import ExplorePage from "./components/ExplorePage";
import CommunitiesPage from "./components/CommunitiesPage";
import EventsPage from "./components/EventsPage";
import NotificationsPage from "./components/NotificationsPage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import { useEffect } from "react";
import { clearAuth, isTokenValid } from "./utils/tokenUtils";

function AppRoutes() {
  const navigate = useNavigate();

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
      <Routes>

          {/* Home route shows the main explore feed */}
          <Route path="/" element={<ExplorePage />} />

          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/choose-interests" element={<ChooseInterests />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/events" element={<EventsPage />} />          <Route path="/notifications" element={<NotificationsPage />} />        </Routes>
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