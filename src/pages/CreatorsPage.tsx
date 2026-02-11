import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { type Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { adminService, type CreatorPerformance } from '../services/adminService';
import { creatorService } from '../services/creatorService';
import { userService, type PromoteToCreatorDto } from '../services/userService';
import CreatorForm from '../components/CreatorForm';
import type { CreateCreatorDto } from '../types/creator';

const CreatorsPage: React.FC = () => {
  const [creators, setCreators] = useState<CreatorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [forceOfflineTarget, setForceOfflineTarget] = useState<CreatorPerformance | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Creator management
  const [showForm, setShowForm] = useState(false);
  const [editingCreator, setEditingCreator] = useState<any>(null);

  // Promote flow
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getCreatorsPerformance();
      setCreators(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleForceOffline = async () => {
    if (!forceOfflineTarget) return;
    try {
      await adminService.forceCreatorOffline(forceOfflineTarget.creatorId);
      setForceOfflineTarget(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to force offline');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this creator?')) return;
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

  const handleEdit = (creator: CreatorPerformance) => {
    setEditingCreator({
      id: creator.creatorId,
      name: creator.name,
      about: '',
      photo: creator.photo,
      categories: creator.categories,
      price: creator.price,
      userId: creator.userId,
    });
    setShowForm(true);
  };

  const handleCreate = async (data: CreateCreatorDto) => {
    await creatorService.create(data);
    setShowForm(false);
    load();
  };

  const handleUpdate = async (data: Partial<CreateCreatorDto>) => {
    if (editingCreator) {
      await creatorService.update(editingCreator.id, data);
      setShowForm(false);
      setEditingCreator(null);
      load();
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const users = await userService.search(searchQuery, 'user');
      setSearchResults(users);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handlePromote = async (data: PromoteToCreatorDto) => {
    if (!selectedUser) return;
    await userService.promoteToCreator(selectedUser.id, data);
    setSelectedUser(null);
    setShowUserSearch(false);
    setShowForm(false);
    setSearchResults([]);
    setSearchQuery('');
    load();
  };

  const columns: Column<CreatorPerformance>[] = [
    {
      key: 'name',
      header: 'Creator',
      width: '200px',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.photo ? (
            <img src={row.photo} className="w-7 h-7 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
              {row.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-white text-sm font-medium">{row.name}</p>
            <p className="text-[10px] text-gray-500">{row.email || row.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'isOnline',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          variant={row.isOnline ? 'online' : 'offline'}
          label={row.isOnline ? 'Online' : 'Offline'}
          dot
        />
      ),
    },
    {
      key: 'price',
      header: 'Price/min',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.price}</span>,
    },
    {
      key: 'calls30d',
      header: 'Calls (30d)',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.calls30d}</span>,
    },
    {
      key: 'minutes30d',
      header: 'Mins (30d)',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.minutes30d}</span>,
    },
    {
      key: 'earned30d',
      header: 'Earned (30d)',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-emerald-400 font-medium">
          {row.earned30d.toLocaleString()}
        </span>
      ),
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
      key: 'avgCallDurationSec',
      header: 'Avg Duration',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums">
          {row.avgCallDurationSec >= 60
            ? `${Math.floor(row.avgCallDurationSec / 60)}m ${Math.round(row.avgCallDurationSec % 60)}s`
            : `${Math.round(row.avgCallDurationSec)}s`}
        </span>
      ),
    },
    {
      key: 'earningsPerMinute',
      header: 'Earn/min',
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.earningsPerMinute}</span>,
    },
    {
      key: 'abuseSignals',
      header: 'Abuse',
      width: '160px',
      render: (row) => {
        const s = row.abuseSignals;
        if (!s) return <span className="text-gray-600">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {s.isFlagged && (
              <StatusBadge variant="danger" label="Flagged" />
            )}
            <span className="text-[10px] tabular-nums text-gray-400" title="Short call % / Refunds / 0-dur">
              {s.shortCallPct}% short
              {s.refundCount > 0 && <span className="text-yellow-400 ml-1">· {s.refundCount} refund{s.refundCount !== 1 ? 's' : ''}</span>}
              {s.zeroDuration30d > 0 && <span className="text-red-400 ml-1">· {s.zeroDuration30d} 0dur</span>}
            </span>
            {s.earnDeviation !== 0 && (
              <span className={`text-[10px] tabular-nums ${Math.abs(s.earnDeviation) > 20 ? 'text-yellow-400' : 'text-gray-500'}`}>
                earn dev: {s.earnDeviation > 0 ? '+' : ''}{s.earnDeviation}%
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'tasks',
      header: 'Tasks',
      render: (row) => (
        <span className="text-xs tabular-nums">
          {row.tasksClaimed}/{row.tasksCompleted}/{row.tasksTotal}
          <span className="text-gray-500 ml-1">c/d/t</span>
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
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition"
          >
            Edit
          </button>
          {row.isOnline && (
            <button
              onClick={(e) => { e.stopPropagation(); setForceOfflineTarget(row); }}
              className="px-2 py-1 text-xs bg-yellow-900/30 border border-yellow-800 rounded text-yellow-400 hover:text-yellow-200 transition"
            >
              Offline
            </button>
          )}
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Creators Performance</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowUserSearch(true); }}
            className="px-3 py-1.5 text-xs bg-emerald-900/30 border border-emerald-700 rounded text-emerald-300 hover:text-emerald-100 transition"
          >
            + Promote User
          </button>
          <button
            onClick={() => { setEditingCreator(null); setShowForm(true); }}
            className="px-3 py-1.5 text-xs bg-blue-900/30 border border-blue-700 rounded text-blue-300 hover:text-blue-100 transition"
          >
            + Create Creator
          </button>
          <button
            onClick={load}
            className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white transition"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Total</p>
          <p className="text-lg font-bold text-white">{creators.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Online</p>
          <p className="text-lg font-bold text-emerald-400">
            {creators.filter((c) => c.isOnline).length}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Avg Earned (30d)</p>
          <p className="text-lg font-bold text-white">
            {creators.length > 0
              ? Math.round(creators.reduce((s, c) => s + c.earned30d, 0) / creators.length)
              : 0}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Zero-call creators</p>
          <p className="text-lg font-bold text-yellow-400">
            {creators.filter((c) => c.totalCalls === 0).length}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Flagged</p>
          <p className="text-lg font-bold text-red-400">
            {creators.filter((c) => c.abuseSignals?.isFlagged).length}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={creators}
        keyField="creatorId"
        searchFields={['name', 'email', 'phone'] as any}
        searchPlaceholder="Search creators…"
        compact
      />

      {/* ── Force Offline Confirm ──────────────── */}
      <ConfirmDialog
        open={!!forceOfflineTarget}
        title="Force Creator Offline"
        message={`This will set ${forceOfflineTarget?.name} as offline and broadcast the change to all connected clients.`}
        confirmLabel="Force Offline"
        confirmVariant="danger"
        onConfirm={handleForceOffline}
        onCancel={() => setForceOfflineTarget(null)}
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
            <div className="max-h-64 overflow-auto space-y-1">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 bg-gray-900 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={() => { setSelectedUser(user); setShowForm(true); }}
                >
                  <div>
                    <p className="text-sm text-white">{user.username || 'No username'}</p>
                    <p className="text-xs text-gray-500">{user.email || user.phone}</p>
                  </div>
                  <span className="text-xs text-gray-500">{user.role}</span>
                </div>
              ))}
              {searchResults.length === 0 && !searching && searchQuery && (
                <p className="text-sm text-gray-500 text-center py-4">No results</p>
              )}
            </div>
            <button
              onClick={() => { setShowUserSearch(false); setSearchResults([]); setSearchQuery(''); }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Creator Form (Create/Edit/Promote) ──── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg mx-4 my-8 p-6">
            <CreatorForm
              onSubmit={selectedUser ? handlePromote as any : editingCreator ? handleUpdate as any : handleCreate as any}
              onCancel={() => {
                setShowForm(false);
                setEditingCreator(null);
                setSelectedUser(null);
              }}
              initialData={editingCreator || undefined}
              isEditing={!!editingCreator}
              selectedUserId={selectedUser?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorsPage;
