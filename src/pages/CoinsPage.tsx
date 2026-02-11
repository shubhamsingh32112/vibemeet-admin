import React, { useEffect, useState } from 'react';
import MetricCard from '../components/ui/MetricCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import { adminService, type CoinEconomy } from '../services/adminService';

const CoinsPage: React.FC = () => {
  const [data, setData] = useState<CoinEconomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const economy = await adminService.getCoinEconomy();
      setData(economy);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading coin economy…" />;
  if (error)
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-4 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700">
          Retry
        </button>
      </div>
    );
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Coins & Transactions</h1>
        <button
          onClick={load}
          className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── High-level metrics ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <MetricCard
          label="In Circulation"
          value={data.totalInCirculation}
          variant="warning"
        />
        <MetricCard
          label="All-Time Minted"
          value={data.allTimeMinted}
          subtitle={`${data.allTimeMintedCount} txns`}
          variant="success"
        />
        <MetricCard
          label="All-Time Burned"
          value={data.allTimeBurned}
          subtitle={`${data.allTimeBurnedCount} txns`}
          variant="danger"
        />
        <MetricCard
          label="Net Minted"
          value={data.allTimeMinted - data.allTimeBurned}
          variant="info"
        />
        <MetricCard
          label="Leak Check"
          value={
            data.totalInCirculation === data.allTimeMinted - data.allTimeBurned
              ? '✓ OK'
              : `⚠ Off by ${Math.abs(
                  data.totalInCirculation - (data.allTimeMinted - data.allTimeBurned)
                )}`
          }
          variant={
            data.totalInCirculation === data.allTimeMinted - data.allTimeBurned
              ? 'success'
              : 'danger'
          }
        />
      </div>

      {/* ── Daily Flow Table (last 30 days) ───── */}
      <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
        📈 Daily Coin Flow (30d)
      </h2>
      <div className="overflow-auto max-h-80 border border-gray-800 rounded-lg mb-6">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-800">
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Date</th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">
                Credited
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">
                Debited
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">Net</th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold">
                Txn Count
              </th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Bar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {[...data.dailyFlow].reverse().map((day) => {
              const net = day.credited - day.debited;
              const maxFlow = Math.max(
                ...data.dailyFlow.map((d) => Math.max(d.credited, d.debited)),
                1
              );
              return (
                <tr key={day.date} className="bg-gray-900 hover:bg-gray-800/60">
                  <td className="px-3 py-1.5 text-gray-300 font-mono">{day.date}</td>
                  <td className="px-3 py-1.5 text-right text-emerald-400 tabular-nums">
                    +{day.credited.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 text-right text-red-400 tabular-nums">
                    −{day.debited.toLocaleString()}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right tabular-nums font-medium ${
                      net >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {net >= 0 ? '+' : ''}
                    {net.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 text-right text-gray-500 tabular-nums">
                    {day.creditCount + day.debitCount}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <div
                        className="h-2 bg-emerald-600 rounded-sm"
                        style={{
                          width: `${(day.credited / maxFlow) * 80}px`,
                        }}
                      />
                      <div
                        className="h-2 bg-red-600 rounded-sm"
                        style={{
                          width: `${(day.debited / maxFlow) * 80}px`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Top Spenders & Earners ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top Spenders */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
            🔥 Top Spenders (30d)
          </h2>
          <div className="space-y-1">
            {data.topSpenders.map((s, i) => (
              <div
                key={s.userId}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-5 text-right">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="text-sm text-white">
                      {s.username || s.email || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {s.txCount} transactions · {s.role}
                    </p>
                  </div>
                </div>
                <span className="text-red-400 font-bold tabular-nums">
                  −{(s.totalSpent ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
            {data.topSpenders.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">
                No spending data
              </p>
            )}
          </div>
        </div>

        {/* Top Earners */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
            💎 Top Earners (30d)
          </h2>
          <div className="space-y-1">
            {data.topEarners.map((e, i) => (
              <div
                key={e.userId}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-5 text-right">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="text-sm text-white">
                      {e.username || e.email || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {e.txCount} transactions · {e.role}
                    </p>
                  </div>
                </div>
                <span className="text-emerald-400 font-bold tabular-nums">
                  +{(e.totalEarned ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
            {data.topEarners.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">
                No earning data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Large Transactions ────────── */}
      <h2 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-1">
        🔍 Recent Large Transactions ({'>'} 50 coins)
      </h2>
      <div className="overflow-auto max-h-64 border border-gray-800 rounded-lg mb-6">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-800">
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Type</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Coins</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Source</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">User</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Description</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.recentLargeTransactions.map((tx) => (
              <tr key={tx.id} className="bg-gray-900 hover:bg-gray-800/60">
                <td className="px-3 py-1.5">
                  <StatusBadge
                    variant={tx.type === 'credit' ? 'success' : 'danger'}
                    label={tx.type}
                  />
                </td>
                <td className="px-3 py-1.5 tabular-nums font-medium">{tx.coins}</td>
                <td className="px-3 py-1.5 text-gray-400">{tx.source}</td>
                <td className="px-3 py-1.5 text-gray-300">
                  {tx.user?.username || tx.user?.email || '—'}
                </td>
                <td className="px-3 py-1.5 text-gray-500 max-w-xs truncate">
                  {tx.description}
                </td>
                <td className="px-3 py-1.5 text-gray-500">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Failed Transactions ──────────────── */}
      {data.failedTransactions.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-red-400 mb-3 border-b border-red-800 pb-1">
            ⚠ Failed Transactions
          </h2>
          <div className="overflow-auto max-h-48 border border-red-800 rounded-lg mb-6">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="border-b border-gray-700">
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Type</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Coins</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Source</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Description</th>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.failedTransactions.map((tx) => (
                  <tr key={tx.id} className="bg-red-950/20 hover:bg-red-900/20">
                    <td className="px-3 py-1.5 text-red-400">{tx.type}</td>
                    <td className="px-3 py-1.5 tabular-nums">{tx.coins}</td>
                    <td className="px-3 py-1.5 text-gray-400">{tx.source}</td>
                    <td className="px-3 py-1.5 text-gray-500 max-w-xs truncate">{tx.description}</td>
                    <td className="px-3 py-1.5 text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CoinsPage;
