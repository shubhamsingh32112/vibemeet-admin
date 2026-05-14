import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StaffRealtimeProvider } from '../../contexts/StaffRealtimeContext';
import { ADMIN_VISIBLE_SECTIONS } from '../../types/dashboardStale';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <StaffRealtimeProvider portal="admin" visibleSections={ADMIN_VISIBLE_SECTIONS}>
    <div className="flex min-h-screen bg-admin-base text-zinc-200">
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-3 h-14 bg-admin-base/95 border-b border-admin-border backdrop-blur-md supports-[backdrop-filter]:bg-admin-base/80">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-admin-border bg-admin-surface text-zinc-200 text-lg"
          aria-label="Open navigation menu"
        >
          ☰
        </button>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Eazy Talks</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Admin</p>
        </div>
      </header>

      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/60 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-[51] w-[min(18rem,88vw)] md:hidden shadow-2xl shadow-black/50">
            <Sidebar
              className="min-h-full w-full border-r-0"
              onNavigate={() => setMobileNavOpen(false)}
              showClose
              onClose={() => setMobileNavOpen(false)}
            />
          </div>
        </>
      )}

      <main className="flex-1 overflow-auto min-w-0 pt-14 md:pt-0">
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
    </StaffRealtimeProvider>
  );
};

export default DashboardLayout;
