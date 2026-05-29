import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Menu,
    House,
    User,
    Users,
    ShoppingBag,
    Calendar,
    Bell,
    Settings,
    LogOut,
    MessageSquare,
} from "lucide-react";
import logo from "../assets/Logo.png";
import { clearAuth } from "../utils/tokenUtils";
import { useNotifications } from "../hooks/useNotifications";
import { useInbox } from "../hooks/useInbox";
import "./Sidebar.css";

// Define default navigation items
const defaultNavItems = [
    { id: "home", label: "Home", href: "/", icon: House },
    {
        id: "profile",
        label: "Profile",
        href: "/profile",
        icon: User,
        dynamic: true,
    },
    {
        id: "communities",
        label: "Communities",
        href: "/communities",
        icon: Users,
    },
    {
        id: "marketplace",
        label: "Marketplace",
        href: "/marketplace",
        icon: ShoppingBag,
    },
    { id: "events", label: "Events", href: "/events", icon: Calendar },
    { id: "inbox", label: "Inbox", href: "/inbox", icon: MessageSquare },
    {
        id: "notifications",
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
    },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

const Sidebar = ({
    navItems = defaultNavItems,
    className = "",
    onLogout,
    showLogoutConfirm,
    setShowLogoutConfirm,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [isMobile, setIsMobile] = useState(false);
    const [internalShowLogoutConfirm, setInternalShowLogoutConfirm] =
        useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const { unreadCount = 0 } = useNotifications() || {};
    const { unreadCount: inboxUnreadCount = 0 } = useInbox() || {};

    const isControlledLogoutModal =
        typeof showLogoutConfirm === "boolean" &&
        typeof setShowLogoutConfirm === "function";

    const isLogoutModalOpen = isControlledLogoutModal
        ? showLogoutConfirm
        : internalShowLogoutConfirm;

    const openLogoutModal = () => {
        if (isControlledLogoutModal) {
            setShowLogoutConfirm(true);
            return;
        }
        setInternalShowLogoutConfirm(true);
    };

    const closeLogoutModal = () => {
        if (isControlledLogoutModal) {
            setShowLogoutConfirm(false);
            return;
        }
        setInternalShowLogoutConfirm(false);
    };

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024; // lg breakpoint
            setIsMobile(mobile);
            if (mobile) {
                setIsCollapsed(true);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Persist sidebar state
    useEffect(() => {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    const handleLogout = () => {
        clearAuth();
        navigate("/login");
    };

    const executeLogout = () => {
        closeLogoutModal();
        if (typeof onLogout === "function") {
            onLogout();
            return;
        }
        handleLogout();
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const isActivePath = (path) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    const getHref = (item) => {
        if (item.dynamic && item.id === "profile") {
            return `${item.href}?userId=${userId}`;
        }
        return item.href;
    };

    return (
        <>
            {/* Mobile Menu Button */}
            {isMobile && (
                <button
                    onClick={toggleSidebar}
                    className="sidebar-mobile-toggle">
                    <Menu className="sidebar-icon-menu" />
                </button>
            )}

            {/* Mobile Overlay */}
            {isMobile && !isCollapsed && (
                <div
                    className="sidebar-mobile-overlay"
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar-container ${isCollapsed ? "collapsed" : "expanded"} ${isMobile && isCollapsed ? "mobile-hidden" : "mobile-visible"} ${className}`}>
                {/* Header */}
                <div
                    className={`sidebar-header ${isCollapsed ? "collapsed" : ""}`}>
                    {!isCollapsed && (
                        <div className="sidebar-logo-group">
                            <img
                                src={logo}
                                alt="SkillNest Logo"
                                className="sidebar-logo"
                            />
                            <div>
                                <h2 className="sidebar-brand">SkillNest</h2>
                                <p className="sidebar-subtitle">
                                    Your learning space
                                </p>
                            </div>
                        </div>
                    )}

                    {isCollapsed && (
                        <img
                            src={logo}
                            alt="SkillNest Logo"
                            className="sidebar-logo collapsed"
                        />
                    )}

                    {!isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className={`sidebar-toggle-btn ${isCollapsed ? "rotated" : ""}`}>
                            <ChevronLeft className="sidebar-toggle-icon" />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const href = getHref(item);
                        const isActive = isActivePath(item.href);

                        return (
                            <Link
                                key={item.id}
                                to={href}
                                className={`sidebar-nav-item ${isActive ? "active" : "inactive"} ${isCollapsed ? "collapsed" : ""}`}
                                title={isCollapsed ? item.label : ""}>
                                <Icon
                                    className={`sidebar-nav-icon ${isActive ? "active" : ""}`}
                                />
                                {!isCollapsed && (
                                    <div className="sidebar-nav-label-group">
                                        <span className="sidebar-nav-label">
                                            {item.label}
                                        </span>
                                        {item.id === "notifications" &&
                                            typeof unreadCount === "number" &&
                                            unreadCount > 0 && (
                                                <span className="sidebar-badge">
                                                    {unreadCount > 99
                                                        ? "99+"
                                                        : String(unreadCount)}
                                                </span>
                                            )}
                                        {item.id === "inbox" &&
                                            typeof inboxUnreadCount ===
                                                "number" &&
                                            inboxUnreadCount > 0 && (
                                                <span className="sidebar-badge sidebar-badge-inbox">
                                                    {inboxUnreadCount > 99
                                                        ? "99+"
                                                        : String(
                                                              inboxUnreadCount,
                                                          )}
                                                </span>
                                            )}
                                    </div>
                                )}
                                {isCollapsed &&
                                    item.id === "notifications" &&
                                    typeof unreadCount === "number" &&
                                    unreadCount > 0 && (
                                        <span className="sidebar-badge-collapsed">
                                            {unreadCount > 9
                                                ? "9+"
                                                : String(unreadCount)}
                                        </span>
                                    )}
                                {isCollapsed &&
                                    item.id === "inbox" &&
                                    typeof inboxUnreadCount === "number" &&
                                    inboxUnreadCount > 0 && (
                                        <span className="sidebar-badge-collapsed sidebar-badge-collapsed-inbox">
                                            {inboxUnreadCount > 9
                                                ? "9+"
                                                : String(inboxUnreadCount)}
                                        </span>
                                    )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="sidebar-footer">
                    <button
                        onClick={openLogoutModal}
                        className={`sidebar-logout-btn ${isCollapsed ? "collapsed" : ""}`}
                        title={isCollapsed ? "Logout" : ""}>
                        <LogOut className="sidebar-logout-icon" />
                        {!isCollapsed && (
                            <span className="sidebar-logout-label">Logout</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {isLogoutModalOpen && (
                <div className="modal-overlay-container">
                    <div
                        className="modal-backdrop"
                        onClick={closeLogoutModal}
                    />
                    <div className="modal-content">
                        <div className="modal-text-center">
                            <div className="modal-icon-container">
                                <LogOut className="modal-icon" />
                            </div>
                            <h3 className="modal-title">Confirm Logout</h3>
                            <p className="modal-desc">
                                Are you sure you want to logout? Your session
                                will expire.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button
                                onClick={closeLogoutModal}
                                className="modal-btn-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={executeLogout}
                                className="modal-btn-confirm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
