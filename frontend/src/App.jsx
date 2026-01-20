import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupForm from "./components/SignupForm";
import LoginForm from "./components/LoginForm";
import ResetPasswordPage from "./components/ResetPasswordPage";
import ForgotPasswordPage from "./components/ForgotPassword";
import ChooseInterests from "./components/ChooseInterests";
import UserProfile from "./components/UserProfile";
import ExplorePage from "./components/ExplorePage";
import CommunitiesPage from "./components/CommunitiesPage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <Router>
      <div>
        {/* <h1 style={{ textAlign: "center" }}>SkillNest</h1> */}

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
