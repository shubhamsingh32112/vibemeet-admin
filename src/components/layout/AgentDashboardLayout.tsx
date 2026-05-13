import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AgentSidebar from './AgentSidebar';
import AgentHeaderBar from '../agent/AgentHeaderBar';
import StaffOneTimePasswordModal from '../staff/StaffOneTimePasswordModal';
import { useAgentAuth } from '../../contexts/AgentAuthContext';
import { agentPortalService } from '../../services/agentPortalService';

const OTP_MODAL_SKIP_KEY = 'mv_skip_otp_modal_agent';

const AgentDashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { user, updateUserFields } = useAgentAuth();
  const location = useLocation();

  const onProfileRoute = location.pathname.includes('/agent/profile');

  const [dismissedSession, setDismissedSession] = useState(false);

  useEffect(() => {
    if (!user) {
      setDismissedSession(false);
      return;
    }
    setDismissedSession(sessionStorage.getItem(`${OTP_MODAL_SKIP_KEY}_${user.id}`) === '1');
  }, [user?.id]);

  const syncMustChange = useCallback(async () => {
    if (!user) return;
    try {
      const s = await agentPortalService.getSummary();
      if (typeof s.mustChangePassword === 'boolean') {
        if (user.mustChangePassword !== s.mustChangePassword) {
          updateUserFields({ mustChangePassword: s.mustChangePassword });
        }
        if (!s.mustChangePassword) sessionStorage.removeItem(`${OTP_MODAL_SKIP_KEY}_${user.id}`);
      }
    } catch {
      /* ignore */
    }
  }, [user, updateUserFields]);

  useEffect(() => {
    void syncMustChange();
  }, [syncMustChange]);

  const showOtpModal = Boolean(user?.mustChangePassword) && !onProfileRoute && !dismissedSession;

  return (
    <div className="flex min-h-screen bg-admin-base text-zinc-200 bg-hero-radial">
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-3 h-14 bg-admin-base/95 border-b border-admin-border backdrop-blur-md">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-admin-border bg-admin-surface text-zinc-200 text-lg"
          aria-label="Open menu"
        >
          ☰
        </button>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">MatchVibe</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">BD</p>
        </div>
      </header>
      <div className="hidden md:block shrink-0">
        <AgentSidebar />
      </div>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/60 md:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-[51] w-[min(18rem,88vw)] md:hidden shadow-2xl">
            <AgentSidebar
              className="min-h-full w-full border-r-0"
              onNavigate={() => setOpen(false)}
              showClose
              onClose={() => setOpen(false)}
            />
          </div>
        </>
      )}
      <div className="flex flex-1 flex-col min-w-0 pt-14 md:pt-0">
        <AgentHeaderBar />
        <main className="flex-1 overflow-auto min-w-0">
          <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <StaffOneTimePasswordModal
        open={showOtpModal}
        profilePath="/agent/profile"
        onRemindLater={() => {
          if (user) sessionStorage.setItem(`${OTP_MODAL_SKIP_KEY}_${user.id}`, '1');
          setDismissedSession(true);
        }}
      />
    </div>
  );
};

export default AgentDashboardLayout;
