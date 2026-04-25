import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.png';
import { clearAuth } from '../utils/tokenUtils';
import { useNotifications } from '../hooks/useNotifications';
import './Sidebar.css';

// SVG Icons
const ChevronLeft = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const Menu = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const Home = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const User = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Users = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ShoppingBag = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
  </svg>
);

const Calendar = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Bell = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const Settings = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogOut = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// Define default navigation items
const defaultNavItems = [
  { id: 'home', label: 'Home', href: '/', icon: Home },
  { id: 'profile', label: 'Profile', href: '/profile', icon: User, dynamic: true },
  { id: 'communities', label: 'Communities', href: '/communities', icon: Users },
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { id: 'events', label: 'Events', href: '/events', icon: Calendar },
  { id: 'notifications', label: 'Notifications', href: '/notifications', icon: Bell },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = ({ 
  navItems = defaultNavItems, 
  className = "",
  onLogout,
  showLogoutConfirm,
  setShowLogoutConfirm 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [internalShowLogoutConfirm, setInternalShowLogoutConfirm] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const { unreadCount = 0 } = useNotifications() || {};

  const isControlledLogoutModal =
    typeof showLogoutConfirm === 'boolean' &&
    typeof setShowLogoutConfirm === 'function';

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const executeLogout = () => {
    closeLogoutModal();
    if (typeof onLogout === 'function') {
      onLogout();
      return;
    }
    handleLogout();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getHref = (item) => {
    if (item.dynamic && item.id === 'profile') {
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
          className="sidebar-mobile-toggle"
        >
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
        className={`sidebar-container ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobile && isCollapsed ? 'mobile-hidden' : 'mobile-visible'} ${className}`}
      >
        {/* Header */}
        <div className={`sidebar-header ${isCollapsed ? 'collapsed' : ''}`}>
          {!isCollapsed && (
            <div className="sidebar-logo-group">
              <img src={logo} alt="SkillNest Logo" className="sidebar-logo" />
              <div>
                <h2 className="sidebar-brand">SkillNest</h2>
                <p className="sidebar-subtitle">Your learning space</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <img src={logo} alt="SkillNest Logo" className="sidebar-logo collapsed" />
          )}

          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className={`sidebar-toggle-btn ${isCollapsed ? 'rotated' : ''}`}
            >
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
                className={`sidebar-nav-item ${isActive ? 'active' : 'inactive'} ${isCollapsed ? 'collapsed' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className={`sidebar-nav-icon ${isActive ? 'active' : ''}`} />
                {!isCollapsed && (
                  <div className="sidebar-nav-label-group">
                    <span className="sidebar-nav-label">{item.label}</span>
                    {item.id === 'notifications' && typeof unreadCount === 'number' && unreadCount > 0 && (
                      <span className="sidebar-badge">
                        {unreadCount > 99 ? '99+' : String(unreadCount)}
                      </span>
                    )}
                  </div>
                )}
                {isCollapsed && item.id === 'notifications' && typeof unreadCount === 'number' && unreadCount > 0 && (
                  <span className="sidebar-badge-collapsed">
                    {unreadCount > 9 ? '9+' : String(unreadCount)}
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
            className={`sidebar-logout-btn ${isCollapsed ? 'collapsed' : ''}`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="sidebar-logout-icon" />
            {!isCollapsed && <span className="sidebar-logout-label">Logout</span>}
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
                Are you sure you want to logout? Your session will expire.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={closeLogoutModal} 
                className="modal-btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={executeLogout} 
                className="modal-btn-confirm"
              >
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