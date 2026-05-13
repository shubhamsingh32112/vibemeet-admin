import React from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  profilePath: string;
  onRemindLater: () => void;
};

/**
 * Shown after agency / BD login when the account still uses the auto-generated first password.
 */
const StaffOneTimePasswordModal: React.FC<Props> = ({ open, profilePath, onRemindLater }) => {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-password-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#12121a] p-6 shadow-2xl space-y-4">
        <h2 id="otp-password-modal-title" className="text-lg font-semibold text-white">
          One-time password
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          You signed in with a one-time password. Please change it to your own secure password. You can do that from
          your profile.
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onRemindLater}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 min-h-[44px]"
          >
            Remind me later
          </button>
          <button
            type="button"
            onClick={() => navigate(profilePath)}
            className="rounded-xl bg-admin-accent text-admin-base px-4 py-2.5 text-sm font-semibold hover:opacity-90 min-h-[44px]"
          >
            Go to profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffOneTimePasswordModal;
