import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import logo from '../assets/Logo.png';
import { clearAuth } from '../utils/tokenUtils';
import { useNotifications } from '../hooks/useNotifications';

// Define default navigation items
const defaultNavItems = [
  { id: 'home', label: 'Home', href: '/', icon: House },
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
          className="lg:hidden fixed top-4 left-4 z-[102] p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-[101] bg-white border-r border-gray-200 
          transition-all duration-300 ease-in-out flex flex-col
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobile && isCollapsed ? '-translate-x-full' : 'translate-x-0'}
          ${className}
        `}
      >
        {/* Header */}
        <div className={`p-6 border-b border-gray-100 flex items-center justify-between ${isCollapsed ? 'px-4' : ''}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img src={logo} alt="SkillNest Logo" className="h-10" />
              <div>
                <h2 className="font-bold text-gray-900 text-sm">SkillNest</h2>
                <p className="text-xs text-gray-500">Your learning space</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <img src={logo} alt="SkillNest Logo" className="h-8 mx-auto" />
          )}

          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const href = getHref(item);
            const isActive = isActivePath(item.href);

            return (
              <Link
                key={item.id}
                to={href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${isCollapsed ? 'justify-center px-2' : ''}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.id === 'notifications' && typeof unreadCount === 'number' && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : String(unreadCount)}
                      </span>
                    )}
                  </div>
                )}
                {isCollapsed && item.id === 'notifications' && typeof unreadCount === 'number' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : String(unreadCount)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={openLogoutModal}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl 
              text-gray-600 hover:bg-red-50 hover:text-red-600 
              font-medium transition-all duration-200
              ${isCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[103] flex justify-center items-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={closeLogoutModal} 
          />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout? Your session will expire.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={closeLogoutModal} 
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeLogout} 
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
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