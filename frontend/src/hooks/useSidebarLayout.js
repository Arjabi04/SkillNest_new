import { useState, useEffect } from 'react';

/**
 * Custom hook to manage sidebar responsive layout
 * Synchronizes with the sidebar's collapsed state stored in localStorage
 */
export const useSidebarLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'sidebar-collapsed') {
        setIsCollapsed(JSON.parse(e.newValue));
      }
    };

    // Listen for storage events (for cross-tab synchronization)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for direct localStorage changes in the same tab
    const checkSidebarState = () => {
      const saved = localStorage.getItem('sidebar-collapsed');
      const newState = saved !== null ? JSON.parse(saved) : false;
      if (newState !== isCollapsed) {
        setIsCollapsed(newState);
      }
    };

    // Check periodically (lightweight polling for same-tab changes)
    const interval = setInterval(checkSidebarState, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isCollapsed]);

  // Calculate the appropriate margin class
  const getMainContentClass = () => {
    if (isMobile) {
      // On mobile, no margin needed as sidebar is overlay
      return 'ml-0';
    }
    
    // On desktop, margin matches sidebar width
    return isCollapsed ? 'ml-16' : 'ml-64';
  };

  return {
    isCollapsed,
    isMobile,
    mainContentClass: `${getMainContentClass()} transition-all duration-300 ease-in-out`
  };
};

export default useSidebarLayout;