import React, { useCallback, useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  adminService,
  type MomentUploadRewardRow,
} from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const MomentUploadRewardsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [items, setItems] = useState<MomentUploadRewardRow[]>([]);
  const [rewardConfig, setRewardConfig] = useState<{
    photoRewardCoins: number;
    videoRewardCoins: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg('');
    try {
      const [config, data] = await Promise.all([
        adminService.getUploadRewardsConfig(),
        adminService.getPendingUploadRewards(),
      ]);
      setRewardConfig(config);
      setItems(data.items);
    } catch {
      setMsg('Failed to load pending upload rewards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    setActingId(id);
    setMsg('');
    try {
      const result = await adminService.approveUploadReward(id);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setMsg(
        `Approved · ${result.coinsCredited} coins credited (reward tier: ${result.rewardCoins}).`,
      );
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMsg(err.response?.data?.error ?? 'Failed to approve upload reward.');
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: string) => {
    setActingId(id);
    setMsg('');
    try {
      await adminService.rejectUploadReward(id);
      setItems((prev) => prev.filter((row) => row.id !== id));
      setMsg('Upload reward rejected.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMsg(err.response?.data?.error ?? 'Failed to reject upload reward.');
    } finally {
      setActingId(null);
    }
  };

  const columns: Column<MomentUploadRewardRow>[] = [
    {
      key: 'thumbnail',
      header: 'Preview',
      render: (row) =>
        row.thumbnailUrl ? (
          <img
            src={row.thumbnailUrl}
            alt=""
            className="h-14 w-10 rounded object-cover bg-muted"
          />
        ) : (
          <div className="h-14 w-10 rounded bg-muted" />
        ),
    },
    {
      key: 'creator',
      header: 'Creator',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.creatorAvatarUrl ? (
            <img
              src={row.creatorAvatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted" />
          )}
          <span className="font-medium">{row.creatorName}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <StatusBadge
          label={row.type === 'video' ? 'Video' : 'Photo'}
          variant={row.type === 'video' ? 'info' : 'neutral'}
        />
      ),
    },
    {
      key: 'caption',
      header: 'Caption',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
          {row.caption?.trim() || '—'}
        </span>
      ),
    },
    {
      key: 'rewardCoins',
      header: 'Reward',
      render: (row) => (
        <span className="font-semibold tabular-nums">{row.rewardCoins} coins</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Uploaded',
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-emerald-600 px-3 py-1 text-sm text-white disabled:opacity-50"
            disabled={actingId === row.id}
            onClick={() => void approve(row.id)}
          >
            Approve
          </button>
          <button
            type="button"
            className="rounded border border-red-500 px-3 py-1 text-sm text-red-500 disabled:opacity-50"
            disabled={actingId === row.id}
            onClick={() => void reject(row.id)}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <SectionHeading title="Moment upload rewards" helpKey="content.moments_rewards" level={1} />
        <p className="mt-1 text-sm text-muted-foreground">
          Approve coin rewards for creator uploads. Content is already live in the
          Moments feed; approval only credits coins.
        </p>
        {rewardConfig && (
          <p className="mt-2 text-sm text-muted-foreground">
            Current rewards: {rewardConfig.photoRewardCoins} coins (photo),{' '}
            {rewardConfig.videoRewardCoins} coins (video)
          </p>
        )}
      </div>

      {msg && (
        <div className="rounded border border-border bg-muted/40 px-4 py-2 text-sm">
          {msg}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        emptyMessage="No pending upload rewards."
        keyField="id"
      />
    </div>
  );
};

export default MomentUploadRewardsPage;
