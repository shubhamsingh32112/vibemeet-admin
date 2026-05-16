import * as React from 'react';
import bdApi from '../../config/bdApi';
import { useBdAuth } from '../../contexts/BdAuthContext';
import StaffNotificationsBell from '../staff/StaffNotificationsBell';
import { useBdNotifications } from '../../hooks/useStaffNotifications';
import { bdPortalService } from '../../services/bdPortalService';
import StaffAccountMenu from '../staff/StaffAccountMenu';

const BdHeaderBar: React.FC = () => {
  const { user, updateUser } = useBdAuth();
  const title = user?.displayName?.trim() || user?.email || 'BD';
  const { alerts, isLoading, isError, refetchOnOpen } = useBdNotifications(user?.mustChangePassword);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#070712]/95 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold tracking-tight text-white md:text-xl">{title}</h1>
        <p className="text-xs text-zinc-500">BD dashboard</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <StaffNotificationsBell
          alerts={alerts}
          isLoading={isLoading}
          isError={isError}
          onOpenChange={refetchOnOpen}
          variant="agency"
        />
        <StaffAccountMenu
          roleLabel="BD"
          email={user?.email}
          displayName={user?.displayName}
          supportPath="/bd"
          onUpdateDisplayName={async (displayName) => {
            await bdApi.patch('/bd/profile', { displayName });
            updateUser({ displayName });
          }}
          onChangePassword={async (currentPassword, newPassword) => {
            await bdPortalService.changePassword(currentPassword, newPassword);
            updateUser({ mustChangePassword: false });
          }}
          onDisplayNameSaved={(displayName) => updateUser({ displayName })}
          onPasswordChanged={() => updateUser({ mustChangePassword: false })}
        />
      </div>
    </header>
  );
};

export default BdHeaderBar;
