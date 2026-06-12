import React, { useCallback, useEffect, useState } from 'react';
import StatusBadge from '../../ui/StatusBadge';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { adminService, type GlobalAppUpdate } from '../../../services/adminService';
import {
  DEFAULT_APP_UPDATE_POINTS,
  DEFAULT_APP_UPDATE_TITLE,
  DEFAULT_APP_UPDATE_URL,
} from '../../../utils/appUpdateDefaults';

const AppUpdatePanel: React.FC = () => {
  const [currentUpdate, setCurrentUpdate] = useState<GlobalAppUpdate | null>(null);
  const [updateLoading, setUpdateLoading] = useState(true);
  const [updateError, setUpdateError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [title, setTitle] = useState(DEFAULT_APP_UPDATE_TITLE);
  const [updateUrl, setUpdateUrl] = useState(DEFAULT_APP_UPDATE_URL);
  const [points, setPoints] = useState<string[]>([...DEFAULT_APP_UPDATE_POINTS]);

  const loadCurrentUpdate = useCallback(async () => {
    try {
      setUpdateLoading(true);
      setUpdateError('');
      const payload = await adminService.getCurrentAppUpdate();
      setCurrentUpdate(payload);
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || err.message || 'Failed to load app update');
    } finally {
      setUpdateLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentUpdate();
  }, [loadCurrentUpdate]);

  const normalizedPoints = points.map((p) => p.trim()).filter(Boolean);
  const canPublish =
    title.trim().length > 0 &&
    updateUrl.trim().startsWith('https://') &&
    normalizedPoints.length > 0 &&
    !isPublishing;

  const handlePointChange = (index: number, value: string) => {
    setPoints((prev) => prev.map((point, i) => (i === index ? value : point)));
  };

  const addPoint = () => setPoints((prev) => [...prev, '']);

  const removePoint = (index: number) => {
    setPoints((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handlePublishConfirmed = async () => {
    if (!canPublish) return;
    try {
      setIsPublishing(true);
      setPublishError('');
      setPublishSuccess('');
      const published = await adminService.publishAppUpdate({
        title: title.trim(),
        points: normalizedPoints,
        updateUrl: updateUrl.trim(),
      });
      setCurrentUpdate(published);
      setPublishSuccess('Update published successfully. Users and creators will receive the popup.');
      setTitle(DEFAULT_APP_UPDATE_TITLE);
      setUpdateUrl(DEFAULT_APP_UPDATE_URL);
      setPoints([...DEFAULT_APP_UPDATE_POINTS]);
      setShowPublishConfirm(false);
    } catch (err: any) {
      setPublishError(err.response?.data?.error || err.message || 'Failed to publish app update');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section className="rounded-xl border border-admin-border bg-admin-surface p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">Global app update popup</h2>
          <p className="text-xs text-zinc-500 mt-1">Publish a forced update notice to all users and hosts.</p>
        </div>
        <StatusBadge
          variant={currentUpdate ? 'info' : 'warning'}
          label={currentUpdate ? 'Active update published' : 'No active update'}
          dot
        />
      </div>

      {publishSuccess && (
        <div className="rounded-lg border border-emerald-700 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
          {publishSuccess}
        </div>
      )}
      {(publishError || updateError) && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {publishError || updateError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Publish new update</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Heading</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                placeholder="New version available"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Bullet points</label>
              <div className="space-y-2">
                {points.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={point}
                      onChange={(e) => handlePointChange(idx, e.target.value)}
                      maxLength={240}
                      placeholder={`Point ${idx + 1}`}
                      className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => removePoint(idx)}
                      disabled={points.length <= 1}
                      className="px-2 py-2 text-xs rounded border border-gray-700 text-gray-300 hover:text-white disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addPoint} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
                + Add another point
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Update link (HTTPS)</label>
              <input
                value={updateUrl}
                onChange={(e) => setUpdateUrl(e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPublishConfirm(true)}
              disabled={!canPublish}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
            >
              {isPublishing ? 'Publishing...' : 'Publish global update'}
            </button>
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Current active update</h3>
          {updateLoading ? (
            <div className="text-sm text-gray-500">Loading active update...</div>
          ) : !currentUpdate ? (
            <div className="text-sm text-gray-500">No active update has been published yet.</div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Version: {currentUpdate.version} · Published:{' '}
                {new Date(currentUpdate.publishedAt).toLocaleString()}
              </p>
              <h4 className="text-base font-semibold text-white">{currentUpdate.title}</h4>
              <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                {currentUpdate.points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
              <a
                href={currentUpdate.updateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm text-blue-400 hover:text-blue-300"
              >
                {currentUpdate.updateUrl}
              </a>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showPublishConfirm}
        title="Publish app update?"
        message="This will trigger an update popup for all users and creators."
        confirmLabel={isPublishing ? 'Publishing...' : 'Publish'}
        confirmVariant="primary"
        confirmDisabled={!canPublish}
        onCancel={() => setShowPublishConfirm(false)}
        onConfirm={handlePublishConfirmed}
      />
    </section>
  );
};

export default AppUpdatePanel;
