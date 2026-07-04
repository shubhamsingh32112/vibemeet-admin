import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import AppUpdatePanel from '../../components/admin/system/AppUpdatePanel';
import {
  adminService,
  type WalletPricingConfig,
  type WalletPricingPack,
} from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const SettingsPage: React.FC = () => {
  const [walletPricing, setWalletPricing] = useState<WalletPricingConfig | null>(null);
  const [pricing, setPricing] = useState<WalletPricingPack[]>([]);
  const [bdBps, setBdBps] = useState(500);
  const [agencyBps, setAgencyBps] = useState(1500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [wp, rev] = await Promise.all([
          adminService.getWalletPricing(),
          adminService.getPlatformRevenue(),
        ]);
        setWalletPricing(wp);
        setPricing(wp.packages);
        setBdBps(rev.bdBps);
        setAgencyBps(rev.agencyBps);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updatePack = (
    index: number,
    key: keyof WalletPricingPack,
    value: string | number | boolean | undefined
  ) => {
    setPricing((prev) => prev.map((pack, i) => (i === index ? { ...pack, [key]: value } : pack)));
  };

  const addPack = () => {
    setPricing((prev) => [
      ...prev,
      {
        coins: 100,
        tier1PriceInr: 99,
        tier2PriceInr: 99,
        oldPriceInr: undefined,
        badge: '',
        isActive: true,
        sortOrder: prev.length + 1,
      },
    ]);
  };

  const removePack = (index: number) => {
    setPricing((prev) => prev.filter((_, i) => i !== index));
  };

  const saveRevenue = async () => {
    setSaving(true);
    setMsg('');
    try {
      await adminService.updatePlatformRevenue({ bdBps, agencyBps });
      setMsg('Commission settings saved.');
    } catch {
      setMsg('Failed to save commission settings.');
    } finally {
      setSaving(false);
    }
  };

  const savePricing = async () => {
    setSaving(true);
    setMsg('');
    try {
      const updated = await adminService.updateWalletPricing(pricing);
      setWalletPricing((prev) => ({
        packages: updated.packages,
        defaults: prev?.defaults ?? updated.packages,
        updatedAt: updated.updatedAt,
        updatedByAdminId: updated.updatedByAdminId,
      }));
      setPricing(updated.packages);
      setMsg('Wallet pricing saved.');
    } catch {
      setMsg('Failed to save wallet pricing.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <SectionHeading title="Platform config" helpKey="settings.page" level={1} />
        <p className="text-sm text-zinc-500 mt-1">Wallet pricing, staff commission, and app update publishing.</p>
      </div>

      <section className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Commission (BD / Agency bps)</h2>
        <p className="text-xs text-zinc-500">
          Basis points of host-earned coins per settled call (10000 = 100%).
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <label className="text-sm text-zinc-400">
            BD bps
            <input
              type="number"
              min={0}
              max={10000}
              value={bdBps}
              onChange={(e) => setBdBps(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
            />
          </label>
          <label className="text-sm text-zinc-400">
            Agency bps
            <input
              type="number"
              min={0}
              max={10000}
              value={agencyBps}
              onChange={(e) => setAgencyBps(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={saveRevenue}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
        >
          Save commission
        </button>
      </section>

      <section className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-300">Wallet packages</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addPack}
              className="px-3 py-1.5 text-xs border border-white/10 rounded text-zinc-300 hover:text-white"
            >
              Add pack
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={savePricing}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
            >
              Save wallet pricing
            </button>
          </div>
        </div>
        {walletPricing && (
          <p className="text-xs text-zinc-500">Last updated: {formatDateTime(walletPricing.updatedAt)}</p>
        )}
        <div className="overflow-auto border border-white/10 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-black/30">
              <tr>
                <th className="px-2 py-2 text-left text-zinc-400">Coins</th>
                <th className="px-2 py-2 text-left text-zinc-400">Tier 1 (₹)</th>
                <th className="px-2 py-2 text-left text-zinc-400">Tier 2 (₹)</th>
                <th className="px-2 py-2 text-left text-zinc-400">Old price</th>
                <th className="px-2 py-2 text-left text-zinc-400">Badge</th>
                <th className="px-2 py-2 text-left text-zinc-400">Order</th>
                <th className="px-2 py-2 text-left text-zinc-400">Active</th>
                <th className="px-2 py-2 text-left text-zinc-400" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pricing.map((pack, index) => (
                <tr key={`${pack.coins}-${index}`}>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={pack.coins}
                      onChange={(e) => updatePack(index, 'coins', Number(e.target.value))}
                      className="w-20 rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={pack.tier1PriceInr}
                      onChange={(e) => updatePack(index, 'tier1PriceInr', Number(e.target.value))}
                      className="w-24 rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={pack.tier2PriceInr}
                      onChange={(e) => updatePack(index, 'tier2PriceInr', Number(e.target.value))}
                      className="w-24 rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={pack.oldPriceInr ?? ''}
                      onChange={(e) =>
                        updatePack(index, 'oldPriceInr', e.target.value ? Number(e.target.value) : undefined)
                      }
                      className="w-24 rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={pack.badge ?? ''}
                      onChange={(e) => updatePack(index, 'badge', e.target.value)}
                      className="w-28 rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={pack.sortOrder}
                      onChange={(e) => updatePack(index, 'sortOrder', Number(e.target.value))}
                      className="w-16 rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={pack.isActive}
                      onChange={(e) => updatePack(index, 'isActive', e.target.checked)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => removePack(index)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AppUpdatePanel />

      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
    </div>
  );
};

export default SettingsPage;
