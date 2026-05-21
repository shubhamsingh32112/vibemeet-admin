import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CREATOR_PRICE_TIERS } from '../../constants/creatorPriceTiers';
import { bdPortalService, type BdCreatorRow } from '../../services/bdPortalService';

const BdHostsPage: React.FC = () => {
  const [rows, setRows] = useState<BdCreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const list = await bdPortalService.listCreators();
      setRows(list);
    } catch {
      setErr('Failed to load hosts');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const savePrice = async (row: BdCreatorRow, price: number) => {
    if (row.price === price) return;
    setSavingId(row.id);
    setErr('');
    try {
      await bdPortalService.updateCreatorPrice(row.id, price);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, price } : r)));
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Failed to update price');
      setErr(msg);
    } finally {
      setSavingId(null);
    }
  };

  if (loading && rows.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Host pricing</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Set coins per minute for hosts under your agencies. New hosts default to 60 coins/min.
        </p>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      <div className="overflow-x-auto rounded-xl border border-admin-border">
        <table className="w-full text-sm text-left min-w-[640px]">
          <thead className="bg-admin-elevated text-zinc-400">
            <tr>
              <th className="px-3 py-2">Host</th>
              <th className="px-3 py-2">Photos</th>
              <th className="px-3 py-2">Agency</th>
              <th className="px-3 py-2">Coins / min</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-admin-border">
                <td className="px-3 py-2 text-zinc-200">
                  <div className="flex items-center gap-2">
                    {row.avatarUrl ? (
                      <img
                        src={row.avatarUrl}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                        {row.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="block font-medium">{row.name}</span>
                      <span className="text-xs text-zinc-500">{row.userLabel || '—'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-zinc-400 text-xs tabular-nums">
                  {(row.galleryCount ?? 0) > 0 ? `${row.galleryCount} gallery` : 'No gallery'}
                  <span className="block text-zinc-600">
                    {row.avatarUrl ? 'DP set' : 'No DP'}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-400 text-xs">{row.agencyLabel || '—'}</td>
                <td className="px-3 py-2">
                  <select
                    value={row.price}
                    disabled={savingId === row.id}
                    onChange={(e) => savePrice(row, Number(e.target.value))}
                    className="rounded-lg bg-admin-base border border-admin-border px-2 py-1.5 text-sm text-white min-w-[100px]"
                  >
                    {CREATOR_PRICE_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                  {savingId === row.id ? (
                    <span className="ml-2 text-xs text-zinc-500">Saving…</span>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <Link
                    to={`/bd/hosts/${row.id}`}
                    className="text-sm text-emerald-400 hover:underline whitespace-nowrap"
                  >
                    View profile
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                  No hosts under your agencies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BdHostsPage;
