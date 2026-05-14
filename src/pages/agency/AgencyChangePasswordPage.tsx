import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgencyAuth } from '../../contexts/AgencyAuthContext';
import { agencyPortalService } from '../../services/agencyPortalService';

const AgencyChangePasswordPage: React.FC = () => {
  const { logout, user } = useAgencyAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await agencyPortalService.changePassword(currentPassword, newPassword);
      logout();
      navigate('/agency/login?passwordChanged=1', { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const forced = user?.mustChangePassword === true;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">
          {forced ? 'Set your password' : 'Change password'}
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          {forced
            ? 'Your account uses a one-time password. Choose a new password to continue.'
            : 'Enter your current password and choose a new one.'}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl bg-admin-elevated border border-admin-border px-3 py-2.5 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl bg-admin-elevated border border-admin-border px-3 py-2.5 text-sm text-white"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Confirm new password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-admin-elevated border border-admin-border px-3 py-2.5 text-sm text-white"
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-admin-accent text-admin-base font-semibold py-3 text-sm disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgencyChangePasswordPage;
