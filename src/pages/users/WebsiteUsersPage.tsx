import React, { useEffect, useRef, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import {
  adminService,
  type AttributionCoverageMeta,
  type WebsiteAudienceCategory,
  type WebsiteUser,
} from '../../services/adminService';
import { useAdminDateRange } from '../../hooks/useAdminDateRange';
import { adminDateRangeQueryParams } from '../../utils/dateRange';
import { formatDateTime } from '../../utils/dateTime';

type Audience = WebsiteAudienceCategory | 'all';

const audienceLabels: Record<Audience, string> = {
  created_on_website: 'Created on website',
  preexisting_then_website: 'Pre-existing, then website',
  all: 'All website users',
};

function adminErrorMessage(error: unknown): string {
  const candidate = error as { response?: { data?: { error?: string } }; message?: string };
  return candidate.response?.data?.error || candidate.message || 'Failed to load website users';
}

const WebsiteUsersPage: React.FC = () => {
  const [users, setUsers] = useState<WebsiteUser[]>([]);
  const [audience, setAudience] = useState<Audience>('created_on_website');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'website_since' | 'last_website_login'>('website_since');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [meta, setMeta] = useState<AttributionCoverageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const rangeKeyRef = useRef('');
  const { dateRange } = useAdminDateRange('today');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rangeKey = `${dateRange.preset}:${dateRange.from ?? ''}:${dateRange.to ?? ''}`;
      const pageForRequest =
        rangeKeyRef.current && rangeKeyRef.current !== rangeKey ? 1 : page;
      rangeKeyRef.current = rangeKey;
      if (pageForRequest !== page) setPage(pageForRequest);
      const id = ++requestId.current;
      setLoading(true);
      setError('');
      void adminService
        .getWebsiteUsers({
          audience,
          query: search || undefined,
          sort,
          direction: 'desc',
          ...adminDateRangeQueryParams(dateRange),
          page: pageForRequest,
          limit: 50,
        })
        .then((data) => {
          if (id !== requestId.current) return;
          setUsers(data.users);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          setMeta(data.meta);
        })
        .catch((err: unknown) => {
          if (id !== requestId.current) return;
          setError(adminErrorMessage(err));
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [audience, search, sort, page, dateRange]);

  const columns: Column<WebsiteUser>[] = [
    {
      key: 'username',
      header: 'User',
      width: '220px',
      render: (row) => (
        <div>
          <p className="text-sm text-white">{row.username || 'No username'}</p>
          <p className="text-[11px] text-zinc-500">{row.email || row.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'websiteAudienceCategory',
      header: 'Website category',
      render: (row) => audienceLabels[row.websiteAudienceCategory],
    },
    {
      key: 'websiteAudienceSince',
      header: 'Website since',
      render: (row) => formatDateTime(row.websiteAudienceSince),
    },
    {
      key: 'accountCreatedAt',
      header: 'Account created',
      render: (row) => formatDateTime(row.accountCreatedAt),
    },
    {
      key: 'lastWebsiteLoginAt',
      header: 'Last website login',
      render: (row) => row.lastWebsiteLoginAt ? formatDateTime(row.lastWebsiteLoginAt) : '—',
    },
    {
      key: 'coins',
      header: 'Balance',
      render: (row) => row.coins.toLocaleString(),
    },
  ];

  return (
    <div>
      <SectionHeading title="Website Users" helpKey="users.website.page" level={1} />
      <p className="mt-1 text-xs text-zinc-500">
        Forward-only analytics claims from website auth synchronization; these fields are not
        security assertions.
      </p>
      {meta && (
        <p className="mt-1 text-xs text-amber-300/80">
          Website attribution available from {formatDateTime(meta.trackingStart)}. Earlier
          website activity cannot be reconstructed reliably.
        </p>
      )}

      <div className="my-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search name / email / phone"
          className="w-64 rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
        />
        <select
          value={audience}
          onChange={(event) => {
            setAudience(event.target.value as Audience);
            setPage(1);
          }}
          className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
        >
          {Object.entries(audienceLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as typeof sort);
            setPage(1);
          }}
          className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
        >
          <option value="website_since">Sort: Website since</option>
          <option value="last_website_login">Sort: Last website login</option>
        </select>
        <span className="ml-auto text-xs text-zinc-500">{total.toLocaleString()} users</span>
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <div className="py-8 text-center text-red-400">{error}</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            keyField="id"
            compact
            stackedOnMobile
            emptyMessage="No attributed website users in this range"
            maxHeight="calc(100vh - 285px)"
          />
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border border-white/10 px-3 py-1 text-sm disabled:opacity-40">Previous</button>
              <span className="self-center text-sm text-zinc-400">Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border border-white/10 px-3 py-1 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WebsiteUsersPage;
