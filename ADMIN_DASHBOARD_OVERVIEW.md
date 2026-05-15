# Eazy Talks — Admin Dashboard: What's Actually Happening

> A complete walkthrough of this codebase: architecture, data flow, every page,
> what each one calls on the backend, and the full operational story.

This is a **React 19 + Vite + TypeScript + Tailwind** single-page app that powers
two separate operator portals against a backend at `VITE_API_BASE_URL`
(default `http://localhost:3000/api/v1`):

1. **Admin Console** (mounted at `/`) — full-platform operations: creators, users,
   coins, calls, withdrawals, support, BDs, agencies, system health.
2. **BD Portal** (mounted at `/bd`) — top-tier staff manage agency accounts under their BD.
3. **Agency Portal** (mounted at `/agency`) — middle-tier staff onboard creators and process payouts.
   Legacy `/agent/*` URLs redirect to `/agency/*`.

Underneath, the same backend serves both, but each portal uses its **own JWT,
its own axios client, and its own auth context**. They cannot impersonate each
other.

---

## 1. Top-level architecture

### Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + react-dom 19 |
| Routing | `react-router-dom` v7 (`BrowserRouter`) |
| Bundler | Vite 7 |
| Styling | Tailwind 3 + custom `admin-*` color tokens, dark mode default |
| HTTP | `axios` with two instances (`api`, `agentApi`) |
| Realtime | `socket.io-client` v4 (admin only, `/admin` namespace) |
| Storage | Firebase Storage SDK (only used for creator profile / gallery image uploads) |
| Icons | `lucide-react` |

### Two parallel auth realms

Both contexts mount globally in `App.tsx`:

```177:188:src/App.tsx
function App() {
  const basename =
    import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

  return (
    <Router basename={basename}>
      <AuthProvider>
        <AgentAuthProvider>
          <div className="dark">
            <AppRoutes />
          </div>
        </AgentAuthProvider>
      </AuthProvider>
    </Router>
  );
}
```

- **`AuthContext`** (admin) → stores `adminToken` + `adminUser` in `localStorage`,
  posts to `POST /auth/admin-login`, validates `role === 'admin'`.
- **`AgentAuthContext`** (agent) → stores `agentToken` + `agentUser`,
  posts to `POST /auth/agent-login`, validates `role === 'agent'`.

Each has its own `ProtectedRoute` wrapper that redirects to the right login:
- Admin pages → `/login`
- Agent pages → `/agent/login`

### Two axios clients, two interceptors

- `src/config/api.ts` → reads `adminToken`, attaches `Authorization: Bearer …`,
  on `401` it nukes the admin session and hard-redirects to `/login`.
- `src/config/agentApi.ts` → same pattern for `agentToken`, redirects to
  `/agent/login` on `401`.

This isolation matters: an admin session can't accidentally call an agent
endpoint with the wrong token, and vice versa.

### Realtime layer (admin only)

```22:31:src/contexts/AdminRealtimeContext.tsx
const ADMIN_EVENTS = [
  'billing:settled',
  'creator:status',
  'withdrawal:requested',
  'withdrawal:updated',
  'support:ticket_created',
  'support:ticket_updated',
  'wallet_pricing_updated',
  'metrics:refresh',
] as const;
```

`AdminRealtimeProvider` is mounted inside `DashboardLayout`. It opens a
Socket.IO connection to `<host>/admin` using the admin JWT and listens for
those 8 events. Any event simply increments a `refreshGeneration` counter via
`useState`. Pages that care subscribe via `useAdminRealtime()` and put
`refreshGeneration` in their `useEffect` deps — so a server push triggers a
**silent** re-fetch (no spinner, no flash). The only UI feedback is a small
"Live sync on / off" pill in the Overview header.

The agent portal does **not** have a realtime channel — it polls
`/agent/summary` every 45 seconds instead.

### Routing map

```104:170:src/App.tsx
const AppRoutes: React.FC = () => {
  const { pathname } = useLocation();
  const { user: adminUser, loading: adminLoading } = useAuth();
  const { user: agentUser, loading: agentLoading } = useAgentAuth();

  const onAgentApp =
    pathname === '/agent/login' ||
    pathname === '/agent' ||
    pathname.startsWith('/agent/');
  const blockingLoading = onAgentApp ? agentLoading : adminLoading;
```

The router decides which auth-loading state to block on based on the URL,
so the admin portal isn't held hostage by the agent context still resolving
(and vice versa). After that:

```
/login                          → admin Login page
/agent/login                    → agent Login page

/                               → Admin DashboardLayout (protected, role=admin)
  /          → OverviewPage
  /creators  → CreatorsPage
  /users     → UsersPage
  /coins     → CoinsPage
  /calls     → CallsPage
  /withdrawals → WithdrawalsPage
  /support   → SupportPage
  /system    → SystemPage
  /bds       → BdsManagePage      (admin manages BD accounts)
  /bds/:id   → BdDetailPage
  /agencies  → AgenciesManagePage
  /agencies/:id → AgencyDetailPage
  /agents    → redirects to /bds (legacy bookmark)

/bd                             → BD DashboardLayout (protected, role=bd)
/agency                         → Agency DashboardLayout (protected, role=agency)
/agent/*                        → redirects to /agency/* (legacy)

/agent                          → (removed) use /agency
  /          → AgentHomePage
  /referred  → AgentReferredUsersPage
  /creators  → AgentCreatorsPage
  /creators/:id        → AgentCreatorViewPage
  /creators/:id/edit   → AgentCreatorEditPage
  /withdrawals         → AgentWithdrawalsPage

*                               → smart 404 (sends agents to /agent/login,
                                  others to /)
```

### Layouts

- `DashboardLayout` (admin) wraps `Outlet` in `AdminRealtimeProvider` and
  renders `Sidebar`. The sidebar is fixed on `md+` and a slide-out drawer on
  mobile.
- `AgentDashboardLayout` (agent) is the same shape, sans realtime, with
  `AgentSidebar` showing the agent's referral code and email at the bottom.

### Date-range filter (shared primitive)

`useAdminDateRange` is the single source of truth for date filtering across
Overview, Users, Coins, Calls, Withdrawals, and Support. It is **URL-backed**
(`?drPreset=today&drFrom=…&drTo=…`), so date selections survive refresh and
can be shared via link.

Presets supported: `today`, `yesterday`, `today_yesterday`, `last7d`,
`last30d`, `custom`. Bounds are computed in **local time** (start of day → next
day midnight) then converted to ISO UTC before going to the backend.

---

## 2. The Admin Console (one section per sidebar item)

The sidebar:

```5:51:src/components/layout/Sidebar.tsx
const navItems = [
  { path: '/',            label: 'Overview',         icon: '📊' },
  { path: '/creators',    label: 'Creators',         icon: '🎓' },
  { path: '/users',       label: 'Users',            icon: '👥' },
  { path: '/coins',       label: 'Coins & Txns',     icon: '💰' },
  { path: '/calls',       label: 'Calls & Billing',  icon: '📞' },
  { path: '/withdrawals', label: 'Withdrawals',      icon: '💸' },
  { path: '/agents',      label: 'Agents',           icon: '🤝' },
  { path: '/support',     label: 'Support',          icon: '🛟' },
  { path: '/system',      label: 'System Health',    icon: '⚙️' },
];
```

Almost every page follows the same pattern: `useEffect` → call
`adminService.xxx(...)` → render with `MetricCard` / `DataTable` /
`StatusBadge` / `ConfirmDialog`. All admin requests funnel through
`src/services/adminService.ts`, which is the single typed client for the
`/admin/*` API surface.

### 2.1 Overview (`/`) — Operations cockpit

`OverviewPage` calls `GET /admin/overview?from=…&to=…` and renders four
"sections":

1. **Queues** — work that needs an operator: `pendingWithdrawals`,
   `openSupportTickets`, `highPriorityTickets`, `creatorsOnline`.
2. **Growth** — `totalUsers`, `creators`, signups in range (or 7d default),
   `onboarded` count + percentage.
3. **Coin economy snapshot** — `totalInCirculation`, net (range or today),
   net last-30d, welcome bonus claimed.
4. **Calls snapshot** — calls in range/today, calls last-30d, anomalies
   (`zeroDurationCalls + shortCalls`).

It also shows a "Creator availability" table when the backend returns
`creatorsOnlineToday[]` — name + how long they were online (formatted with a
local `formatOnlineSeconds` helper).

Realtime: any of the 8 admin events bumps the generation counter and the page
silently re-fetches (note `if (!silent) setLoading(true)` to avoid flicker).
Header shows live status pill plus the last `lastError` if the socket dropped.

### 2.2 Creators (`/creators`) — Performance + lifecycle

`CreatorsPage` calls `GET /admin/creators/performance` and gives admins a
**huge per-creator table**: name, online status, price, calls/min/earned in
30d, total earned, avg duration, earnings-per-minute, an `abuseSignals`
column, tasks claim/complete/total, balance.

Per-row actions:

- **Edit** → opens `CreatorEditModal` (uses `adminService.patchCreatorLinkedUser`
  + `creatorGalleryUpload/Commit/Delete/Reorder`). Lets admin change username,
  avatar, categories, and manage gallery images via signed Firebase upload URLs.
- **Force Offline** → `POST /admin/creators/:id/force-offline` (broadcasts
  `creator:status` over the admin socket).
- **Del** → `DELETE /creator/:id` via `creatorService`.

There is also a **Promote User → Creator** flow:

1. Operator opens a modal, searches the user database (`userService.search`,
   role filtered to `user`).
2. Picks a non-creator user.
3. Picks a price tier from the canonical list `[60, 90, 120]`
   (`CREATOR_PRICE_TIERS`, kept in sync with `ALLOWED_CREATOR_PRICES` on the
   backend).
4. App auto-fills name (username → email prefix → phone → "Creator"), photo
   (existing avatar or one of the male/female default Firebase URLs based on
   prefix), about text (`Hi, I am ${name}.`), and posts to
   `POST /user/:userId/promote-to-creator`.

Top of page shows quick stats: total, online, avg earned 30d, zero-call
creators, and flagged count.

### 2.3 Users (`/users`) — Analytics + ledger drill-down

`UsersPage` is the most powerful investigative tool in the dashboard.

**Filters** (all server-side):
- Date range (signups within range)
- Free-text search (name / email / phone)
- Role (`user | creator | admin | all`)
- Referrer agent (`GET /admin/agents/brief` is loaded once to populate this
  dropdown so support can ask "show me all users referred by agent X")
- Sort: recent / spent / calls / coins

The table renders 11 columns including avatar, role badge, referral info
(code used, referrer label, "(agent)" tag), balance, total spent / credited,
call counts, chat-channel summary (`Nch · F free / P paid`), welcome bonus
flag, and join date.

**Per-row actions**:

- **Ledger** → opens a modal that calls `GET /admin/users/:userId/ledger`.
  This is the forensic view: it shows the user header, creator profile (if
  any), summary card with `totalCredited / totalDebited / expectedBalance /
  actualBalance / discrepancy` (highlighted red when ≠ 0 — that's the
  primary cash-leak detector), the full transaction list, the full call
  history, and any chat quotas (free vs paid messages per channel).

- **Coins** → opens `ConfirmDialog` to call
  `POST /admin/users/:userId/adjust-coins` with `{ amount, reason }`. Both
  fields are validated client-side (non-zero amount, ≥5-char reason).
  Returns `{ transactionId, oldBalance, newBalance }` and alerts the operator.

### 2.4 Coins (`/coins`) — Economy console + wallet pricing editor

Two distinct sections sharing one page.

**(a) Wallet Tier Pricing** — a CRUD editor for the in-app coin packs
(`adminService.getWalletPricing` + `updateWalletPricing`). The table edits
`coins`, `tier1PriceInr`, `tier2PriceInr`, `oldPriceInr` (strikethrough),
`badge`, `sortOrder`, `isActive`. "Reset" reverts the draft to the saved
config; "+ Add Pack" pushes a new row; "Save Pricing" PUTs the array.
Last updated timestamp is shown.

**(b) Coin Economy** (`GET /admin/coins?from=…&to=…`) — five top metrics:
`In Circulation`, `All-Time Minted`, `All-Time Burned`, `Net Minted`, and a
**"Leak Check"** card that compares `totalInCirculation` to
`mintedAllTime - burnedAllTime`. If they differ, it shows
`⚠ Off by N` — that's a hard sign of accounting drift.

A "Show detailed analytics" toggle reveals:

- **Daily Coin Flow (30d)** — date, credited, debited, net, txn count, plus
  inline mini-bar charts.
- **Top Spenders / Top Earners (30d)** — ranked, with txn counts.
- **Recent Large Transactions (>50 coins)** — with a special
  `largeTransactionTypeBadge` helper that distinguishes a successful payment
  gateway purchase ("credit", green) from an attempted-but-incomplete one
  ("tried", amber).
- **Failed Transactions** (red banner, only shown if the array is non-empty).

### 2.5 Calls & Billing (`/calls`) — Per-call audit + refund tool

`GET /admin/calls?page&limit&anomaly&from&to` returns a paginated list of
calls plus anomaly flags (`isZeroDuration`, `isVeryShort`, `isSuspicious`,
`isRefunded`).

**Filters**: date range and an "Anomalies only" checkbox.

**Summary chips** above the table show counts of suspicious / zero-duration /
refunded calls in the current page.

**Refund flow** is the most carefully built modal in the dashboard:

1. User clicks **Refund** on an unrefunded call.
2. App fetches `GET /admin/calls/:callId/refund-preview`, which returns
   `RefundPreview { canRefund, blockReason, call, userImpact, creatorImpact }`.
3. Modal shows a clear before/after for both sides:
   - User: balance + refund delta in green
   - Creator clawback: balance − amount in red
4. If `canRefund === false`, the confirm button is disabled and the
   `blockReason` is shown in a red banner.
5. Otherwise the operator types a reason (≥5 chars) and confirms; app calls
   `POST /admin/calls/:callId/refund` with `{ reason }`. Returns the actual
   before/after for both balances and shows them in an alert.

This is the part of the dashboard most directly tied to "lost money" —
hence the explicit preview step rather than a one-shot button.

### 2.6 Withdrawals (`/withdrawals`) — Payout queue

`GET /admin/withdrawals?status&page&limit&from&to`. Shows a summary
strip (`pendingCount`, `totalWithdrawn30d`, total shown, top creator (30d))
and a paginated table.

For each row, columns include creator (name + email/phone), amount, current
balance (so the operator can sanity-check),
`status ∈ {pending, approved, rejected, paid}`, requested/processed
timestamps, full **withdrawal payout details** (name, phone, UPI, account,
IFSC), and notes.

Per-row actions depend on status:

- `pending` → **Approve** (`POST /admin/withdrawals/:id/approve`, deducts
  coins from creator) or **Reject** (`POST .../reject`, requires ≥3-char
  notes).
- `approved` → **Mark Paid** (`POST .../mark-paid`, confirms external
  payout completed).

The action confirm dialog shows current balance, withdrawal amount, and
projected balance after approval, plus the full payout details so the
operator pays the right account.

Realtime: subscribes to `refreshGeneration` so `withdrawal:requested` /
`withdrawal:updated` events trigger a silent reload.

A "Top Withdrawing Creators (30d)" leaderboard sits below the table when
the summary is non-empty.

### 2.7 Agents (`/agents`) — Manage referral-agent accounts

`AgentsManagePage` calls `GET /admin/agents` and shows a small table of
agent rows with: email, referral code (mono green), pending applications
(referred users awaiting promotion), active creators, pending withdrawals,
and a status toggle (`agentDisabled` flips via
`PATCH /admin/agents/:id`).

A form at the top creates a new agent via `POST /admin/agents` with
`{ email, password, displayName? }`. The backend assigns the referral code.

This is the **only** way agent accounts get provisioned.

### 2.8 Support (`/support`) — Ticket triage

`GET /admin/support?role&status&priority&source&creatorReports&page&limit&from&to`.

Quick tabs: "All Tickets" or "Creator Reports" (filters `creatorReportsOnly`).

Five summary cards: open user tickets, open creator tickets, high-priority
open, unassigned, aging > 24h.

Filters: date range, role (user/creator), status (open/in_progress/
resolved/closed), priority (low/medium/high/urgent), source (chat/post_call/
other).

Table columns: type (User/Creator badge), user, category, subject (clickable
to open detail), reported creator (when present), priority, status, created,
assigned, actions.

**View** opens a detailed modal with the full message, admin notes, related
call ID, source, reported creator name. "Update" opens a `ConfirmDialog`
that lets an admin change status and add `adminNotes` via
`PATCH /admin/support/:id/status`.

Subscribes to realtime: `support:ticket_created` and
`support:ticket_updated` re-fetch silently.

### 2.9 System Health (`/system`) — Ops + global app-update broadcaster

Two halves.

**(a) Health** (`GET /admin/system/health`):

- "All Systems Operational" / "Issues Detected" pill at the top.
- Service connectivity grid — each entry from `data.services` (DB, Redis,
  Firebase, etc.) with status + latencyMs + details (red on failure).
- Platform Activity metrics: online creators, transactions in the last 5m,
  calls in the last 1h, failed txns in 1h, **negative balance users**.
- Data Integrity: a callout for `negativeBalanceUsers` (must be 0) and a
  `balanceDiscrepancies` sample summary.
- Server: uptime (formatted human-readable), heap used/total, RSS.
- Optional auto-refresh every 15 s.

**(b) Global App Update Popup** — lets admins schedule an in-app update
notification:

- Form: heading, dynamic bullet points (add/remove), HTTPS update link
  (validated to start with `https://`).
- "Publish Global Update" → confirmation dialog → `POST /admin/app-updates/publish`
  with an `x-idempotency-key` header (`Date.now()-rand`) to dedupe accidental
  double clicks.
- The right column shows the **currently active** update
  (`GET /admin/app-updates/current`): version, publish time, title, points,
  link.

After publishing, both apps (user + creator) will receive the popup on next
launch — that's the broadcast mechanism.

---

## 3. The Agent Portal (`/agent/*`) — recruiter pod

A simpler 4-page mini-dashboard for referral agents who run their own pod
of creators. They see only **their** creators and **their** referred users,
enforced server-side via the agent JWT.

Sidebar:

```5:10:src/components/layout/AgentSidebar.tsx
const items = [
  { path: '/agent', label: 'Dashboard', icon: '📊', end: true },
  { path: '/agent/referred', label: 'Referred users', icon: '👥' },
  { path: '/agent/creators', label: 'Creators', icon: '🎓' },
  { path: '/agent/withdrawals', label: 'Withdrawals', icon: '💸' },
];
```

The sidebar footer always shows the agent's **referral code** (the value
they share offline to onboard new users) and their email.

All requests go through `agentApi` to `/agent/*` paths (and a few shared
`/admin/creators/:id/...` routes for gallery upload).

### 3.1 Dashboard (`/agent`)

`AgentHomePage` polls `GET /agent/summary` every 45s. Renders four metric
cards as `<Link>`s for one-tap navigation:

- "Awaiting promotion" → `/agent/referred`
- "Pending withdrawals" → `/agent/withdrawals`
- "Total creators" → `/agent/creators`
- "Creators online" (live availability)

### 3.2 Referred users (`/agent/referred`)

`GET /agent/referred-users?page&limit=30`. Shows everyone who signed up
with this agent's referral code, with two columns: code used (mono green)
and `hasCreator` flag. Two actions per non-creator row:

- **Promote to creator** → opens a modal where the agent supplies name (≥2),
  about (≥10), price tier from `[60,90,120]`, optional age/categories, and
  a main photo. The photo is compressed (`compressImage`) to ≤1024×1024,
  ≤350 KB JPEG, then uploaded to Firebase Storage at
  `creators/temp-add-{userId}/profile.jpg` via
  `uploadCreatorProfileImage`, and the resulting public URL is sent to
  `POST /agent/creators` with `{ userId, name, about, photo, price, ... }`.

- **Reject** → `POST /agent/referred-users/:id/reject` with optional
  reason. This unlinks the referral so the user can't be promoted by this
  agent unless they re-use the code.

If the row is already a creator, the actions collapse to a single
"View creator" link.

### 3.3 Creators (`/agent/creators`)

`GET /agent/creators?page&limit&period&sort&dir` where `period ∈ {today,
7d, 30d, all}`. Each row shows name, username, online/busy status, balance,
and **period-scoped** talk minutes / coins earned / call count, plus
all-time talk minutes and any pending withdrawal banner.

Sort options reflect the period: talk time, earnings, calls, name,
username, coins, lifetime earnings, all-time talk, online first, updatedAt.

Per-row actions: **View** (detail page), **Edit**, **Delete** (downgrades
to regular user via `DELETE /creator/:id` with confirm dialog).

The same "Add creator" modal as the Referred Users page is also accessible
here via the top-right button — but here the agent first searches users
through `GET /agent/search-users?q&limit` (which only returns
non-creators), then runs the same upload-and-create flow. After success,
the agent is navigated directly to `/agent/creators/:id/edit`.

### 3.4 Creator detail / edit (`/agent/creators/:id`, `/agent/creators/:id/edit`)

Backed by `GET /agent/creators/:creatorId?period=…` which returns
`AgentCreatorDetailData`: creator profile (name/about/photo/gallery/
categories/price/age/location/online), linked user info (username/email/
phone/coins/avatar/profileRevision), period earnings rollup,
`callStats { period* + allTime* }`, and any pending withdrawal.

Edit page lets the agent:

- Update the creator profile via `PUT /creator/:id` (name, about, photo,
  price tier, categories, age, location).
- Update linked-user fields (username, avatar, categories) via
  `PATCH /admin/creators/:id/user` (yes — the same endpoint admin uses,
  permitted to agents for their own pod).
- Manage the gallery via signed Firebase upload URLs:
  `creatorGalleryUploadUrl` → upload bytes → `creatorGalleryCommit` →
  `creatorGalleryDelete` / `creatorGalleryReorder`. Same shape as the
  admin's flow.

### 3.5 Withdrawals (`/agent/withdrawals`)

`GET /agent/withdrawals?status&page&limit`. Same approve / reject /
mark-paid actions as the admin (`POST /agent/withdrawals/:id/{approve|reject|mark-paid}`),
but scoped to the agent's pod only. Backend enforces the scope; the
frontend just renders the list and notes columns.

---

## 4. Service-layer cheat sheet

Where to look for each backend endpoint.

### `src/services/adminService.ts` (admin-only)

| Method | Endpoint |
|---|---|
| `getOverview({from,to})` | `GET /admin/overview` |
| `getCreatorsPerformance()` | `GET /admin/creators/performance` |
| `forceCreatorOffline(id)` | `POST /admin/creators/:id/force-offline` |
| `patchCreatorLinkedUser(id, body)` | `PATCH /admin/creators/:id/user` |
| `creatorGalleryUploadUrl/Commit/Delete/Reorder` | `/admin/creators/:id/gallery/...` |
| `getUsersAnalytics(filters)` | `GET /admin/users/analytics` |
| `listAgentsBrief()` | `GET /admin/agents/brief` |
| `transferCreatorToAgent(id, body)` | `POST /admin/creators/:id/transfer-agent` (idempotency-keyed) |
| `getUserLedger(userId)` | `GET /admin/users/:userId/ledger` |
| `adjustUserCoins(userId, amount, reason)` | `POST /admin/users/:userId/adjust-coins` |
| `getCoinEconomy({from,to})` | `GET /admin/coins` |
| `getWalletPricing()` / `updateWalletPricing(packs)` | `GET / PUT /admin/wallet-pricing` |
| `getCalls({page,limit,anomaly,from,to})` | `GET /admin/calls` |
| `refundCall(id, reason)` | `POST /admin/calls/:id/refund` |
| `getRefundPreview(id)` | `GET /admin/calls/:id/refund-preview` |
| `getSystemHealth()` | `GET /admin/system/health` |
| `getCurrentAppUpdate()` | `GET /admin/app-updates/current` |
| `publishAppUpdate(payload)` | `POST /admin/app-updates/publish` (idempotency-keyed) |
| `getWithdrawals(filters)` | `GET /admin/withdrawals` |
| `approveWithdrawal/rejectWithdrawal/markWithdrawalPaid` | `POST /admin/withdrawals/:id/...` |
| `getSupportTickets(filters)` | `GET /admin/support` |
| `updateTicketStatus(id, status, notes)` | `PATCH /admin/support/:id/status` |

Plus `AgentsManagePage` calls `GET /admin/agents`, `POST /admin/agents`,
and `PATCH /admin/agents/:id` directly via `api`.

### `src/services/creatorService.ts`

Generic creator CRUD against `/creator/:id` (used for delete in admin
Creators table and from the agent edit/delete flows).

### `src/services/userService.ts`

`search(query, role)` → `GET /user/search`
`promoteToCreator(userId, body)` → `POST /user/:userId/promote-to-creator`

### `src/services/agentPortalService.ts` (agent-only)

| Method | Endpoint |
|---|---|
| `getSummary()` | `GET /agent/summary` |
| `getReferredUsers()` | `GET /agent/referred-users` |
| `rejectReferredUser(id, reason)` | `POST /agent/referred-users/:id/reject` |
| `getCreators({period,sort,dir,page,limit})` | `GET /agent/creators` |
| `getCreatorDetail(id, period)` | `GET /agent/creators/:id` |
| `searchUsersForAgent(q)` | `GET /agent/search-users` |
| `createAgentCreator(body)` | `POST /agent/creators` |
| `deleteCreator(id)` | `DELETE /creator/:id` |
| `getWithdrawals/approve/reject/markPaid` | `/agent/withdrawals[/:id/...]` |
| `updateCreatorProfile(id, body)` | `PUT /creator/:id` |
| `patchCreatorUser(id, body)` | `PATCH /admin/creators/:id/user` |
| `creatorGalleryUploadUrl/Commit/Delete/Reorder` | `/admin/creators/:id/gallery/...` |

---

## 5. Cross-cutting patterns worth knowing

- **Money discipline** — Every coin-mutating action shows the previous
  balance and the projected new balance before confirming. Refund and
  user-coin-adjust both require a typed reason. Withdrawals require ≥3-char
  rejection reasons. This is intentional: this is a payments product.

- **Idempotency keys** — Two endpoints (`transfer-agent` and
  `app-updates/publish`) attach an `x-idempotency-key` header generated as
  `Date.now()-randomSuffix` so accidental double-clicks don't double-fire.

- **Silent vs loud refresh** — Realtime-driven re-fetches set a `silent`
  flag derived from `refreshGeneration > 0` so the page doesn't blink a
  spinner just because a websocket fired.

- **URL-driven filters** — Date range lives in `?drPreset / ?drFrom /
  ?drTo` query string, so links are shareable and refresh-safe. Other
  filters are component-local state.

- **Mobile** — Sidebar collapses to a slide-out drawer (`md:hidden`). Data
  tables can opt into a stacked-cards layout via `stackedOnMobile` (used
  on the Creators page). Several agent pages render explicit
  `md:hidden` card variants alongside the desktop tables.

- **401 hard-redirect** — Both axios clients clear local storage and
  navigate to the appropriate login when the backend rejects the token,
  so a stale session can never silently stay loaded.

- **Firebase is just for image uploads** — Despite the SDK being installed,
  Auth is **not** Firebase here; admin and agent both authenticate against
  custom backend endpoints and receive their own JWTs. Firebase Storage is
  used purely for `creators/{id}/profile.jpg` and gallery image bytes.

- **Single source of truth for prices** — `CREATOR_PRICE_TIERS = [60, 90,
  120]` is asserted to match `ALLOWED_CREATOR_PRICES` in the backend.
  Every price selector in both portals uses this constant.

---

## 6. Mental model in one paragraph

There's one Express/Node backend (not in this repo) that powers two web
apps in this Vite bundle — an **admin console** that does everything
across the platform (creators, users, coins, calls, withdrawals, support,
agents, system health, in-app update broadcasts) and a smaller **agent
portal** that gives referral agents a sandboxed view of their own pod
(referred users → promote to creator, manage their creators' profiles
and galleries, approve their pod's withdrawals). Both are React 19 SPAs
using axios + JWT in `localStorage`, separated by two parallel auth
contexts and two axios clients so they never cross-contaminate. The admin
side additionally listens on a Socket.IO `/admin` namespace for 8 named
events (`billing:settled`, `creator:status`, `withdrawal:requested`,
`withdrawal:updated`, `support:ticket_created/updated`,
`wallet_pricing_updated`, `metrics:refresh`) and silently re-fetches
whatever page is open. Everything cash-touching (refund, user-coin
adjust, withdrawal approve/reject, wallet pricing update, agent transfer)
goes through an explicit confirm dialog with before/after math. Date
filtering is unified through a URL-backed `useAdminDateRange` hook so any
range view is shareable. Image uploads hit Firebase Storage directly via
signed URLs — that's the only thing Firebase is doing here.
