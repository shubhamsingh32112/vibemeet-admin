import * as React from 'react';
import type { AxiosInstance } from 'axios';
import { ArrowDownLeft, ArrowUpRight, Landmark, Wallet } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import StatusBadge from '../ui/StatusBadge';
import {
  createStaffWalletService,
  type StaffWalletSummary,
  type StaffWalletTransaction,
  type StaffWalletWithdrawal,
} from '../../services/staffWalletService';
import { formatDashboardMoneyFromCoins } from '../../utils/dashboardInr';
import { formatDateTime } from '../../utils/dateTime';

type Props = {
  api: AxiosInstance;
  basePath: '/agency' | '/bd';
  portalLabel: string;
};

const card =
  'rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

function withdrawalVariant(status: StaffWalletWithdrawal['status']) {
  switch (status) {
    case 'pending':
      return 'warning' as const;
    case 'approved':
      return 'info' as const;
    case 'rejected':
      return 'danger' as const;
    case 'paid':
      return 'success' as const;
    default:
      return 'neutral' as const;
  }
}

const StaffWalletPage: React.FC<Props> = ({ api, basePath, portalLabel }) => {
  const wallet = React.useMemo(() => createStaffWalletService(api, basePath), [api, basePath]);
  const fmt = (n: number) => formatDashboardMoneyFromCoins(n).text;

  const [summary, setSummary] = React.useState<StaffWalletSummary | null>(null);
  const [transactions, setTransactions] = React.useState<StaffWalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<StaffWalletWithdrawal[]>([]);
  const [txPage, setTxPage] = React.useState(1);
  const [wdPage, setWdPage] = React.useState(1);
  const [txPages, setTxPages] = React.useState(1);
  const [wdPages, setWdPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [ok, setOk] = React.useState('');

  const [holderName, setHolderName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [ifsc, setIfsc] = React.useState('');
  const [upi, setUpi] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [savingAccount, setSavingAccount] = React.useState(false);

  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [withdrawing, setWithdrawing] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [s, tx, wd] = await Promise.all([
        wallet.getSummary(),
        wallet.getTransactions({ page: txPage, limit: 20 }),
        wallet.getWithdrawals({ page: wdPage, limit: 10 }),
      ]);
      setSummary(s);
      setTransactions(tx.transactions);
      setTxPages(tx.pagination.totalPages);
      setWithdrawals(wd.withdrawals);
      setWdPages(wd.pagination.totalPages);
      const pa = s.payoutAccount;
      if (pa) {
        setHolderName(pa.accountHolderName || '');
        setAccountNumber(pa.accountNumber?.includes('•') ? '' : pa.accountNumber || '');
        setIfsc(pa.ifsc || '');
        setUpi(pa.upi?.includes('***') ? '' : pa.upi || '');
        setPhone(pa.phone || '');
      }
    } catch {
      setErr('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [wallet, txPage, wdPage]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    setErr('');
    setOk('');
    try {
      await wallet.savePayoutAccount({
        accountHolderName: holderName,
        accountNumber: accountNumber || undefined,
        ifsc: ifsc || undefined,
        upi: upi || undefined,
        phone: phone || undefined,
      });
      setOk('Payout account saved.');
      await load();
    } catch (ex: unknown) {
      const msg =
        ex && typeof ex === 'object' && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setErr(msg || 'Could not save payout account.');
    } finally {
      setSavingAccount(false);
    }
  };

  const requestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setErr('');
    setOk('');
    try {
      const amount = Number(withdrawAmount);
      await wallet.requestWithdrawal(amount);
      setOk('Withdrawal request submitted. Super admin will review it.');
      setWithdrawAmount('');
      await load();
    } catch (ex: unknown) {
      const msg =
        ex && typeof ex === 'object' && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setErr(msg || 'Could not submit withdrawal.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">MatchVibe</p>
        <h1 className="text-2xl font-bold text-white">{portalLabel} wallet</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Earnings, payout account, transactions, and withdrawal requests.
        </p>
        {typeof summary?.commissionPctOfHostEarnings === 'number' ? (
          <p className="mt-2 text-sm text-zinc-400">
            You earn <strong className="text-zinc-200">{summary.commissionPctOfHostEarnings}%</strong>{' '}
            of host earnings on each settled call (credited here; not deducted from creators).
          </p>
        ) : null}
      </div>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {ok ? <p className="text-sm text-emerald-400">{ok}</p> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={card}>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Available balance</p>
          <p className="mt-2 text-2xl font-bold text-white">{fmt(summary?.balance ?? 0)}</p>
        </div>
        <div className={card}>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Total earnings</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {fmt(summary?.totalEarningsCoins ?? 0)}
          </p>
        </div>
        <div className={card}>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Total withdrawn</p>
          <p className="mt-2 text-2xl font-bold text-violet-300">
            {fmt(summary?.totalWithdrawnCoins ?? 0)}
          </p>
        </div>
        <div className={card}>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Pending requests</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">
            {summary?.pendingWithdrawalCount ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <form onSubmit={(e) => void saveAccount(e)} className={`${card} space-y-3`}>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-violet-300" />
            <h2 className="text-sm font-semibold text-white">Payout account binding</h2>
          </div>
          <p className="text-xs text-zinc-500">
            Required before withdrawal. Add UPI or bank account + IFSC.
          </p>
          <input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="Account holder name"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white"
            required
          />
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Account number"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white"
          />
          <input
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value.toUpperCase())}
            placeholder="IFSC code"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white"
          />
          <input
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            placeholder="UPI ID"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white"
          />
          <button
            type="submit"
            disabled={savingAccount}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {savingAccount ? 'Saving…' : 'Save payout account'}
          </button>
        </form>

        <form onSubmit={(e) => void requestWithdrawal(e)} className={`${card} space-y-3`}>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-300" />
            <h2 className="text-sm font-semibold text-white">Request withdrawal</h2>
          </div>
          <p className="text-xs text-zinc-500">
            Minimum 100 coins. One request per 24 hours. Sent to super admin for approval.
          </p>
          <input
            type="number"
            min={100}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount (coins)"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white"
            required
          />
          <button
            type="submit"
            disabled={withdrawing || !summary?.payoutAccountBound}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {withdrawing ? 'Submitting…' : 'Submit withdrawal request'}
          </button>
          {!summary?.payoutAccountBound ? (
            <p className="text-xs text-amber-400">Bind a payout account first.</p>
          ) : null}
        </form>
      </div>

      <div className={card}>
        <h2 className="text-sm font-semibold text-white">Withdrawal history</h2>
        <div className="mt-3 space-y-2">
          {withdrawals.length === 0 ? (
            <p className="text-sm text-zinc-500">No withdrawal requests yet.</p>
          ) : (
            withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{fmt(w.amount)}</p>
                  <p className="text-[11px] text-zinc-500">{formatDateTime(w.requestedAt)}</p>
                </div>
                <StatusBadge variant={withdrawalVariant(w.status)} label={w.status} />
              </div>
            ))
          )}
        </div>
        {wdPages > 1 ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={wdPage <= 1}
              onClick={() => setWdPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={wdPage >= wdPages}
              onClick={() => setWdPage((p) => p + 1)}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <div className={card}>
        <h2 className="text-sm font-semibold text-white">Transaction history</h2>
        <div className="mt-3 space-y-2">
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-500">No transactions yet.</p>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-zinc-900/50 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {t.direction === 'credit' ? (
                    <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-orange-400" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{t.description}</p>
                    <p className="text-[11px] text-zinc-500">{formatDateTime(t.createdAt)}</p>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    t.direction === 'credit' ? 'text-emerald-400' : 'text-orange-300'
                  }`}
                >
                  {t.direction === 'credit' ? '+' : '-'}
                  {fmt(t.amountCoins)}
                </p>
              </div>
            ))
          )}
        </div>
        {txPages > 1 ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={txPage <= 1}
              onClick={() => setTxPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={txPage >= txPages}
              onClick={() => setTxPage((p) => p + 1)}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default StaffWalletPage;
