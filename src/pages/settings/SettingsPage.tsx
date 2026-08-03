import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { SectionHeading } from '../../components/admin/help/SectionHeading';
import AppUpdatePanel from '../../components/admin/system/AppUpdatePanel';
import {
  adminService,
  type ConsumerRewardTaskSlice,
  type ConsumerRewardsConfig,
  type RewardsMonitorPayload,
  type RewardsReconReport,
  type TelegramRewardConfig,
  type WalletPricingConfig,
  type WalletPricingPack,
} from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const SettingsPage: React.FC = () => {
  const [walletPricing, setWalletPricing] = useState<WalletPricingConfig | null>(null);
  const [pricing, setPricing] = useState<WalletPricingPack[]>([]);
  const [bdBps, setBdBps] = useState(500);
  const [agencyBps, setAgencyBps] = useState(1500);
  const [telegramReward, setTelegramReward] = useState<TelegramRewardConfig | null>(null);
  const [tgEnabled, setTgEnabled] = useState(false);
  const [tgChannelUrl, setTgChannelUrl] = useState('');
  const [tgChannelChatId, setTgChannelChatId] = useState('');
  const [tgRewardCoins, setTgRewardCoins] = useState(100);
  const [consumerRewards, setConsumerRewards] = useState<ConsumerRewardsConfig | null>(null);
  const [crEnabled, setCrEnabled] = useState(true);
  const [crTasks, setCrTasks] = useState<Record<string, ConsumerRewardTaskSlice>>({});
  const [crBudget, setCrBudget] = useState(500000);
  const [rewardsMonitor, setRewardsMonitor] = useState<RewardsMonitorPayload | null>(null);
  const [rewardsRecon, setRewardsRecon] = useState<RewardsReconReport | null>(null);
  const [monitorRange, setMonitorRange] = useState<'today' | '7d'>('today');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [wp, rev, tg, cr, mon, recon] = await Promise.all([
          adminService.getWalletPricing(),
          adminService.getPlatformRevenue(),
          adminService.getTelegramReward(),
          adminService.getConsumerRewards(),
          adminService.getRewardsMonitor('today').catch(() => null),
          adminService.getRewardsRecon(false).catch(() => null),
        ]);
        setWalletPricing(wp);
        setPricing(wp.packages);
        setBdBps(rev.bdBps);
        setAgencyBps(rev.agencyBps);
        setTelegramReward(tg);
        setTgEnabled(tg.enabled);
        setTgChannelUrl(tg.channelUrl);
        setTgChannelChatId(tg.channelChatId);
        setTgRewardCoins(tg.rewardCoins);
        setConsumerRewards(cr);
        setCrEnabled(cr.enabled);
        setCrTasks(cr.tasks ?? {});
        setCrBudget(cr.dailyRewardBudgetCoins ?? 500000);
        setRewardsMonitor(mon);
        setRewardsRecon(recon);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshMonitor = async (range: 'today' | '7d') => {
    setMonitorRange(range);
    try {
      const mon = await adminService.getRewardsMonitor(range);
      setRewardsMonitor(mon);
    } catch {
      setMsg('Failed to load rewards monitor.');
    }
  };

  const runRecon = async () => {
    setSaving(true);
    setMsg('');
    try {
      const report = await adminService.getRewardsRecon(true);
      setRewardsRecon(report);
      setMsg(report?.ok ? 'Recon completed: clean.' : 'Recon completed: check mismatches.');
    } catch {
      setMsg('Failed to run recon.');
    } finally {
      setSaving(false);
    }
  };

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

  const saveTelegramReward = async () => {
    setSaving(true);
    setMsg('');
    try {
      const updated = await adminService.updateTelegramReward({
        enabled: tgEnabled,
        channelUrl: tgChannelUrl.trim(),
        channelChatId: tgChannelChatId.trim(),
        rewardCoins: tgRewardCoins,
      });
      setTelegramReward(updated);
      setTgEnabled(updated.enabled);
      setTgChannelUrl(updated.channelUrl);
      setTgChannelChatId(updated.channelChatId);
      setTgRewardCoins(updated.rewardCoins);
      setMsg('Telegram reward settings saved.');
    } catch {
      setMsg('Failed to save Telegram reward settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateCrTask = (
    key: string,
    field: keyof ConsumerRewardTaskSlice,
    value: string | number | boolean
  ) => {
    setCrTasks((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const saveConsumerRewards = async () => {
    setSaving(true);
    setMsg('');
    try {
      const updated = await adminService.updateConsumerRewards({
        enabled: crEnabled,
        tasks: crTasks,
        dailyRewardBudgetCoins: crBudget,
        dailyBudgetMode: 'alert_only',
      });
      setConsumerRewards(updated);
      setCrEnabled(updated.enabled);
      setCrTasks(updated.tasks ?? {});
      setCrBudget(updated.dailyRewardBudgetCoins ?? 500000);
      setMsg('Consumer rewards settings saved.');
    } catch {
      setMsg('Failed to save consumer rewards settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <SectionHeading title="Platform config" helpKey="settings.page" level={1} />
        <p className="text-sm text-zinc-500 mt-1">
          Wallet pricing, staff commission, Telegram rewards, and app update publishing.
        </p>
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
        <h2 className="text-sm font-medium text-zinc-300">Rewards — Telegram</h2>
        <p className="text-xs text-zinc-500">
          Bot must be an admin of the channel. Webhook and bot token are configured via server env
          (never in this UI). Membership is verified with getChatMember before crediting coins.
        </p>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={tgEnabled}
            onChange={(e) => setTgEnabled(e.target.checked)}
          />
          Enable Telegram reward
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <label className="text-sm text-zinc-400 md:col-span-2">
            Channel URL
            <input
              type="url"
              placeholder="https://t.me/yourchannel"
              value={tgChannelUrl}
              onChange={(e) => setTgChannelUrl(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
            />
          </label>
          <label className="text-sm text-zinc-400">
            Channel Chat ID
            <input
              type="text"
              placeholder="@yourchannel or -100…"
              value={tgChannelChatId}
              onChange={(e) => setTgChannelChatId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
            />
          </label>
          <label className="text-sm text-zinc-400">
            Reward coins
            <input
              type="number"
              min={1}
              max={10000}
              value={tgRewardCoins}
              onChange={(e) => setTgRewardCoins(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
            />
          </label>
        </div>
        {telegramReward?.updatedAt && (
          <p className="text-xs text-zinc-500">
            Last updated: {formatDateTime(telegramReward.updatedAt)}
          </p>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={saveTelegramReward}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
        >
          Save Telegram reward
        </button>
      </section>

      <section className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Rewards Hub — consumer tasks</h2>
        <p className="text-xs text-zinc-500">
          Live amounts (no redeploy). Env only seeds the first Mongo document. Successful referral
          default is 500 coins (was often 60 in older env). Telegram coins stay in the section above.
        </p>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={crEnabled}
            onChange={(e) => setCrEnabled(e.target.checked)}
          />
          Enable consumer rewards hub
        </label>
        <label className="text-sm text-zinc-400 block max-w-xs">
          Daily reward budget (coins, alert only)
          <input
            type="number"
            min={0}
            max={100000000}
            value={crBudget}
            onChange={(e) => setCrBudget(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
          />
        </label>
        {consumerRewards?.readiness && (
          <div className="text-xs text-zinc-500 space-y-1 font-mono">
            <p>
              readiness: botToken={String(consumerRewards.readiness.botTokenSet)} webhook=
              {String(consumerRewards.readiness.webhookSecretSet)} channel=
              {String(consumerRewards.readiness.telegramChannelConfigured)} consumer=
              {String(consumerRewards.readiness.consumerEnabled)}
            </p>
            <p>{consumerRewards.readiness.mongoTxnNote}</p>
          </div>
        )}
        <div className="overflow-auto border border-white/10 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-black/30">
              <tr>
                <th className="px-2 py-2 text-left text-zinc-400">Task</th>
                <th className="px-2 py-2 text-left text-zinc-400">On</th>
                <th className="px-2 py-2 text-left text-zinc-400">Coins</th>
                <th className="px-2 py-2 text-left text-zinc-400">Extra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.entries(crTasks).map(([key, slice]) => (
                <tr key={key}>
                  <td className="px-2 py-1.5 text-zinc-300 font-mono">{key}</td>
                  <td className="px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={slice?.enabled !== false}
                      onChange={(e) => updateCrTask(key, 'enabled', e.target.checked)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={slice?.coins ?? 0}
                      onChange={(e) => updateCrTask(key, 'coins', Number(e.target.value))}
                      className="w-24 rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-1.5 space-x-2">
                    {slice?.minSeconds !== undefined && (
                      <label className="text-zinc-500">
                        minSec
                        <input
                          type="number"
                          value={slice.minSeconds}
                          onChange={(e) =>
                            updateCrTask(key, 'minSeconds', Number(e.target.value))
                          }
                          className="ml-1 w-16 rounded border border-white/10 bg-black/30 px-1 py-1 text-white"
                        />
                      </label>
                    )}
                    {slice?.minPurchaseInr !== undefined && (
                      <label className="text-zinc-500">
                        min₹
                        <input
                          type="number"
                          value={slice.minPurchaseInr}
                          onChange={(e) =>
                            updateCrTask(key, 'minPurchaseInr', Number(e.target.value))
                          }
                          className="ml-1 w-16 rounded border border-white/10 bg-black/30 px-1 py-1 text-white"
                        />
                      </label>
                    )}
                    {slice?.targetCount !== undefined && (
                      <label className="text-zinc-500">
                        target
                        <input
                          type="number"
                          value={slice.targetCount}
                          onChange={(e) =>
                            updateCrTask(key, 'targetCount', Number(e.target.value))
                          }
                          className="ml-1 w-16 rounded border border-white/10 bg-black/30 px-1 py-1 text-white"
                        />
                      </label>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {consumerRewards?.updatedAt && (
          <p className="text-xs text-zinc-500">
            Last updated: {formatDateTime(consumerRewards.updatedAt)}
          </p>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={saveConsumerRewards}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
        >
          Save consumer rewards
        </button>
      </section>

      <section className="rounded-xl border border-admin-border bg-admin-surface p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-300">Rewards monitor</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => refreshMonitor('today')}
              className={`px-3 py-1.5 text-xs rounded border ${
                monitorRange === 'today'
                  ? 'border-violet-500 text-white'
                  : 'border-white/10 text-zinc-400'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => refreshMonitor('7d')}
              className={`px-3 py-1.5 text-xs rounded border ${
                monitorRange === '7d'
                  ? 'border-violet-500 text-white'
                  : 'border-white/10 text-zinc-400'
              }`}
            >
              7d
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={runRecon}
              className="px-3 py-1.5 text-xs rounded border border-white/10 text-zinc-300"
            >
              Run recon now
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Read-only issuance view (detection only — no auto bans). Soft budget alerts only.
        </p>
        {rewardsMonitor && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="rounded-lg bg-black/30 border border-white/10 p-3">
              <p className="text-zinc-500 text-xs">Coins issued</p>
              <p className="text-white font-medium">{rewardsMonitor.coinsIssued}</p>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 p-3">
              <p className="text-zinc-500 text-xs">Budget util</p>
              <p className="text-white font-medium">
                {rewardsMonitor.budgetUtilizationPct}% / {rewardsMonitor.dailyBudget}
              </p>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 p-3">
              <p className="text-zinc-500 text-xs">Telegram claims</p>
              <p className="text-white font-medium">
                {rewardsMonitor.countsBySource.telegram_join_reward?.count ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 p-3">
              <p className="text-zinc-500 text-xs">Range</p>
              <p className="text-white font-medium text-xs">
                {rewardsMonitor.dateFrom} → {rewardsMonitor.dateTo}
              </p>
            </div>
          </div>
        )}
        {rewardsMonitor?.softAlerts?.length ? (
          <ul className="text-xs text-amber-400 list-disc pl-4">
            {rewardsMonitor.softAlerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : null}
        {rewardsMonitor && (
          <div className="overflow-auto border border-white/10 rounded-lg max-h-48">
            <table className="w-full text-xs">
              <thead className="bg-black/30 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left text-zinc-400">Source</th>
                  <th className="px-2 py-2 text-left text-zinc-400">Count</th>
                  <th className="px-2 py-2 text-left text-zinc-400">Coins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(rewardsMonitor.countsBySource).map(([source, row]) => (
                  <tr key={source}>
                    <td className="px-2 py-1.5 text-zinc-300 font-mono">{source}</td>
                    <td className="px-2 py-1.5 text-zinc-300">{row.count}</td>
                    <td className="px-2 py-1.5 text-zinc-300">{row.coins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rewardsMonitor && rewardsMonitor.topEarners.length > 0 && (
          <div className="overflow-auto border border-white/10 rounded-lg max-h-40">
            <table className="w-full text-xs">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-2 py-2 text-left text-zinc-400">Top earner</th>
                  <th className="px-2 py-2 text-left text-zinc-400">Coins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rewardsMonitor.topEarners.slice(0, 10).map((e) => (
                  <tr key={e.userId}>
                    <td className="px-2 py-1.5 font-mono text-zinc-400">{e.userId}</td>
                    <td className="px-2 py-1.5 text-zinc-300">{e.coins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rewardsRecon && (
          <p className="text-xs text-zinc-500">
            Last recon {rewardsRecon.dateKey}: {rewardsRecon.ok ? 'ok' : 'FAILED'} · ledger coins=
            {rewardsRecon.reward_tx_sum_coins} · mismatches=
            {rewardsRecon.wallet_mismatch_users_count} · {rewardsRecon.generatedAt}
          </p>
        )}
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
