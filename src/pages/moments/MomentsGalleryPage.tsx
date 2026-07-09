import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  adminService,
  type MomentsGalleryRow,
} from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const MomentsGalleryPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deductCoinsOnDelete, setDeductCoinsOnDelete] = useState(false);
  const [msg, setMsg] = useState('');
  const [items, setItems] = useState<MomentsGalleryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [searchQ, setSearchQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<'photo' | 'video' | ''>('');
  const [moderationFilter, setModerationFilter] = useState('');
  const [processingFilter, setProcessingFilter] = useState('');
  const [rewardFilter, setRewardFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<MomentsGalleryRow | null>(null);

  const listParams = useMemo(
    () => ({
      q: searchQ.trim() || undefined,
      type: typeFilter || undefined,
      moderationStatus: moderationFilter || undefined,
      processingStatus: processingFilter || undefined,
      uploadRewardStatus: rewardFilter || undefined,
    }),
    [searchQ, typeFilter, moderationFilter, processingFilter, rewardFilter],
  );

  const load = useCallback(
    async (options?: { cursor?: string; append?: boolean }) => {
      const append = options?.append ?? false;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setMsg('');
      try {
        const data = await adminService.listAllMomentsForAdmin({
          ...listParams,
          limit: 24,
          cursor: options?.cursor,
        });
        setTotal(data.total);
        setNextCursor(data.nextCursor);
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } catch {
        setMsg('Failed to load moments.');
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [listParams],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const deleteMessage = useMemo(() => {
    if (!deleteTarget) return '';
    if (!deductCoinsOnDelete) {
      return 'This will delete the moment. No coins will be deducted.';
    }
    if (deleteTarget.coinsRewarded > 0) {
      return `This will deduct ${deleteTarget.coinsRewarded.toLocaleString()} coins from ${deleteTarget.creator.name}.`;
    }
    return 'Deduct coins is enabled, but no upload reward was paid — no coins will be deducted.';
  }, [deleteTarget, deductCoinsOnDelete]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.momentId);
    setMsg('');
    try {
      const result = await adminService.deleteMomentAsAdmin(deleteTarget.momentId, {
        deductCoins: deductCoinsOnDelete,
      });
      setItems((prev) => prev.filter((row) => row.momentId !== deleteTarget.momentId));
      setTotal((prev) => Math.max(0, prev - 1));
      if (result.coinsClawedBack > 0) {
        setMsg(
          `Deleted moment · ${result.coinsClawedBack.toLocaleString()} coins deducted from creator.`,
        );
      } else {
        setMsg('Deleted moment · no coins deducted.');
      }
      setDeleteTarget(null);
    } catch {
      setMsg('Failed to delete moment.');
    } finally {
      setDeletingId(null);
    }
  };

  const rewardLabel = (row: MomentsGalleryRow) => {
    if (row.coinsRewarded > 0) return `+${row.coinsRewarded} coins paid`;
    if (row.uploadRewardStatus === 'pending') return 'Reward pending';
    if (row.uploadRewardStatus === 'rejected') return 'Reward rejected';
    return 'No reward';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 p-6">
      <div>
        <SectionHeading title="All moments" helpKey="content.moments_gallery" level={1} />
        <p className="text-muted-foreground text-sm">
          Browse and delete creator moments. Showing {items.length} of {total} moments.
        </p>
        {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm w-fit cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-600"
          checked={deductCoinsOnDelete}
          onChange={(e) => setDeductCoinsOnDelete(e.target.checked)}
        />
        <span>Deduct upload reward coins on delete</span>
      </label>

      <div className="flex flex-wrap gap-2">
        <input
          className="rounded border px-3 py-2 text-sm min-w-[200px]"
          placeholder="Search caption…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
        <select
          className="rounded border px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'photo' | 'video' | '')}
        >
          <option value="">Type: all</option>
          <option value="photo">Photo</option>
          <option value="video">Video</option>
        </select>
        <select
          className="rounded border px-3 py-2 text-sm"
          value={moderationFilter}
          onChange={(e) => setModerationFilter(e.target.value)}
        >
          <option value="">Moderation: all</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          className="rounded border px-3 py-2 text-sm"
          value={processingFilter}
          onChange={(e) => setProcessingFilter(e.target.value)}
        >
          <option value="">Processing: all</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
        <select
          className="rounded border px-3 py-2 text-sm"
          value={rewardFilter}
          onChange={(e) =>
            setRewardFilter(e.target.value as 'pending' | 'approved' | 'rejected' | '')
          }
        >
          <option value="">Reward: all</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No moments match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((row) => (
            <article
              key={row.momentId}
              className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 flex flex-col"
            >
              <div
                className={`relative bg-zinc-950 min-h-[280px] ${
                  row.type === 'video' ? 'aspect-video' : 'aspect-[4/5]'
                }`}
              >
                {row.thumbnailUrl ? (
                  <img
                    src={row.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center text-zinc-500 text-sm">
                    No preview
                  </div>
                )}
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  <StatusBadge
                    label={row.type}
                    variant={row.type === 'video' ? 'info' : 'neutral'}
                  />
                  {row.inFreePreview ? (
                    <StatusBadge label="Preview" variant="warning" />
                  ) : null}
                </div>
                <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-1 max-w-[60%]">
                  <StatusBadge label={row.moderationStatus} variant="success" />
                  <StatusBadge label={row.processingStatus} variant="neutral" />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center gap-2">
                  {row.creator.avatarUrl ? (
                    <img
                      src={row.creator.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-zinc-700" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{row.creator.name}</p>
                    <p className="text-xs text-muted-foreground">{row.visibilityTier ?? 'PUBLIC'}</p>
                  </div>
                </div>

                <p className="line-clamp-3 text-sm text-zinc-300 min-h-[3.75rem]">
                  {row.caption?.trim() ? row.caption : '—'}
                </p>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{row.viewsCount.toLocaleString()} views</span>
                  <span>{row.likesCount.toLocaleString()} likes</span>
                  <span>{formatDateTime(row.createdAt)}</span>
                </div>

                <p
                  className={`text-xs font-medium ${
                    row.coinsRewarded > 0 ? 'text-amber-400' : 'text-muted-foreground'
                  }`}
                >
                  {rewardLabel(row)}
                </p>

                <button
                  type="button"
                  className="mt-auto rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-400 hover:bg-red-950/70 disabled:opacity-50"
                  disabled={deletingId === row.momentId}
                  onClick={() => setDeleteTarget(row)}
                >
                  {deletingId === row.momentId ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {nextCursor ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded border px-4 py-2 text-sm disabled:opacity-50"
            disabled={loadingMore}
            onClick={() => void load({ cursor: nextCursor, append: true })}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete moment?"
        message={
          deleteTarget
            ? `${deleteTarget.creator.name} · ${deleteTarget.type}. ${deleteMessage}`
            : ''
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        confirmDisabled={deletingId != null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default MomentsGalleryPage;
