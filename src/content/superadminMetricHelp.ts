export type MetricHelpTimezone = 'IST' | 'header_range' | 'realtime' | 'none';

export type MetricHelpContent = {
  title: string;
  body: string;
  timezone?: MetricHelpTimezone;
  source?: string;
  filterScope?: string;
};

export const SUPERADMIN_METRIC_HELP: Record<string, MetricHelpContent> = {
  // ── Command center ──
  'dashboard.page': {
    title: 'Command center',
    body: 'Live operational overview for super admins. Most KPIs follow the header date filter (IST calendar days, half-open range). Recharge collection and Razorpay balance use independent time scopes.',
    timezone: 'header_range',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.revenue_coins': {
    title: 'Net wallet coin flow',
    body: 'Completed wallet credits minus completed wallet debits in the selected period.',
    timezone: 'header_range',
    source: 'CoinTransaction.createdAt (type=credit/debit, status=completed)',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.recharge_collection': {
    title: 'Recharge collection (today)',
    body: 'Sum of successful payment-gateway wallet recharges for the current IST calendar day. Uses payment completion time, not header filter.',
    timezone: 'IST',
    source: 'CoinTransaction.updatedAt (type=credit, source=payment_gateway, status=completed)',
    filterScope: 'Fixed IST today',
  },
  'dashboard.live_calls_5m': {
    title: 'Live calls (5m)',
    body: 'User-side call history rows created in the trailing 5 minutes. Real-time proxy, not IST day bucket.',
    timezone: 'realtime',
    source: 'CallHistory.createdAt (ownerRole=user)',
    filterScope: 'Trailing 5 minutes (wall clock)',
  },
  'dashboard.hosts_online': {
    title: 'Hosts online',
    body: 'Creators currently available for calls according to live Redis presence.',
    timezone: 'realtime',
    source: 'Redis creator presence',
    filterScope: 'Live snapshot',
  },
  'dashboard.users_online_5m': {
    title: 'Users online (5m)',
    body: 'Fans with socket activity in the last 5 minutes. Uses a Redis recent-activity marker (300s TTL) refreshed on connect and heartbeat; not deleted on disconnect so recently closed sessions still count until the window expires.',
    timezone: 'realtime',
    source: 'Redis user:recent-activity',
    filterScope: 'Trailing 5 minutes (wall clock)',
  },
  'dashboard.hosts_on_call': {
    title: 'Hosts on call',
    body: 'Creators currently in an active video call according to live Redis presence.',
    timezone: 'realtime',
    source: 'Redis creator presence (on_call)',
    filterScope: 'Live snapshot',
  },
  'dashboard.hosts_offline': {
    title: 'Hosts offline',
    body: 'Creators marked unavailable for calls according to live Redis presence.',
    timezone: 'realtime',
    source: 'Redis creator presence (offline)',
    filterScope: 'Live snapshot',
  },
  'dashboard.call_minutes': {
    title: 'Call minutes',
    body: 'Total duration of user-side calls in the selected IST range, converted to minutes.',
    timezone: 'header_range',
    source: 'CallHistory.durationSeconds (ownerRole=user)',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.total_calls': {
    title: 'Calls',
    body: 'Count of user-side call history rows in the selected IST range.',
    timezone: 'header_range',
    source: 'CallHistory.createdAt (ownerRole=user)',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.coins_spent_calls': {
    title: 'Coins spent on calls',
    body: 'Sum of coins deducted from users for calls in the selected IST range.',
    timezone: 'header_range',
    source: 'CallHistory.coinsDeducted (ownerRole=user)',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.pending_payouts': {
    title: 'Pending payouts',
    body: 'Withdrawal requests still pending. When a header range is set, filtered by requestedAt in that IST range.',
    timezone: 'header_range',
    source: 'Withdrawal.requestedAt (status=pending)',
    filterScope: 'Header date filter (IST) when set',
  },
  'dashboard.total_bds': {
    title: 'Total BDs',
    body: 'Count of users with BD role. Not date-filtered.',
    timezone: 'none',
    source: 'User.role',
  },
  'dashboard.total_agencies': {
    title: 'Total agencies',
    body: 'Count of users with agency role. Not date-filtered.',
    timezone: 'none',
    source: 'User.role',
  },
  'dashboard.revenue_chart': {
    title: 'Call revenue chart',
    body: 'Daily coins deducted from user-side calls, bucketed by IST calendar day.',
    timezone: 'header_range',
    source: 'CallHistory.coinsDeducted',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.live_calls_feed': {
    title: 'Live calls feed',
    body: 'Recent active or recently ended user-side calls. Refreshes on a short interval.',
    timezone: 'realtime',
    source: 'CallHistory',
    filterScope: 'Live / recent',
  },
  'dashboard.top_hosts': {
    title: 'Top hosts',
    body: 'Creators ranked by call volume or earnings in the header IST range.',
    timezone: 'header_range',
    source: 'CallHistory (creator side)',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.top_bds': {
    title: 'Top BDs',
    body: 'Business developers ranked by attributed activity in the header IST range.',
    timezone: 'header_range',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.top_agencies': {
    title: 'Top agencies',
    body: 'Agencies ranked by attributed activity in the header IST range.',
    timezone: 'header_range',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.call_analytics': {
    title: 'Call analytics',
    body: 'Answered vs missed calls and daily volume. Range summary follows header IST filter; daily bars use IST day buckets.',
    timezone: 'header_range',
    source: 'CallHistory (ownerRole=user)',
    filterScope: 'Header date filter (IST)',
  },
  'dashboard.payouts_table': {
    title: 'Pending payouts table',
    body: 'Latest pending withdrawal requests, optionally filtered by header IST range on requestedAt.',
    timezone: 'header_range',
    source: 'Withdrawal',
    filterScope: 'Header date filter (IST) when set',
  },
  'dashboard.razorpay_balance': {
    title: 'Razorpay balance',
    body: 'Live snapshot from Razorpay API. Not tied to IST day or header filter.',
    timezone: 'realtime',
    source: 'Razorpay balance API',
    filterScope: 'Live API snapshot',
  },
  'dashboard.razorpay_collected_amount': {
    title: 'Razorpay Collected Amount',
    body: 'Gross amount from Razorpay payments with captured=true in the selected period. Refunded captured payments remain included. All time uses the durable projection and is visibly partial until its historical backfill completes. This is not the available balance, fee-adjusted settlement, or amount deposited in the bank.',
    timezone: 'header_range',
    source: 'Razorpay Payments API (payment.created_at)',
    filterScope: 'Header date filter (exact half-open IST range)',
  },
  'dashboard.alerts': {
    title: 'Alerts',
    body: 'Operational alerts (fraud signals, urgent support). Mostly live counts.',
    timezone: 'realtime',
  },

  // ── Users ──
  'users.page': {
    title: 'Users',
    body: 'End-user cohorts. First-time means accounts created in the selected range; Relogin means pre-range accounts with auth synchronization activity in the range.',
    timezone: 'header_range',
    filterScope: 'Header date filter (IST)',
  },
  'users.website.page': {
    title: 'Website users',
    body: 'Forward-only website attribution from explicit web auth claims. Created on website and pre-existing then website are immutable audience categories; activity before tracking began cannot be reconstructed.',
    timezone: 'header_range',
    source: 'User website attribution fields / UserLoginEvent',
    filterScope: 'Header date filter on websiteAudienceSince (IST)',
  },
  'users.website.visits': {
    title: 'Website visits',
    body: 'Anonymous homepage traffic only — login is not required. Each browser gets a local visitor ID; the same browser counts once per IST calendar day (100 opens the same day = 1; Mon + Tue = 2). Not the same as Website users (auth sync).',
    timezone: 'header_range',
    source: 'WebsiteHomepageVisitDay',
    filterScope: 'Header date filter on IST day keys; count rows (visitor × day)',
  },
  'users.table.user': {
    title: 'User',
    body: 'Display name, email, or phone for the end user.',
    source: 'User',
  },
  'users.table.role': {
    title: 'Role',
    body: 'Account role. This page lists role=user only.',
    source: 'User.role',
  },
  'users.table.referral': {
    title: 'Referral',
    body: 'Referral code or referrer edge if present.',
    source: 'ReferralEdge / User',
  },
  'users.table.balance': {
    title: 'Balance',
    body: 'Current wallet coin balance.',
    source: 'User.coins',
  },
  'users.table.spent': {
    title: 'Spent',
    body: 'Lifetime coins spent (calls, purchases, etc.).',
    source: 'User aggregate / CoinTransaction',
  },
  'users.table.credited': {
    title: 'Credited',
    body: 'Lifetime coins credited to wallet.',
    source: 'CoinTransaction credits',
  },
  'users.table.calls': {
    title: 'Calls',
    body: 'Total user-side call count for this user.',
    source: 'CallHistory',
  },
  'users.table.joined': {
    title: 'Joined',
    body: 'Account creation timestamp. Header filter applies to this field when set.',
    timezone: 'header_range',
    source: 'User.createdAt',
    filterScope: 'Header date filter (IST)',
  },
  'users.totals.page': {
    title: 'User analytics',
    body: 'Signup and login trends using IST calendar days. KPI counts use IST today / 7d / 30d windows independent of header filter.',
    timezone: 'IST',
  },
  'users.signups_today': {
    title: 'Signups today',
    body: 'New end-user accounts created since IST midnight today.',
    timezone: 'IST',
    source: 'User.createdAt (role=user)',
  },
  'users.signups_7d': {
    title: 'Signups (7d)',
    body: 'New end-user signups in the last 7 IST calendar days including today.',
    timezone: 'IST',
    source: 'User.createdAt (role=user)',
  },
  'users.signups_30d': {
    title: 'Signups (30d)',
    body: 'New end-user signups in the last 30 IST calendar days including today.',
    timezone: 'IST',
    source: 'User.createdAt (role=user)',
  },
  'users.total_users': {
    title: 'Total users',
    body: 'All-time count of end-user accounts.',
    timezone: 'none',
    source: 'User (role=user)',
  },
  'users.signups_chart': {
    title: 'User signups chart',
    body: 'New end-user registrations per IST hour (48h) or IST day. Not comparable to login counts.',
    timezone: 'IST',
    source: 'User.createdAt',
  },
  'users.logins_chart': {
    title: 'User logins chart',
    body: 'Unique users with at least one login per IST day/week/month. Includes returning users.',
    timezone: 'IST',
    source: 'UserLoginEvent.loggedInAt',
  },

  // ── Finance ──
  'finance.wallet_transactions': {
    title: 'Wallet transactions',
    body: 'Ledger of coin credits and debits. Filtered by header IST range on createdAt when set.',
    timezone: 'header_range',
    source: 'CoinTransaction',
    filterScope: 'Header date filter (IST)',
  },
  'finance.payments': {
    title: 'Finance payments',
    body: 'Payment gateway recharge records and related finance data.',
    timezone: 'header_range',
    filterScope: 'Header date filter (IST)',
  },
  'finance.payouts': {
    title: 'Finance payouts',
    body: 'Processed withdrawal payouts summarized by IST period preset.',
    timezone: 'IST',
    source: 'Withdrawal.processedAt',
  },
  'finance.coins_paid_users': {
    title: 'Coin recharge paid users',
    body: 'Users who completed payment-gateway recharges. Today/7d/30d use IST calendar windows.',
    timezone: 'IST',
    source: 'CoinTransaction (payment_gateway credit)',
  },
  'finance.moments_paid_users': {
    title: 'Moments paid users',
    body: 'Users who purchased moments with coins or VIP discount.',
    timezone: 'IST',
    source: 'MomentPurchase',
  },
  'finance.vip_paid_users': {
    title: 'VIP paid users',
    body: 'VIP membership purchases and active members.',
    timezone: 'IST',
    source: 'VipMembership / CoinTransaction',
  },
  'finance.moments_premium': {
    title: 'Moments premium users',
    body: 'Moments premium membership subscribers.',
    timezone: 'IST',
    source: 'MomentsPremiumMembership',
  },
  'finance.payment_error_check': {
    title: 'Payment error check',
    body: 'Scans Razorpay captured wallet payments in a custom time range (default past 24h) and flags payments that did not credit coins in Mongo. Captures that were credited then had the account deleted show under Got coins as “credited (user/ledger deleted)”, not as Paid no coins.',
    timezone: 'header_range',
    source: 'Razorpay payments + CoinTransaction + CheckoutContext',
    filterScope: 'Page from/to range (IST inputs, UTC compare)',
  },

  // ── Hosts ──
  'hosts.bds': {
    title: 'Business developers',
    body: 'BD staff accounts and management.',
    timezone: 'none',
    source: 'User (BD roles)',
  },
  'hosts.agencies': {
    title: 'Agencies',
    body: 'Agency staff accounts.',
    timezone: 'none',
    source: 'User (agency role)',
  },
  'hosts.creators': {
    title: 'Creators',
    body: 'Host/creator profiles and earnings.',
    timezone: 'header_range',
    filterScope: 'Header date filter (IST) where applicable',
  },
  'hosts.creator-referrals': {
    title: 'Creators referrals',
    body: 'Creator affiliate codes (CR-…), referred user progress (Telegram + video call), and coin rewards paid to creators.',
    timezone: 'header_range',
    filterScope: 'Live config; list is not date-filtered',
  },
  'hosts.blocked': {
    title: 'Blocked hosts',
    body: 'Creators blocked from the platform.',
    timezone: 'none',
    source: 'Creator block status',
  },
  'hosts.leaderboards': {
    title: 'Leaderboards',
    body: 'Rankings for hosts and users by calls, talk time, recharge, etc. Period windows use IST calendar days.',
    timezone: 'IST',
    filterScope: 'Selected period (IST)',
  },

  // ── Calls ──
  'calls.page': {
    title: 'Calls & billing',
    body: 'Call history with billing details. Header IST range filters createdAt.',
    timezone: 'header_range',
    source: 'CallHistory',
    filterScope: 'Header date filter (IST)',
  },
  'calls.table.duration': {
    title: 'Duration',
    body: 'Call length in seconds.',
    source: 'CallHistory.durationSeconds',
  },
  'calls.table.coins_deducted': {
    title: 'Coins deducted',
    body: 'Coins charged to the user for this call.',
    source: 'CallHistory.coinsDeducted',
  },
  'calls.table.coins_earned': {
    title: 'Coins earned',
    body: 'Coins credited to the creator for this call.',
    source: 'CallHistory.coinsEarned',
  },
  'calls.table.created': {
    title: 'Created',
    body: 'When the call record was created.',
    timezone: 'header_range',
    source: 'CallHistory.createdAt',
    filterScope: 'Header date filter (IST)',
  },

  // ── Revenue ──
  'revenue.analytics': {
    title: 'Revenue analytics',
    body: 'Platform revenue views and trends using IST day buckets where daily.',
    timezone: 'header_range',
    filterScope: 'Header date filter (IST)',
  },
  'revenue.split': {
    title: 'Revenue split',
    body: 'Actual vs policy revenue split by host, BD, agency, platform. Lookback uses IST calendar days.',
    timezone: 'IST',
    source: 'CallHistory / StaffWalletLedger',
  },

  // ── Monitoring / content / settings ──
  'monitoring.support': {
    title: 'Support tickets',
    body: 'User and host support requests.',
    timezone: 'realtime',
  },
  'monitoring.system_health': {
    title: 'System health',
    body: 'Infrastructure and service health checks.',
    timezone: 'realtime',
  },
  'content.moments_rewards': {
    title: 'Moment upload rewards',
    body: 'Rewards configuration for moment uploads.',
    timezone: 'none',
  },
  'content.moments_preview': {
    title: 'Moments free preview',
    body: 'Free preview settings for moments content.',
    timezone: 'none',
  },
  'content.moments_gallery': {
    title: 'All moments',
    body: 'Gallery of all creator moments with optional upload-reward clawback on admin delete.',
    timezone: 'none',
  },
  'settings.page': {
    title: 'Settings',
    body: 'Platform configuration for super admins.',
    timezone: 'none',
  },

  // ── Legacy overview ──
  'legacy.overview': {
    title: 'Overview (legacy)',
    body: 'Legacy dashboard metrics. Fixed 7d/30d windows use IST calendar days.',
    timezone: 'IST',
  },
  'legacy.users_total': {
    title: 'Total users',
    body: 'All end-user accounts.',
    source: 'User (role=user)',
  },
  'legacy.creators_total': {
    title: 'Total creators',
    body: 'All creator/host accounts.',
    source: 'Creator / User',
  },
  'legacy.calls_7d': {
    title: 'Calls (7d)',
    body: 'User-side calls in the last 7 IST calendar days.',
    timezone: 'IST',
    source: 'CallHistory',
  },
  'legacy.revenue_30d': {
    title: 'Revenue (30d)',
    body: 'Coins spent on calls in the last 30 IST calendar days.',
    timezone: 'IST',
    source: 'CallHistory.coinsDeducted',
  },
};

export function getMetricHelp(key: string): MetricHelpContent | undefined {
  return SUPERADMIN_METRIC_HELP[key];
}

export function requireMetricHelp(key: string): MetricHelpContent {
  const help = SUPERADMIN_METRIC_HELP[key];
  if (!help) {
    return {
      title: key,
      body: 'No help text defined for this metric yet.',
    };
  }
  return help;
}
