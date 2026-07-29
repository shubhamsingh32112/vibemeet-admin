import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CreatorEditModal from '../components/CreatorEditModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { adminService, type CreatorPerformance } from '../services/adminService';

/**
 * Admin host detail: view + edit in one page (editable form).
 */
const AdminCreatorViewPage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<CreatorPerformance | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creatorId) return;
    let ok = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const d = await adminService.getCreatorDetail(creatorId);
        if (!ok) return;
        const stub: CreatorPerformance = {
          creatorId,
          userId: d.creator.userId || d.user?.id || '',
          name: d.creator.name,
          username: d.user?.username ?? null,
          avatar: d.creator.avatar ?? null,
          avatarUrl: d.creator.avatarUrl ?? null,
          photo: d.creator.photo ?? null,
          galleryCount: d.creator.galleryCount ?? d.creator.galleryImages?.length ?? 0,
          categories: d.creator.categories || [],
          price: d.creator.price,
          isOnline: d.creator.isOnline === true,
          assignedAgencyId: d.assignedAgencyId ?? null,
          assignedAgencyLabel: d.assignedAgencyLabel ?? null,
          email: d.user?.email ?? null,
          phone: d.user?.phone ?? null,
          coins: d.user?.coins ?? 0,
          createdAt: d.creator.createdAt || '',
          totalCalls: 0,
          totalMinutes: 0,
          totalEarned: 0,
          avgCallDurationSec: 0,
          lastCallAt: null,
          calls30d: 0,
          minutes30d: 0,
          earned30d: 0,
          tasksTotal: 0,
          tasksCompleted: 0,
          tasksClaimed: 0,
          avgEarningsPerMinute: 0,
          currentEarningsPerMinute: 0,
          earningsPerMinute: 0,
          abuseSignals: {
            shortCallPct: 0,
            zeroDuration30d: 0,
            refundCount: 0,
            refundRate: 0,
            earnDeviation: 0,
            isFlagged: false,
          },
        };
        setRow(stub);
      } catch {
        if (ok) setError('Failed to load host');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [creatorId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!row || error) {
    return (
      <div className="flex flex-col items-center py-24 gap-4">
        <p className="text-red-400">{error || 'Host not found'}</p>
        <Link to="/hosts/all" className="text-sm text-emerald-400 hover:underline">
          ← All hosts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/hosts/all" className="text-sm text-zinc-500 hover:text-white inline-block">
        ← All hosts
      </Link>
      <CreatorEditModal
        row={row}
        variant="page"
        onClose={() => navigate('/hosts/all')}
        onSaved={() => {
          /* stay on page; form reloads its own detail */
        }}
      />
      {creatorId ? (
        <p className="text-xs text-zinc-500">
          Creator ID: <span className="font-mono text-zinc-400">{creatorId}</span>
        </p>
      ) : null}
    </div>
  );
};

export default AdminCreatorViewPage;
