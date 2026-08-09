import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import {
  adminService,
  type CreatorReferralConfig,
  type CreatorReferralDetailResponse,
  type CreatorReferralListRow,
} from '../services/adminService';
import { SectionHeading } from '../components/admin/help/SectionHeading';

function formatTs(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function CreatorReferralsPage() {
  const [config, setConfig] = useState<CreatorReferralConfig | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [rewardCoins, setRewardCoins] = useState(500);
  const [saving, setSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const [rows, setRows] = useState<CreatorReferralListRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CreatorReferralDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await adminService.getCreatorReferralConfig();
      setConfig(cfg);
      setEnabled(cfg.enabled);
      setRewardCoins(cfg.rewardCoins);
      setConfigError(null);
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : 'Failed to load config');
    }
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await adminService.listCreatorReferrals({
        page,
        limit: 20,
        search: search || undefined,
      });
      setRows(data.rows);
      setTotalPages(data.pagination.totalPages);
      setListError(null);
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Failed to load list');
    } finally {
      setListLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!detailUserId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void adminService
      .getCreatorReferralDetail(detailUserId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailUserId]);

  async function saveConfig() {
    setSaving(true);
    try {
      const cfg = await adminService.updateCreatorReferralConfig({
        enabled,
        rewardCoins,
      });
      setConfig(cfg);
      setConfigError(null);
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <SectionHeading
        title="Creators referrals"
        helpKey="hosts.creator-referrals"
        level={1}
      />
      <p className="text-sm text-zinc-400 max-w-2xl">
        Creators share a <span className="font-mono text-emerald-400">CR-</span> code.
        When a referred user joins Telegram (Rewards) and completes any video call, the
        creator receives the configured coins. Users still keep their normal Rewards Hub
        claims.
      </p>

      <section className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Gift className="h-4 w-4" /> Reward config
        </h2>
        {configError && <p className="text-sm text-red-400">{configError}</p>}
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enable creator referral rewards
        </label>
        <label className="text-sm text-zinc-400 block max-w-xs">
          Coins per completed referral
          <input
            type="number"
            min={1}
            max={10000}
            value={rewardCoins}
            onChange={(e) => setRewardCoins(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
          />
        </label>
        {config?.updatedAt && (
          <p className="text-xs text-zinc-500">Last updated: {formatTs(config.updatedAt)}</p>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveConfig()}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
        >
          Save config
        </button>
      </section>

      <section className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-zinc-400 block flex-1 min-w-[200px]">
            Search creators
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setSearch(searchInput.trim());
                }
              }}
              placeholder="Name…"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
            />
          </label>
          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-white/10 text-sm text-white"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            Search
          </button>
        </div>

        {listError && <p className="text-sm text-red-400">{listError}</p>}
        {listLoading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="overflow-auto border border-white/10 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-3 py-2 text-left text-zinc-400">Creator</th>
                  <th className="px-3 py-2 text-left text-zinc-400">Code</th>
                  <th className="px-3 py-2 text-right text-zinc-400">Referred</th>
                  <th className="px-3 py-2 text-right text-zinc-400">Completed</th>
                  <th className="px-3 py-2 text-right text-zinc-400">Rewarded</th>
                  <th className="px-3 py-2 text-right text-zinc-400">Coins paid</th>
                  <th className="px-3 py-2 text-right text-zinc-400">Unpaid</th>
                  <th className="px-3 py-2 text-left text-zinc-400" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-zinc-500">
                      No creators found
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.creatorUserId} className="hover:bg-white/[0.03]">
                      <td className="px-3 py-2 text-zinc-200">
                        {r.name}
                        {r.isDisabled && (
                          <span className="ml-2 text-amber-400/80">(disabled)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-emerald-400/90">
                        {r.referralCode || '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-300">{r.referredCount}</td>
                      <td className="px-3 py-2 text-right text-zinc-300">{r.completedBoth}</td>
                      <td className="px-3 py-2 text-right text-zinc-300">{r.rewardedCount}</td>
                      <td className="px-3 py-2 text-right text-zinc-300">{r.coinsPaid}</td>
                      <td className="px-3 py-2 text-right text-amber-300/90">
                        {r.eligibleUnpaid || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-violet-400 hover:underline"
                          onClick={() => setDetailUserId(r.creatorUserId)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <button
            type="button"
            disabled={page <= 1}
            className="disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </section>

      {detailUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-auto rounded-xl border border-admin-border bg-admin-surface p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-medium text-white">
                  {detail?.name ?? 'Creator'} referrals
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {detail?.referralCode ?? '—'} · {detailUserId}
                </p>
                {detail?.creatorId && (
                  <Link
                    to={`/hosts/all/${detail.creatorId}`}
                    className="text-xs text-violet-400 hover:underline"
                  >
                    Open host profile
                  </Link>
                )}
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-white text-sm"
                onClick={() => setDetailUserId(null)}
              >
                Close
              </button>
            </div>
            {detailLoading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : !detail ? (
              <p className="text-sm text-red-400">Failed to load detail</p>
            ) : (
              <div className="overflow-auto border border-white/10 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-2 py-2 text-left text-zinc-400">User</th>
                      <th className="px-2 py-2 text-left text-zinc-400">Telegram</th>
                      <th className="px-2 py-2 text-left text-zinc-400">Call</th>
                      <th className="px-2 py-2 text-left text-zinc-400">Reward</th>
                      <th className="px-2 py-2 text-left text-zinc-400">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {detail.referrals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-zinc-500">
                          No referred users yet
                        </td>
                      </tr>
                    ) : (
                      detail.referrals.map((row) => (
                        <tr key={row.userId}>
                          <td className="px-2 py-2 text-zinc-200">
                            <div>{row.name}</div>
                            <div className="text-zinc-500 font-mono">{row.userId.slice(-8)}</div>
                          </td>
                          <td className="px-2 py-2">
                            {row.telegramJoined ? (
                              <span className="text-emerald-400">Done</span>
                            ) : (
                              <span className="text-zinc-500">Pending</span>
                            )}
                            <div className="text-zinc-600">{formatTs(row.telegramJoinedAt)}</div>
                          </td>
                          <td className="px-2 py-2">
                            {row.videoCallCompleted ? (
                              <span className="text-emerald-400">Done</span>
                            ) : (
                              <span className="text-zinc-500">Pending</span>
                            )}
                            <div className="text-zinc-600">
                              {formatTs(row.videoCallCompletedAt)}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            {row.rewarded ? (
                              <span className="text-emerald-400">
                                Paid ({row.rewardCoins ?? '—'})
                              </span>
                            ) : row.eligibleUnpaid ? (
                              <span className="text-amber-400">Eligible unpaid</span>
                            ) : (
                              <span className="text-zinc-500">Waiting</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-zinc-400">{formatTs(row.joinedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
