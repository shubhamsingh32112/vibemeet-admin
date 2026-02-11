import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { type Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  adminService,
  type UserAnalytics,
  type UserLedger,
} from '../services/adminService';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('');

  // Ledger drill-down
  const [ledger, setLedger] = useState<UserLedger | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Coin adjustment modal
  const [adjustTarget, setAdjustTarget] = useState<UserAnalytics | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getUsersAnalytics({
        query: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        sort: sortBy || undefined,
      });
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  const openLedger = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setLedgerLoading(true);
      const data = await adminService.getUserLedger(userId);
      setLedger(data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to load ledger');
      setSelectedUserId(null);
    } finally {
      setLedgerLoading(false);
    }
  };

  const closeLedger = () => {
    setLedger(null);
    setSelectedUserId(null);
  };

  const handleAdjustCoins = async () => {
    if (!adjustTarget) return;
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Enter a valid non-zero amount');
      return;
    }
    if (!adjustReason || adjustReason.trim().length < 5) {
      alert('Reason must be at least 5 characters');
      return;
    }
    try {
      const result = await adminService.adjustUserCoins(
        adjustTarget.id,
        amount,
        adjustReason
      );
      alert(`Coins adjusted: ${result.oldBalance} → ${result.newBalance}`);
      setAdjustTarget(null);
      setAdjustAmount('');
      setAdjustReason('');
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to adjust coins');
    }
  };

  const columns: Column<UserAnalytics>[] = [
    {
      key: 'username',
      header: 'User',
      width: '180px',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.avatar ? (
            <img src={row.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-400">
              {(row.username || row.email || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white text-sm">{row.username || 'No username'}</p>
            <p className="text-[10px] text-gray-500">{row.email || row.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <StatusBadge
          variant={
            row.role === 'admin'
              ? 'danger'
              : row.role === 'creator'
              ? 'info'
              : 'neutral'
          }
          label={row.role}
        />
      ),
    },
    {
      key: 'coins',
      header: 'Balance',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums font-medium">{row.coins.toLocaleString()}</span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Spent',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-red-400">{row.totalSpent.toLocaleString()}</span>
      ),
    },
    {
      key: 'totalCredited',
      header: 'Credited',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-emerald-400">
          {row.totalCredited.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'callCount',
      header: 'Calls',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.callCount}</span>,
    },
    {
      key: 'totalCallMinutes',
      header: 'Call Mins',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.totalCallMinutes}</span>,
    },
    {
      key: 'chatChannels',
      header: 'Chats',
      render: (row) => (
        <span className="tabular-nums text-xs">
          {row.chatChannels}ch · {row.freeMessages}f / {row.paidMessages}p
        </span>
      ),
    },
    {
      key: 'welcomeBonusClaimed',
      header: 'Bonus',
      render: (row) =>
        row.welcomeBonusClaimed ? (
          <span className="text-emerald-400 text-xs">✓</span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openLedger(row.id);
            }}
            className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition"
          >
            Ledger
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAdjustTarget(row);
            }}
            className="px-2 py-1 text-xs bg-blue-900/30 border border-blue-800 rounded text-blue-400 hover:text-blue-200 transition"
          >
            Coins
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Users Analytics</h1>
        <button
          onClick={load}
          className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search name / email / phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="creator">Creators</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none"
        >
          <option value="">Sort: Recent</option>
          <option value="spent">Most Spent</option>
          <option value="calls">Most Calls</option>
          <option value="coins">Highest Balance</option>
        </select>
        <button
          onClick={load}
          className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
        >
          Apply
        </button>
        <span className="text-xs text-gray-500 ml-auto">{users.length} users</span>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="py-8 text-center text-red-400">{error}</div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          keyField="id"
          compact
          maxHeight="calc(100vh - 250px)"
        />
      )}

      {/* ── Ledger Modal ──────────────────────── */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-auto p-6">
            {ledgerLoading ? (
              <LoadingSpinner label="Loading ledger…" />
            ) : ledger ? (
              <LedgerView ledger={ledger} onClose={closeLedger} />
            ) : null}
          </div>
        </div>
      )}

      {/* ── Coin Adjustment Modal ────────────── */}
      <ConfirmDialog
        open={!!adjustTarget}
        title="Adjust User Coins"
        message={`Adjust coins for ${adjustTarget?.username || adjustTarget?.email || 'User'}. Current balance: ${adjustTarget?.coins ?? 0}`}
        confirmLabel="Apply"
        confirmVariant="primary"
        onConfirm={handleAdjustCoins}
        onCancel={() => {
          setAdjustTarget(null);
          setAdjustAmount('');
          setAdjustReason('');
        }}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Amount (positive = credit, negative = debit)
            </label>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 50 or -20"
              className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Reason (required, min 5 chars)
            </label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Compensation for billing issue"
              className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
};

// ── Ledger Detail View ──────────────────────────────────────────────────

const LedgerView: React.FC<{ ledger: UserLedger; onClose: () => void }> = ({
  ledger,
  onClose,
}) => {
  const { user, creator, transactions, calls, chatQuotas, summary } = ledger;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            {user.username || user.email || user.phone || 'User'} — Full Ledger
          </h2>
          <p className="text-xs text-gray-500">
            ID: {user.id} · Firebase: {user.firebaseUid} · Role: {user.role}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm text-gray-400 hover:text-white border border-gray-600 rounded"
        >
          ✕ Close
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Total Credited</p>
          <p className="text-emerald-400 font-bold tabular-nums">
            {summary.totalCredited.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Total Debited</p>
          <p className="text-red-400 font-bold tabular-nums">
            {summary.totalDebited.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Expected Balance</p>
          <p className="text-white font-bold tabular-nums">
            {summary.expectedBalance.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Actual Balance</p>
          <p className="text-white font-bold tabular-nums">
            {summary.actualBalance.toLocaleString()}
          </p>
        </div>
        <div
          className={`bg-gray-900 border rounded px-3 py-2 ${
            summary.discrepancy !== 0
              ? 'border-red-800 bg-red-900/20'
              : 'border-emerald-800 bg-emerald-900/20'
          }`}
        >
          <p className="text-[10px] text-gray-500 uppercase">Discrepancy</p>
          <p
            className={`font-bold tabular-nums ${
              summary.discrepancy !== 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {summary.discrepancy}
          </p>
        </div>
      </div>

      {/* Creator info */}
      {creator && (
        <div className="mb-4 p-3 bg-blue-900/10 border border-blue-800 rounded text-xs text-blue-300">
          Also a creator: {creator.name} · Price: {creator.price}/min ·{' '}
          {creator.isOnline ? 'Online' : 'Offline'}
        </div>
      )}

      {/* Transactions table */}
      <h3 className="text-sm font-semibold text-gray-300 mb-2">
        Transactions ({transactions.length})
      </h3>
      <div className="overflow-auto max-h-64 border border-gray-800 rounded-lg mb-4">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-800">
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Type</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Coins</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Source</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Description</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Status</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {transactions.map((tx) => (
              <tr key={tx.id} className="bg-gray-900 hover:bg-gray-800/60">
                <td className="px-3 py-1.5">
                  <span
                    className={
                      tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                    }
                  >
                    {tx.type === 'credit' ? '+' : '−'}
                  </span>
                </td>
                <td className="px-3 py-1.5 tabular-nums font-medium">{tx.coins}</td>
                <td className="px-3 py-1.5 text-gray-400">{tx.source}</td>
                <td className="px-3 py-1.5 text-gray-400 max-w-xs truncate">
                  {tx.description}
                </td>
                <td className="px-3 py-1.5">
                  <StatusBadge
                    variant={tx.status === 'completed' ? 'success' : 'warning'}
                    label={tx.status}
                  />
                </td>
                <td className="px-3 py-1.5 text-gray-500">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calls table */}
      <h3 className="text-sm font-semibold text-gray-300 mb-2">
        Call History ({calls.length})
      </h3>
      <div className="overflow-auto max-h-48 border border-gray-800 rounded-lg mb-4">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-800">
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Other</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Role</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Duration</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Deducted</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Earned</th>
              <th className="px-3 py-2 text-left text-gray-400 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {calls.map((call, i) => (
              <tr key={i} className="bg-gray-900 hover:bg-gray-800/60">
                <td className="px-3 py-1.5 text-gray-300">{call.otherName}</td>
                <td className="px-3 py-1.5 text-gray-500">{call.ownerRole}</td>
                <td className="px-3 py-1.5 tabular-nums">{call.durationSeconds}s</td>
                <td className="px-3 py-1.5 tabular-nums text-red-400">
                  {call.coinsDeducted || '—'}
                </td>
                <td className="px-3 py-1.5 tabular-nums text-emerald-400">
                  {call.coinsEarned || '—'}
                </td>
                <td className="px-3 py-1.5 text-gray-500">
                  {new Date(call.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chat quotas */}
      {chatQuotas.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Chat Quotas ({chatQuotas.length})
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {chatQuotas.map((q, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-xs"
              >
                <p className="text-gray-400 truncate">{q.channelId}</p>
                <p className="text-gray-300">
                  Free: {q.freeMessagesSent} · Paid: {q.paidMessagesSent}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;
