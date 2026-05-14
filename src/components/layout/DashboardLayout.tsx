import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminRealtimeProvider } from '../../contexts/AdminRealtimeContext';
import { AdminShellProvider } from '../../contexts/AdminShellContext';
import SuperAdminSidebar from '../admin/dashboard/SuperAdminSidebar';
import HeaderBar from '../admin/dashboard/HeaderBar';
import { Sheet, SheetContent, SheetHeader } from '../ui/sheet';

const DashboardLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminShellProvider>
      <AdminRealtimeProvider>
        <div className="flex min-h-screen bg-admin-base text-zinc-200 bg-hero-radial">
          <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-3 h-14 bg-[#08080f]/90 border-b border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-white/10 bg-admin-surface text-zinc-200 text-lg"
              aria-label="Open navigation menu"
            >
              ☰
            </button>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">MatchVibe</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Super Admin</p>
            </div>
          </header>

          <div className="hidden md:block shrink-0">
            <SuperAdminSidebar />
          </div>

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="p-0 md:hidden">
              <SheetHeader className="sr-only">Navigation</SheetHeader>
              <SuperAdminSidebar
                className="border-0 w-full"
                onNavigate={() => setMobileNavOpen(false)}
                showClose
                onClose={() => setMobileNavOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 flex-col min-w-0 pt-14 md:pt-0">
            <HeaderBar />
            <main className="flex-1 overflow-auto min-w-0">
              <div className="p-4 sm:p-6 max-w-[1920px] mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </AdminRealtimeProvider>
    </AdminShellProvider>
  );
};

export default DashboardLayout;
