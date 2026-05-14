import React from 'react';
import StaffPasswordChangeForm from '../../components/staff/StaffPasswordChangeForm';
import { useAgencyAuth } from '../../contexts/AgencyAuthContext';
import { agencyPortalService } from '../../services/agencyPortalService';

const AgencyProfilePage: React.FC = () => {
  const { user, updateUserFields } = useAgencyAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">Account details and password.</p>
      </div>

      <div className="rounded-xl border border-admin-border bg-admin-surface p-4 max-w-xl space-y-2">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Account</h2>
        <p className="text-sm text-zinc-300">
          <span className="text-zinc-500">Email</span>{' '}
          <span className="text-white font-medium">{user?.email ?? '—'}</span>
        </p>
        {user?.displayName ? (
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Display name</span>{' '}
            <span className="text-white">{user.displayName}</span>
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-admin-border bg-admin-surface p-4 max-w-xl space-y-4">
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <p className="text-sm text-zinc-500">
          Use a strong password you have not used elsewhere. Minimum 8 characters.
        </p>
        <StaffPasswordChangeForm
          onSubmit={async (currentPassword, newPassword) => {
            await agencyPortalService.changePassword(currentPassword, newPassword);
            updateUserFields({ mustChangePassword: false });
          }}
        />
      </div>
    </div>
  );
};

export default AgencyProfilePage;
