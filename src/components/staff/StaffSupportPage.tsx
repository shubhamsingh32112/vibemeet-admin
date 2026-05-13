import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosInstance } from 'axios';
import LoadingSpinner from '../ui/LoadingSpinner';
import StatusBadge from '../ui/StatusBadge';
import {
  createStaffSupportService,
  type StaffSupportTicket,
} from '../../services/staffSupportService';
import { formatDateTime } from '../../utils/dateTime';

const CATEGORIES = [
  { value: 'account', label: 'Account & access' },
  { value: 'payouts', label: 'Payouts & withdrawals' },
  { value: 'hosts', label: 'Hosts / creators' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'other', label: 'Other' },
] as const;

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

function statusVariant(status: string) {
  switch (status) {
    case 'open':
      return 'info' as const;
    case 'in_progress':
      return 'warning' as const;
    case 'resolved':
      return 'success' as const;
    case 'closed':
      return 'neutral' as const;
    default:
      return 'neutral' as const;
  }
}

type Props = {
  api: AxiosInstance;
  portalLabel: 'Agency' | 'BD';
};

const StaffSupportPage: React.FC<Props> = ({ api, portalLabel }) => {
  const support = useMemo(() => createStaffSupportService(api), [api]);
  const [tickets, setTickets] = useState<StaffSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const list = await support.getMyTickets();
      setTickets(list);
    } catch {
      setErr('Failed to load your support requests');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [support]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr('');
    setOk('');
    try {
      await support.createTicket({ category, subject, message, priority });
      setSubject('');
      setMessage('');
      setOk('Request submitted. Super admin will review it in the support queue.');
      await load();
    } catch (ex: unknown) {
      const msg =
        ex && typeof ex === 'object' && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setErr(msg || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">MatchVibe</p>
        <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">Support</h2>
        <p className="mt-1 max-w-2xl text-xs text-zinc-500">
          Submit a request to the MatchVibe super-admin team. You can track status and admin replies
          below.
        </p>
      </div>

      <form
        onSubmit={(e) => void submit(e)}
        className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-5 space-y-4 max-w-2xl"
      >
        <h3 className="text-sm font-semibold text-white">New request ({portalLabel})</h3>
        {err ? <p className="text-sm text-red-400">{err}</p> : null}
        {ok ? <p className="text-sm text-emerald-400">{ok}</p> : null}

        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5 text-sm text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5 text-sm text-white"
            placeholder="Short summary"
            required
            minLength={3}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[120px] rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5 text-sm text-white resize-y"
            placeholder="Describe the issue or question in detail…"
            required
            minLength={10}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2.5 text-sm text-white"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 hover:bg-violet-500 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit to super admin'}
        </button>
      </form>

      <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-white">Your requests</h3>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/40 hover:text-white"
          >
            Refresh
          </button>
        </div>
        {tickets.length === 0 ? (
          <p className="text-sm text-zinc-500">No support requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border border-white/[0.04] bg-zinc-900/40 px-4 py-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{t.subject}</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge variant={statusVariant(t.status)} label={t.status.replace('_', ' ')} dot />
                    <StatusBadge variant="neutral" label={t.priority} />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 capitalize">{t.category.replace(/_/g, ' ')}</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{t.message}</p>
                {t.adminNotes ? (
                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-violet-300/80">Admin reply</p>
                    <p className="text-xs text-zinc-200 mt-1 whitespace-pre-wrap">{t.adminNotes}</p>
                  </div>
                ) : null}
                <p className="text-[10px] text-zinc-500">{formatDateTime(t.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StaffSupportPage;
