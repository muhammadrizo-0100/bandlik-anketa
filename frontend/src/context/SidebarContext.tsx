import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  toggleMobileOpen: () => void;
  closeMobileDrawer: () => void;
  openMobileDrawer: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  };

  const toggleSidebar = () => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleMobileOpen = () => setIsMobileOpen((prev) => !prev);
  const closeMobileDrawer = () => setIsMobileOpen(false);
  const openMobileDrawer = () => setIsMobileOpen(true);

  // Ekranni desktopga kattalashtirganda mobil pardani avtomatik yopish
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        setIsCollapsed,
        isMobileOpen,
        toggleMobileOpen,
        closeMobileDrawer,
        openMobileDrawer,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
