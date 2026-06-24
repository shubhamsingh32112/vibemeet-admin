import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable, { type Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { adminService, type CreatorPerformance } from '../services/adminService';
import { creatorService } from '../services/creatorService';
import { userService, type User } from '../services/userService';
import CreatorEditModal from '../components/CreatorEditModal';

const CreatorsPage: React.FC = () => {
  const [creators, setCreators] = useState<CreatorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [presenceFilter, setPresenceFilter] = useState('');
  const [presenceCounts, setPresenceCounts] = useState<{
    online: number;
    on_call: number;
    offline: number;
    total: number;
  } | null>(null);

  // Modals
  const [resetPresenceTarget, setResetPresenceTarget] = useState<CreatorPerformance | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<CreatorPerformance | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<CreatorPerformance | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Promote flow
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getCreatorsPerformancePage({
        page,
        limit: 50,
        search: search || undefined,
        presenceStatus: presenceFilter || undefined,
      });
      setCreators(data.creators);
      setTotal(data.total);
      setPresenceCounts(data.presenceCounts ?? null);
      setTotalPages(Math.max(1, Math.ceil(data.total / data.limit)));
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, search, presenceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResetPresence = async () => {
    if (!resetPresenceTarget) return;
    try {
      const result = await adminService.resetCreatorPresence(resetPresenceTarget.creatorId);
      setResetPresenceTarget(null);
      load();
      alert(
        `Presence reset for ${resetPresenceTarget.name}. Status is now "${result.presenceStatus}" (toggle ${result.isOnline ? 'online' : 'offline'}).`
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset presence');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this host? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      await creatorService.delete(id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeactivate = async (row: CreatorPerformance) => {
    if (!confirm(`Deactivate ${row.name}? They will be hidden from the app but their profile remains.`)) return;
    try {
      await adminService.deactivateCreator(row.creatorId);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to deactivate');
    }
  };

  const handleReactivate = async (row: CreatorPerformance) => {
    if (!confirm(`Reactivate ${row.name}?`)) return;
    try {
      await adminService.reactivateCreator(row.creatorId);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reactivate');
    }
  };

  const handleAdjustCoins = async () => {
    if (!adjustTarget) return;
    const amount = parseInt(adjustAmount, 10);
    if (Number.isNaN(amount) || amount === 0) {
      alert('Enter a valid non-zero amount');
      return;
    }
    if (!adjustReason || adjustReason.trim().length < 5) {
      alert('Reason must be at least 5 characters');
      return;
    }
    try {
      setAdjusting(true);
      const result = await adminService.adjustUserCoins(
        adjustTarget.userId,
        amount,
        adjustReason.trim(),
      );
      setCreators((prev) =>
        prev.map((c) =>
          c.userId === adjustTarget.userId ? { ...c, coins: result.newBalance } : c,
        ),
      );
      alert(`Coins adjusted: ${result.oldBalance.toLocaleString()} → ${result.newBalance.toLocaleString()}`);
      setAdjustTarget(null);
      setAdjustAmount('');
      setAdjustReason('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to adjust coins');
    } finally {
      setAdjusting(false);
    }
  };

  const loadPromotableUsers = useCallback(async (query?: string) => {
    setSearching(true);
    setUserSearchError('');
    try {
      const users = await userService.search(query?.trim() || undefined, 'user');
      setSearchResults(users);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Search failed';
      setUserSearchError(message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchUsers = async () => {
    await loadPromotableUsers(searchQuery);
  };

  useEffect(() => {
    if (!showUserSearch || selectedUser) return;
    // On open, show all promotable users below the search bar.
    loadPromotableUsers();
  }, [showUserSearch, selectedUser, loadPromotableUsers]);

  const handlePromote = async () => {
    if (!selectedUser) return;
    await userService.promoteToCreator(selectedUser.id);
    setSelectedUser(null);
    setShowUserSearch(false);
    setShowPromoteConfirm(false);
    setSearchResults([]);
    setSearchQuery('');
    load();
  };

  const handleSelectUserForPromotion = (user: User) => {
    setSelectedUser(user);
    setShowUserSearch(false);
    setShowPromoteConfirm(true);
  };

  const columns: Column<CreatorPerformance>[] = [
    {
      key: 'name',
      header: 'Creator',
      width: '200px',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.avatarUrl || row.photo ? (
            <img
              src={row.avatarUrl || row.photo || ''}
              className="w-7 h-7 rounded-full object-cover"
              alt=""
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
              {row.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-white text-sm font-medium">{row.name}</p>
            <p className="text-[10px] text-gray-500">
              {row.username ? `@${row.username}` : '—'} · {row.email || row.phone || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'presenceStatus',
      header: 'Status',
      render: (row) => {
        if (row.isDisabled) {
          return <StatusBadge variant="offline" label="Deactivated" dot />;
        }
        const ps = row.presenceStatus ?? (row.isOnline ? 'online' : 'offline');
        const variant =
          ps === 'online' ? 'online' : ps === 'on_call' ? 'warning' : 'offline';
        const label =
          ps === 'on_call' ? 'On call' : ps === 'online' ? 'Online' : 'Offline';
        return <StatusBadge variant={variant} label={label} dot />;
      },
    },
    {
      key: 'onlineTodaySeconds',
      header: 'Online mins today',
      sortable: true,
      getValue: (row) => Math.floor((row.onlineTodaySeconds ?? 0) / 60),
      render: (row) => {
        const seconds = row.onlineTodaySeconds ?? 0;
        const minutes = Math.floor(seconds / 60);
        const remainder = seconds % 60;
        return (
          <span
            className="tabular-nums text-sky-300"
            title={
              remainder > 0
                ? `${minutes} min ${remainder} sec (available online; resets 23:59 server time)`
                : 'Available online time; resets 23:59 server time'
            }
          >
            {minutes}
          </span>
        );
      },
    },
    {
      key: 'price',
      header: 'Price/min',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.price}</span>,
    },
    {
      key: 'minutes30d',
      header: 'Mins (30d)',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.minutes30d}</span>,
    },
    {
      key: 'totalCalls',
      header: 'Total Calls',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.totalCalls}</span>,
    },
    {
      key: 'totalEarned',
      header: 'Total Earned',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-emerald-400">
          {row.totalEarned.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'coins',
      header: 'Balance',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.coins.toLocaleString()}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '200px',
      render: (row) => (
        <div className="flex items-center gap-1 flex-wrap">
          <Link
            to={`/hosts/all/${row.creatorId}`}
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 text-xs bg-emerald-900/30 border border-emerald-800 rounded text-emerald-300 hover:text-emerald-100 transition min-h-[36px] inline-flex items-center"
          >
            View
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAdjustTarget(row);
              setAdjustAmount('');
              setAdjustReason('');
            }}
            className="px-2 py-1 text-xs bg-amber-900/30 border border-amber-700 rounded text-amber-300 hover:text-amber-100 transition min-h-[36px]"
            title="Add or deduct coins (audited)"
          >
            Coins
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingRow(row);
            }}
            className="px-2 py-1 text-xs bg-violet-900/30 border border-violet-700 rounded text-violet-300 hover:text-violet-100 transition min-h-[36px]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setResetPresenceTarget(row);
            }}
            className="px-2 py-1 text-xs bg-sky-900/30 border border-sky-800 rounded text-sky-300 hover:text-sky-100 transition min-h-[36px]"
            title="Clear stuck on-call state and refresh online/offline from their toggle"
          >
            Reset presence
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (row.isDisabled) void handleReactivate(row);
              else void handleDeactivate(row);
            }}
            className={`px-2 py-1 text-xs border rounded transition min-h-[36px] ${
              row.isDisabled
                ? 'bg-emerald-900/30 border-emerald-800 text-emerald-300'
                : 'bg-orange-900/30 border-orange-800 text-orange-300'
            }`}
          >
            {row.isDisabled ? 'Reactivate' : 'Deactivate'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.creatorId); }}
            disabled={deletingId === row.creatorId}
            className="px-2 py-1 text-xs bg-red-900/30 border border-red-800 rounded text-red-400 hover:text-red-200 transition disabled:opacity-50"
          >
            Del
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner label="Loading creator performance…" />;
  if (error)
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-4 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700">Retry</button>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">All hosts</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {total.toLocaleString()} hosts · live status from Redis
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowUserSearch(true);
              setSearchQuery('');
              setUserSearchError('');
              setSelectedUser(null);
              setShowPromoteConfirm(false);
            }}
            className="px-3 py-1.5 text-xs bg-emerald-900/30 border border-emerald-700 rounded text-emerald-300 hover:text-emerald-100 transition"
          >
            + Promote to host
          </button>
          <button
            type="button"
            onClick={load}
            className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition"
          >
            ↻
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-admin-surface border border-admin-border text-sm text-white min-w-[200px]"
        />
        <select
          value={presenceFilter}
          onChange={(e) => {
            setPresenceFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-admin-surface border border-admin-border text-sm text-white"
        >
          <option value="">All presence</option>
          <option value="online">Online</option>
          <option value="on_call">On call</option>
          <option value="offline">Offline</option>
        </select>
      </div>
      {/* Live presence (platform-wide from Redis) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Total hosts</p>
          <p className="text-lg font-bold text-white">{presenceCounts?.total ?? total}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Online</p>
          <p className="text-lg font-bold text-emerald-400">{presenceCounts?.online ?? '—'}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">On call</p>
          <p className="text-lg font-bold text-amber-400">{presenceCounts?.on_call ?? '—'}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Offline</p>
          <p className="text-lg font-bold text-zinc-400">{presenceCounts?.offline ?? '—'}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={creators}
        keyField="creatorId"
        compact
        stackedOnMobile
      />

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-4">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-white/10 text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-zinc-400 self-center">Page {page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-white/10 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* ── Reset Presence Confirm ─────────────── */}
      <ConfirmDialog
        open={!!resetPresenceTarget}
        title="Reset creator presence"
        message={`Clear stuck "On call" state for ${resetPresenceTarget?.name} and broadcast the correct status from their availability toggle (they stay ${resetPresenceTarget?.isOnline ? 'available' : 'offline'} in the app).`}
        confirmLabel="Reset presence"
        confirmVariant="primary"
        onConfirm={handleResetPresence}
        onCancel={() => setResetPresenceTarget(null)}
      />

      {/* ── User Search for Promote ────────────── */}
      {showUserSearch && !selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Search User to Promote</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search by name, email, phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleSearchUsers}
                disabled={searching}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
              >
                {searching ? '…' : 'Search'}
              </button>
            </div>
            {userSearchError && (
              <p className="text-xs text-red-400 mb-3">{userSearchError}</p>
            )}
            <div className="max-h-64 overflow-auto space-y-1">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 bg-gray-900 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    if (user.isCreator || user.role === 'creator') return;
                    handleSelectUserForPromotion(user);
                  }}
                >
                  <div>
                    <p className="text-sm text-white">{user.username || 'No username'}</p>
                    <p className="text-xs text-gray-500">{user.email || user.phone}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {user.isCreator || user.role === 'creator' ? 'already creator' : user.role}
                  </span>
                </div>
              ))}
              {searchResults.length === 0 && !searching && !userSearchError && (
                <p className="text-sm text-gray-500 text-center py-4">No users found</p>
              )}
            </div>
            <button
              onClick={() => {
                setShowUserSearch(false);
                setSearchResults([]);
                setSearchQuery('');
                setUserSearchError('');
              }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showPromoteConfirm && !!selectedUser}
        title="Promote to host?"
        message={
          selectedUser
            ? `Create a starter host profile for ${selectedUser.username || selectedUser.email || selectedUser.phone || 'this user'}. They complete display name, about, photo, and categories in the app. Default per-minute pricing applies.`
            : ''
        }
        confirmLabel={promoting ? 'Promoting…' : 'Promote to host'}
        confirmVariant="primary"
        confirmDisabled={promoting}
        onCancel={() => {
          if (promoting) return;
          setShowPromoteConfirm(false);
          setSelectedUser(null);
        }}
        onConfirm={async () => {
          try {
            setPromoting(true);
            await handlePromote();
          } catch (err: unknown) {
            const e = err as { response?: { data?: { error?: string } }; message?: string };
            alert(e.response?.data?.error || e.message || 'Failed to promote user');
          } finally {
            setPromoting(false);
          }
        }}
      />

      {editingRow && (
        <CreatorEditModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSaved={() => load()}
        />
      )}

      <ConfirmDialog
        open={!!adjustTarget}
        title="Adjust host coins"
        message={`Adjust coins for ${adjustTarget?.name || 'host'}. Current balance: ${(adjustTarget?.coins ?? 0).toLocaleString()}`}
        confirmLabel={adjusting ? 'Applying…' : 'Apply'}
        confirmVariant="primary"
        confirmDisabled={adjusting}
        onConfirm={handleAdjustCoins}
        onCancel={() => {
          if (adjusting) return;
          setAdjustTarget(null);
          setAdjustAmount('');
          setAdjustReason('');
        }}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Amount (positive = add coins, negative = deduct)
            </label>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
              placeholder="e.g. Bonus for top performer"
              className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </ConfirmDialog>

    </div>
  );
};

export default CreatorsPage;
