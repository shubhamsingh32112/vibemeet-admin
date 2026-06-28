import React, { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  adminService,
  type MomentsBrowseRow,
  type MomentsFreePreviewRow,
} from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const MomentsFreePreviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [listVersion, setListVersion] = useState(0);
  const [previews, setPreviews] = useState<MomentsFreePreviewRow[]>([]);
  const [limit, setLimit] = useState(12);
  const [browseQ, setBrowseQ] = useState('');
  const [browseHasPreview, setBrowseHasPreview] = useState<'yes' | 'no' | ''>('');
  const [browseVisibility, setBrowseVisibility] = useState<'PUBLIC' | 'VIP' | ''>('');
  const [browseItems, setBrowseItems] = useState<MomentsBrowseRow[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  const loadPreviews = useCallback(async () => {
    setLoading(true);
    setMsg('');
    try {
      const [config, data] = await Promise.all([
        adminService.getMomentsAdminConfig(),
        adminService.getMomentsFreePreviews(),
      ]);
      setLimit(config.freePreviewLimit);
      setPreviews(data.items);
      setListVersion(data.listVersion);
    } catch {
      setMsg('Failed to load preview list.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBrowse = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const data = await adminService.browseMomentsForAdmin({
        q: browseQ.trim() || undefined,
        hasPreview: browseHasPreview || undefined,
        visibilityTier: browseVisibility || undefined,
        limit: 30,
      });
      setBrowseItems(data.items);
    } finally {
      setBrowseLoading(false);
    }
  }, [browseQ, browseHasPreview, browseVisibility]);

  useEffect(() => {
    void loadPreviews();
  }, [loadPreviews]);

  useEffect(() => {
    void loadBrowse();
  }, [loadBrowse]);

  const saveOrder = async (ordered: MomentsFreePreviewRow[]) => {
    setSaving(true);
    setMsg('');
    try {
      const result = await adminService.reorderMomentsFreePreviews({
        orderedMomentIds: ordered.map((r) => r.momentId),
        expectedVersion: listVersion,
      });
      setListVersion(result.listVersion);
      setPreviews(ordered.map((r, i) => ({ ...r, order: i })));
      setMsg('Preview order saved.');
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 409) {
        setMsg('Another admin updated the list. Refreshing…');
        await loadPreviews();
      } else {
        setMsg('Failed to save order.');
      }
    } finally {
      setSaving(false);
    }
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const next = [...previews];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    void saveOrder(next);
  };

  const addPreview = async (momentId: string) => {
    if (previews.length >= limit) {
      setMsg(`Preview limit of ${limit} reached.`);
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const result = await adminService.addMomentsFreePreview({ momentId });
      setListVersion(result.listVersion);
      await loadPreviews();
      setMsg('Added to free previews.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMsg(err.response?.data?.error ?? 'Failed to add preview.');
    } finally {
      setSaving(false);
    }
  };

  const removePreview = async (momentId: string) => {
    setSaving(true);
    setMsg('');
    try {
      const result = await adminService.removeMomentsFreePreview(momentId);
      setListVersion(result.listVersion);
      await loadPreviews();
      setMsg('Removed from free previews.');
    } catch {
      setMsg('Failed to remove preview.');
    } finally {
      setSaving(false);
    }
  };

  const setVisibility = async (momentId: string, visibilityTier: 'PUBLIC' | 'VIP') => {
    setSaving(true);
    setMsg('');
    try {
      await adminService.patchMomentVisibilityTier(momentId, visibilityTier);
      await loadBrowse();
      await loadPreviews();
      setMsg(`Visibility set to ${visibilityTier}.`);
    } catch {
      setMsg('Failed to update visibility.');
    } finally {
      setSaving(false);
    }
  };

  const previewColumns: Column<MomentsFreePreviewRow>[] = [
    {
      key: 'thumb',
      header: '',
      render: (row) =>
        row.thumbnailUrl ? (
          <img src={row.thumbnailUrl} alt="" className="h-12 w-12 rounded object-cover" />
        ) : (
          <div className="h-12 w-12 rounded bg-muted" />
        ),
    },
    { key: 'creator', header: 'Creator', render: (r) => r.creator.name },
    { key: 'type', header: 'Type', render: (r) => r.type },
    {
      key: 'caption',
      header: 'Caption',
      render: (r) => (r.caption ? r.caption.slice(0, 60) : '—'),
    },
    {
      key: 'createdAt',
      header: 'Uploaded',
      render: (r) => formatDateTime(r.createdAt),
    },
    { key: 'views', header: 'Views', render: (r) => r.viewsCount },
    {
      key: 'processing',
      header: 'Processing',
      render: (r) => <StatusBadge label={r.processingStatus} variant="neutral" />,
    },
    {
      key: 'moderation',
      header: 'Moderation',
      render: (r) => <StatusBadge label={r.moderationStatus} variant="success" />,
    },
    {
      key: 'visibility',
      header: 'Visibility',
      render: (r) => (
        <select
          className="rounded border px-2 py-1 text-xs"
          value={r.visibilityTier ?? 'PUBLIC'}
          disabled={saving}
          onChange={(e) =>
            void setVisibility(r.momentId, e.target.value as 'PUBLIC' | 'VIP')
          }
        >
          <option value="PUBLIC">PUBLIC</option>
          <option value="VIP">VIP</option>
        </select>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (r) => {
        const idx = previews.findIndex((p) => p.momentId === r.momentId);
        return (
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              disabled={saving || idx <= 0}
              onClick={() => moveRow(idx, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              disabled={saving || idx < 0 || idx >= previews.length - 1}
              onClick={() => moveRow(idx, 1)}
            >
              ↓
            </button>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          className="text-sm text-red-600"
          disabled={saving}
          onClick={() => void removePreview(r.momentId)}
        >
          Remove
        </button>
      ),
    },
  ];

  const browseColumns: Column<MomentsBrowseRow>[] = [
    {
      key: 'thumb',
      header: '',
      render: (row) =>
        row.thumbnailUrl ? (
          <img src={row.thumbnailUrl} alt="" className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="h-10 w-10 rounded bg-muted" />
        ),
    },
    { key: 'creator', header: 'Creator', render: (r) => r.creator.name },
    { key: 'type', header: 'Type', render: (r) => r.type },
    {
      key: 'caption',
      header: 'Caption',
      render: (r) => (r.caption ? r.caption.slice(0, 50) : '—'),
    },
    { key: 'views', header: 'Views', render: (r) => r.viewsCount },
    {
      key: 'visibility',
      header: 'Visibility',
      render: (r) => (
        <select
          className="rounded border px-2 py-1 text-xs"
          value={r.visibilityTier ?? 'PUBLIC'}
          disabled={saving}
          onChange={(e) =>
            void setVisibility(r.momentId, e.target.value as 'PUBLIC' | 'VIP')
          }
        >
          <option value="PUBLIC">PUBLIC</option>
          <option value="VIP">VIP</option>
        </select>
      ),
    },
    {
      key: 'add',
      header: '',
      render: (r) => {
        const already = previews.some((p) => p.momentId === r.momentId);
        return (
          <button
            type="button"
            className="text-sm text-primary"
            disabled={saving || already || previews.length >= limit}
            onClick={() => void addPreview(r.momentId)}
          >
            {already ? 'Added' : 'Add to preview'}
          </button>
        );
      },
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Moments free previews</h1>
        <p className="text-muted-foreground text-sm">
          Curate moments shown unlocked to non-premium users ({previews.length} / {limit}).
        </p>
        {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Current previews (editorial order)</h2>
        <DataTable columns={previewColumns} data={previews} keyField="momentId" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Add moments</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Search caption…"
            value={browseQ}
            onChange={(e) => setBrowseQ(e.target.value)}
          />
          <select
            className="rounded border px-3 py-2 text-sm"
            value={browseHasPreview}
            onChange={(e) => setBrowseHasPreview(e.target.value as 'yes' | 'no' | '')}
          >
            <option value="">Has preview: any</option>
            <option value="no">Not in preview</option>
            <option value="yes">Already in preview</option>
          </select>
          <select
            className="rounded border px-3 py-2 text-sm"
            value={browseVisibility}
            onChange={(e) => setBrowseVisibility(e.target.value as 'PUBLIC' | 'VIP' | '')}
          >
            <option value="">Visibility: all</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="VIP">VIP</option>
          </select>
          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => void loadBrowse()}
          >
            Search
          </button>
        </div>
        {browseLoading ? (
          <LoadingSpinner />
        ) : (
          <DataTable columns={browseColumns} data={browseItems} keyField="momentId" />
        )}
      </section>
    </div>
  );
};

export default MomentsFreePreviewPage;
