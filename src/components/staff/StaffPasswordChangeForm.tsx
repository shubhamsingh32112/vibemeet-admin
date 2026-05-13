import React, { useState } from 'react';

type Props = {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Tighter layout for header account modal */
  compact?: boolean;
};

const StaffPasswordChangeForm: React.FC<Props> = ({ onSubmit, compact = false }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setOk('');
    if (newPassword.length < 8) {
      setErr('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setErr('New password and confirmation do not match.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(currentPassword, newPassword);
      setOk('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (ex: unknown) {
      const msg =
        ex && typeof ex === 'object' && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setErr(msg || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = compact
    ? 'w-full min-w-0 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none'
    : 'w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white';

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={compact ? 'space-y-3 w-full min-w-0' : 'space-y-3 max-w-md'}
    >
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {ok ? <p className="text-sm text-emerald-400">{ok}</p> : null}
      <label className="block space-y-1">
        <span className="text-xs text-zinc-500">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
          required
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-zinc-500">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          required
          minLength={8}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-zinc-500">Confirm new password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          required
          minLength={8}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className={
          compact
            ? 'w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50'
            : 'rounded-xl bg-admin-accent text-admin-base font-semibold px-4 py-2 text-sm disabled:opacity-50 min-h-[44px]'
        }
      >
        {loading ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
};

export default StaffPasswordChangeForm;
