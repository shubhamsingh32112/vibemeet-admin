import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { type Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import MetricCard from '../components/ui/MetricCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  adminService,
  type AdminSupportTicket,
  type SupportSummary,
} from '../services/adminService';

const statusVariant = (s: string) => {
  switch (s) {
    case 'open': return 'info' as const;
    case 'in_progress': return 'warning' as const;
    case 'resolved': return 'success' as const;
    case 'closed': return 'neutral' as const;
    default: return 'neutral' as const;
  }
};

const priorityVariant = (p: string) => {
  switch (p) {
    case 'low': return 'neutral' as const;
    case 'medium': return 'info' as const;
    case 'high': return 'warning' as const;
    case 'urgent': return 'danger' as const;
    default: return 'neutral' as const;
  }
};

const SupportPage: React.FC = () => {
  type QuickTab = 'all' | 'creator_reports';
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [summary, setSummary] = useState<SupportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [quickTab, setQuickTab] = useState<QuickTab>('all');

  // Status update modal
  const [statusTarget, setStatusTarget] = useState<AdminSupportTicket | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Detail view
  const [detailTicket, setDetailTicket] = useState<AdminSupportTicket | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getSupportTickets({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        source: sourceFilter || undefined,
        creatorReportsOnly: quickTab === 'creator_reports',
        page,
        limit: 50,
      });
      setTickets(data.tickets);
      setSummary(data.summary);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, priorityFilter, sourceFilter, quickTab]);

  useEffect(() => {
    load();
  }, [load]);

  const openStatusModal = (ticket: AdminSupportTicket) => {
    setStatusTarget(ticket);
    setNewStatus(ticket.status);
    setAdminNotes('');
  };

  const handleStatusUpdate = async () => {
    if (!statusTarget) return;
    setActionLoading(true);
    try {
      await adminService.updateTicketStatus(statusTarget.id, newStatus, adminNotes || undefined);
      alert(`Ticket status updated to ${newStatus}.`);
      setStatusTarget(null);
      load();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<AdminSupportTicket>[] = [
    {
      key: 'role',
      header: 'Type',
      sortable: true,
      render: (row) => (
        <StatusBadge
          variant={row.role === 'creator' ? 'info' : 'neutral'}
          label={row.role === 'creator' ? 'Creator' : 'User'}
        />
      ),
    },
    {
      key: 'username',
      header: 'User',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-white font-medium text-sm">{row.username}</p>
          <p className="text-gray-500 text-xs">{row.email || row.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-300 capitalize">{row.category}</span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (
        <span
          className="text-sm text-gray-200 max-w-[250px] truncate block cursor-pointer hover:text-white"
          title={row.subject}
          onClick={(e) => { e.stopPropagation(); setDetailTicket(row); }}
        >
          {row.subject}
        </span>
      ),
    },
    {
      key: 'reportedCreatorName',
      header: 'Reported Creator',
      render: (row) => (
        <span className="text-xs text-rose-300">
          {row.reportedCreatorName || '—'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (row) => (
        <StatusBadge variant={priorityVariant(row.priority)} label={row.priority.toUpperCase()} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <StatusBadge
          variant={statusVariant(row.status)}
          label={row.status.replace('_', ' ').toUpperCase()}
          dot
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-xs tabular-nums">{new Date(row.createdAt).toLocaleString()}</span>
      ),
    },
    {
      key: 'assignedAdminId',
      header: 'Assigned',
      render: (row) => row.assignedAdminId ? (
        <span className="text-xs text-blue-300">Admin</span>
      ) : (
        <span className="text-gray-600 text-xs">Unassigned</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); openStatusModal(row); }}
            className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition"
          >
            Update
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDetailTicket(row); }}
            className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition"
          >
            View
          </button>
        </div>
      ),
    },
  ];

  if (loading && tickets.length === 0) return <LoadingSpinner label="Loading support tickets…" />;
  if (error)
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-4 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700">
          Retry
        </button>
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🛟 Support Tickets</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage user and creator support requests
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition disabled:opacity-50"
        >
          {loading ? '…' : '↻ Refresh'}
        </button>
      </div>

      {/* Quick Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setQuickTab('all'); setPage(1); }}
          className={`px-3 py-1.5 text-xs rounded border transition ${
            quickTab === 'all'
              ? 'bg-blue-900/40 border-blue-700 text-blue-200'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          All Tickets
        </button>
        <button
          onClick={() => { setQuickTab('creator_reports'); setPage(1); }}
          className={`px-3 py-1.5 text-xs rounded border transition ${
            quickTab === 'creator_reports'
              ? 'bg-rose-900/40 border-rose-700 text-rose-200'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          Creator Reports
        </button>
      </div>

      {/* Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <MetricCard
            label="User Tickets"
            value={summary.openUserTickets}
            subtitle="open"
            variant="info"
          />
          <MetricCard
            label="Creator Tickets"
            value={summary.openCreatorTickets}
            subtitle="open"
            variant="info"
          />
          <MetricCard
            label="High Priority"
            value={summary.highPriorityOpen}
            variant={summary.highPriorityOpen > 0 ? 'danger' : 'default'}
          />
          <MetricCard
            label="Unassigned"
            value={summary.unassigned}
            variant={summary.unassigned > 0 ? 'warning' : 'default'}
          />
          <MetricCard
            label="Aging > 24h"
            value={summary.agingOver24h}
            variant={summary.agingOver24h > 0 ? 'warning' : 'default'}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="user">User</option>
            <option value="creator">Creator</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Source:</label>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="chat">Chat</option>
            <option value="post_call">Post-call</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={tickets}
        keyField="id"
        emptyMessage="No support tickets found"
        searchPlaceholder="Search by name, email, subject…"
        searchFields={['username', 'email', 'subject', 'category']}
        compact
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">{total} total tickets</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-400 self-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Status Update Dialog */}
      <ConfirmDialog
        open={!!statusTarget}
        title="Update Ticket Status"
        message={statusTarget ? `Update status for "${statusTarget.subject}"` : ''}
        confirmLabel="Update"
        confirmVariant="primary"
        confirmDisabled={actionLoading || newStatus === statusTarget?.status}
        onConfirm={handleStatusUpdate}
        onCancel={() => { setStatusTarget(null); }}
      >
        <div className="space-y-3">
          {statusTarget && (
            <div className="text-xs space-y-1">
              <p className="text-gray-400">User: <span className="text-white">{statusTarget.username}</span></p>
              <p className="text-gray-400">Category: <span className="text-white">{statusTarget.category}</span></p>
              <p className="text-gray-400">Current Status: <StatusBadge variant={statusVariant(statusTarget.status)} label={statusTarget.status.replace('_', ' ').toUpperCase()} /></p>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 block mb-1">New Status:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Admin notes (optional)…"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
          />
        </div>
      </ConfirmDialog>

      {/* Detail View Dialog */}
      {detailTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-white pr-4">{detailTicket.subject}</h3>
              <button
                onClick={() => setDetailTicket(null)}
                className="text-gray-400 hover:text-white text-lg flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <StatusBadge variant={statusVariant(detailTicket.status)} label={detailTicket.status.replace('_', ' ').toUpperCase()} dot />
                <StatusBadge variant={priorityVariant(detailTicket.priority)} label={detailTicket.priority.toUpperCase()} />
                <StatusBadge variant={detailTicket.role === 'creator' ? 'info' : 'neutral'} label={detailTicket.role === 'creator' ? 'Creator' : 'User'} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">User</p>
                  <p className="text-white">{detailTicket.username}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-white">{detailTicket.email || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="text-white">{detailTicket.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-white">{new Date(detailTicket.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Source</p>
                  <p className="text-white">{detailTicket.source || 'other'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reported Creator</p>
                  <p className="text-white">{detailTicket.reportedCreatorName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Call ID</p>
                  <p className="text-white font-mono text-[11px]">{detailTicket.relatedCallId || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Message</p>
                <div className="bg-gray-900 border border-gray-700 rounded p-3 text-gray-300 text-sm whitespace-pre-wrap">
                  {detailTicket.message}
                </div>
              </div>

              {detailTicket.adminNotes && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Admin Notes</p>
                  <div className="bg-gray-900 border border-gray-700 rounded p-3 text-gray-400 text-sm whitespace-pre-wrap">
                    {detailTicket.adminNotes}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setDetailTicket(null); openStatusModal(detailTicket); }}
                  className="px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded transition"
                >
                  Update Status
                </button>
                <button
                  onClick={() => setDetailTicket(null)}
                  className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
