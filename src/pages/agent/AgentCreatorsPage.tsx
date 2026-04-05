import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { agentPortalService, type AgentCreatorRow } from '../../services/agentPortalService';

const AgentCreatorsPage: React.FC = () => {
  const [rows, setRows] = useState<AgentCreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await agentPortalService.getCreators({ page, limit: 30 });
      setRows(data.creators);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setErr('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && rows.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Creators</h1>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <div className="space-y-2 md:hidden">
        {rows.map((c) => (
          <Link
            key={c.id}
            to={`/agent/creators/${c.id}`}
            className="block rounded-xl border border-admin-border bg-admin-surface p-4"
          >
            <p className="text-white font-medium">{c.name}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {c.earningsCoins} earnings · {c.price} coins/min
            </p>
          </Link>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm">
          <thead className="bg-admin-elevated text-zinc-400 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Earnings</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Coins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-admin-border hover:bg-admin-elevated/40">
                <td className="px-4 py-3">
                  <Link to={`/agent/creators/${c.id}`} className="text-emerald-400 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400">{c.username || '—'}</td>
                <td className="px-4 py-3">{c.earningsCoins}</td>
                <td className="px-4 py-3">{c.price}</td>
                <td className="px-4 py-3">{c.coins ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-admin-border px-3 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-zinc-500 py-1">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-admin-border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentCreatorsPage;
