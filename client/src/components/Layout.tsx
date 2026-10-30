import React, { useState } from 'react';
import { Sidebar, NavPage } from './Sidebar';
import { Navbar } from './Navbar';

interface LayoutProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  onRefreshData?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onSelectPage,
  onRefreshData,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        currentPage={currentPage}
        onSelectPage={onSelectPage}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          currentPage={currentPage}
          onRefreshData={onRefreshData}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
