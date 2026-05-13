import * as React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Headphones, KeyRound, UserPen, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import StaffPasswordChangeForm from './StaffPasswordChangeForm';

type Props = {
  roleLabel: string;
  email?: string | null;
  displayName?: string | null;
  supportPath: string;
  onUpdateDisplayName: (displayName: string) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onDisplayNameSaved?: (displayName: string) => void;
  onPasswordChanged?: () => void;
};

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="my-auto w-full max-w-md max-h-[min(90vh,640px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#12121a] p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-account-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id="staff-account-modal-title" className="text-lg font-semibold text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const StaffAccountMenu: React.FC<Props> = ({
  roleLabel,
  email,
  displayName,
  supportPath,
  onUpdateDisplayName,
  onChangePassword,
  onDisplayNameSaved,
  onPasswordChanged,
}) => {
  const navigate = useNavigate();
  const [nameOpen, setNameOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(displayName?.trim() || '');
  const [nameErr, setNameErr] = React.useState('');
  const [nameSaving, setNameSaving] = React.useState(false);

  React.useEffect(() => {
    if (nameOpen) {
      setNameInput(displayName?.trim() || '');
      setNameErr('');
    }
  }, [nameOpen, displayName]);

  const initial = (displayName?.[0] || email?.[0] || roleLabel[0] || '?').toUpperCase();

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameErr('Enter a display name.');
      return;
    }
    setNameSaving(true);
    setNameErr('');
    try {
      await onUpdateDisplayName(trimmed);
      onDisplayNameSaved?.(trimmed);
      setNameOpen(false);
    } catch (ex: unknown) {
      const msg =
        ex && typeof ex === 'object' && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setNameErr(msg || 'Could not update name.');
    } finally {
      setNameSaving(false);
    }
  };

  return (
  <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 py-1.5 pl-1.5 pr-2.5 text-left transition hover:border-violet-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            aria-label="Account menu"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-bold text-white">
              {initial}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-medium text-white">{roleLabel}</p>
              <p className="max-w-[140px] truncate text-[10px] text-zinc-500">{email || '—'}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-zinc-500 sm:block" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-white">{displayName?.trim() || roleLabel}</p>
            <p className="truncate text-[10px] text-zinc-500">{email || '—'}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setNameOpen(true)}>
            <UserPen className="mr-2 h-4 w-4 text-violet-300" />
            Change name
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4 text-violet-300" />
            Change password
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              navigate(supportPath);
            }}
          >
            <Headphones className="mr-2 h-4 w-4 text-violet-300" />
            Contact us
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {nameOpen ? (
        <ModalShell title="Change display name" onClose={() => setNameOpen(false)}>
          <p className="mb-3 text-sm text-zinc-500">This name appears in your dashboard header.</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={120}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
            placeholder="Your display name"
            autoFocus
          />
          {nameErr ? <p className="mt-2 text-sm text-red-400">{nameErr}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNameOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={nameSaving}
              onClick={() => void saveName()}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {nameSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {passwordOpen ? (
        <ModalShell title="Change password" onClose={() => setPasswordOpen(false)}>
          <StaffPasswordChangeForm
            compact
            onSubmit={async (currentPassword, newPassword) => {
              await onChangePassword(currentPassword, newPassword);
              onPasswordChanged?.();
              setPasswordOpen(false);
            }}
          />
        </ModalShell>
      ) : null}
    </>
  );
};

export default StaffAccountMenu;
