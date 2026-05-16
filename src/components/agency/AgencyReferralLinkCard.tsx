import React, { useCallback, useMemo, useState } from 'react';
import { Copy, Link2, MessageCircle, Send } from 'lucide-react';
import {
  buildReferralJoinUrl,
  buildTelegramShareUrl,
  buildWhatsAppShareUrl,
} from '../../utils/referralJoinLink';

type Props = {
  referralCode?: string | null;
  displayName?: string | null;
  id?: string;
};

const AgencyReferralLinkCard: React.FC<Props> = ({
  referralCode,
  displayName,
  id = 'referral-link',
}) => {
  const [copied, setCopied] = useState(false);

  const code = referralCode?.trim().toUpperCase() || '';
  const joinUrl = useMemo(() => (code ? buildReferralJoinUrl(code) : ''), [code]);

  const copyLink = useCallback(async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [joinUrl]);

  const openShare = useCallback(
    (url: string) => {
      if (!code) return;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [code],
  );

  if (!code) {
    return (
      <section
        id={id}
        className="rounded-xl border border-admin-border bg-admin-surface p-5"
        aria-labelledby={`${id}-title`}
      >
        <h2
          id={`${id}-title`}
          className="text-xs font-semibold tracking-widest text-zinc-400 uppercase"
        >
          My referral link
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Referral code unavailable — contact support if this persists.
        </p>
      </section>
    );
  }

  const subtitle = displayName?.trim()
    ? `Invite new hosts to join ${displayName} and earn more commission`
    : 'Invite new hosts and earn more commission';

  return (
    <section
      id={id}
      className="rounded-xl border border-admin-border bg-admin-surface p-5 shadow-glow-sm"
      aria-labelledby={`${id}-title`}
    >
      <h2
        id={`${id}-title`}
        className="text-xs font-semibold tracking-widest text-zinc-300 uppercase"
      >
        My referral link
      </h2>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>

      <div className="mt-4 flex items-stretch gap-2 rounded-lg border border-admin-border bg-admin-elevated/80 px-3 py-2.5">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" aria-hidden />
        <input
          type="text"
          readOnly
          value={joinUrl}
          className="min-w-0 flex-1 bg-transparent text-xs font-mono text-zinc-200 outline-none"
          aria-label="Referral join link"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={copyLink}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-violet-300 transition hover:bg-violet-500/10 hover:text-white"
          aria-label={copied ? 'Copied' : 'Copy link'}
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <p className="mt-4 text-xs font-medium text-zinc-400">Share via</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => openShare(buildWhatsAppShareUrl(code))}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1fb855]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => openShare(buildTelegramShareUrl(code))}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a8fc4]"
        >
          <Send className="h-4 w-4" aria-hidden />
          Telegram
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-admin-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Link2 className="h-4 w-4" aria-hidden />
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </section>
  );
};

export default AgencyReferralLinkCard;
