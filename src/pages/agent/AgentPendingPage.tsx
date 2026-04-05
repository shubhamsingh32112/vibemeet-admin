import React, { useCallback, useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  agentPortalService,
  type AgentApplicationRow,
} from '../../services/agentPortalService';

const AgentPendingPage: React.FC = () => {
  const [rows, setRows] = useState<AgentApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState<{ row: AgentApplicationRow; action: 'accept' | 'reject' } | null>(
    null
  );
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agentPortalService.getPendingApplications(1, 100);
      setRows(data.applications);
    } catch {
      setErr('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === 'accept') {
        await agentPortalService.acceptApplication(confirm.row.id);
      } else {
        await agentPortalService.rejectApplication(confirm.row.id, notes || undefined);
      }
      setConfirm(null);
      setNotes('');
      await load();
    } catch (e: unknown) {
      alert('Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Pending applications</h1>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 && <p className="text-zinc-500 text-sm">No pending applications.</p>}
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-2"
          >
            <p className="text-white font-medium">{r.applicant?.username || r.applicant?.email || r.applicant?.phone || 'User'}</p>
            <p className="text-xs text-zinc-500">Code {r.referralCodeUsed}</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirm({ row: r, action: 'accept' })}
                className="flex-1 rounded-lg bg-emerald-600/90 text-white text-sm py-2"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => setConfirm({ row: r, action: 'reject' })}
                className="flex-1 rounded-lg border border-red-500/50 text-red-400 text-sm py-2"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-admin-elevated text-zinc-400">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Since</th>
              <th className="px-4 py-3 w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-admin-border">
                <td className="px-4 py-3 text-zinc-200">
                  {r.applicant?.username || r.applicant?.email || r.applicant?.phone || '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.referralCodeUsed}</td>
                <td className="px-4 py-3 text-zinc-500">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirm({ row: r, action: 'accept' })}
                    className="rounded-lg bg-emerald-600/90 text-white text-xs px-3 py-1.5"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ row: r, action: 'reject' })}
                    className="rounded-lg border border-red-500/50 text-red-400 text-xs px-3 py-1.5"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-zinc-500 text-sm">No pending applications.</p>}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'accept' ? 'Accept creator?' : 'Reject application?'}
        message={
          confirm?.action === 'accept'
            ? 'Creates a starter creator profile and assigns this creator to you.'
            : 'User stays a consumer. Optional message below.'
        }
        confirmLabel={confirm?.action === 'accept' ? 'Accept' : 'Reject'}
        confirmVariant={confirm?.action === 'accept' ? 'primary' : 'danger'}
        confirmDisabled={busy}
        onCancel={() => {
          setConfirm(null);
          setNotes('');
        }}
        onConfirm={run}
      >
        {confirm?.action === 'reject' && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason (optional)"
            className="mt-3 w-full rounded-lg bg-admin-base border border-admin-border px-3 py-2 text-sm text-white"
            rows={3}
          />
        )}
      </ConfirmDialog>
    </div>
  );
};

export default AgentPendingPage;
