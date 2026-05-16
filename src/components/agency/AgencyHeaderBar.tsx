import * as React from 'react';
import { CalendarRange } from 'lucide-react';
import StaffNotificationsBell from '../staff/StaffNotificationsBell';
import { useAgencyNotifications } from '../../hooks/useStaffNotifications';
import { useAgencyAuth } from '../../contexts/AgencyAuthContext';
import StaffAccountMenu from '../staff/StaffAccountMenu';
import { agencyPortalService } from '../../services/agencyPortalService';

const AgencyHeaderBar: React.FC = () => {
  const { user, updateUserFields } = useAgencyAuth();
  const title = user?.displayName?.trim() || user?.email || 'Agency';
  const { alerts, isLoading, isError, refetchOnOpen } = useAgencyNotifications();

  const rangeLabel = React.useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    const fmt = (d: Date) =>
      `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
    return `${fmt(start)} – ${fmt(end)}`;
  }, []);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#070712]/95 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-bold tracking-tight text-white md:text-xl">{title}</h1>
          <span className="shrink-0 rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200 ring-1 ring-violet-500/30">
            Verified
          </span>
        </div>
        <p className="text-xs text-zinc-500">Agency dashboard</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 sm:flex">
          <CalendarRange className="h-3.5 w-3.5 text-violet-400" aria-hidden />
          <span className="tabular-nums">{rangeLabel}</span>
        </div>
        <StaffNotificationsBell
          alerts={alerts}
          isLoading={isLoading}
          isError={isError}
          onOpenChange={refetchOnOpen}
          variant="agency"
        />
        <StaffAccountMenu
          roleLabel="Agency"
          email={user?.email}
          displayName={user?.displayName}
          supportPath="/agency/support"
          onUpdateDisplayName={async (displayName) => {
            updateUserFields({ displayName });
          }}
          onChangePassword={async (currentPassword, newPassword) => {
            await agencyPortalService.changePassword(currentPassword, newPassword);
            updateUserFields({ mustChangePassword: false });
          }}
          onDisplayNameSaved={(displayName) => updateUserFields({ displayName })}
          onPasswordChanged={() => updateUserFields({ mustChangePassword: false })}
        />
      </div>
    </header>
  );
};

export default AgencyHeaderBar;
