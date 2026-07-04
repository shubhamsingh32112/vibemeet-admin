import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BdAuthProvider, useBdAuth } from './contexts/BdAuthContext';
import { AgencyAuthProvider, useAgencyAuth } from './contexts/AgencyAuthContext';
import Login from './components/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import BdDashboardLayout from './components/layout/BdDashboardLayout';
import AgencyDashboardLayout from './components/layout/AgencyDashboardLayout';
import CreatorsPage from './pages/CreatorsPage';
import UsersPage from './pages/UsersPage';
import CallsPage from './pages/CallsPage';
import SupportPage from './pages/SupportPage';
import AgenciesManagePage from './pages/AgenciesManagePage';
import BdsManagePage from './pages/BdsManagePage';
import BdDetailPage from './pages/BdDetailPage';
import AgencyDetailPage from './pages/AgencyDetailPage';
import SuperAdminDashboardPage from './pages/dashboard/SuperAdminDashboardPage';
import StubPage from './pages/StubPage';
import BlockedHostsPage from './pages/BlockedHostsPage';
import RevenueSplitPage from './pages/RevenueSplitPage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import UserTotalsPage from './pages/users/UserTotalsPage';
import MomentsPaidUsersPage from './pages/users/MomentsPaidUsersPage';
import VipPaidUsersPage from './pages/users/VipPaidUsersPage';
import CoinsPaidUsersPage from './pages/users/CoinsPaidUsersPage';
import WalletTransactionsPage from './pages/finance/WalletTransactionsPage';
import FinancePaymentsPage from './pages/finance/FinancePaymentsPage';
import PaymentLogsPage from './pages/finance/PaymentLogsPage';
import MomentsPremiumUsersPage from './pages/finance/MomentsPremiumUsersPage';
import FinancePayoutsPage from './pages/finance/FinancePayoutsPage';
import BdStaffWithdrawalsPage from './pages/finance/BdStaffWithdrawalsPage';
import AgencyStaffWithdrawalsPage from './pages/finance/AgencyStaffWithdrawalsPage';
import RevenueAnalyticsPage from './pages/revenue/RevenueAnalyticsPage';
import SystemHealthPage from './pages/monitoring/SystemHealthPage';
import SettingsPage from './pages/settings/SettingsPage';
import MomentsFreePreviewPage from './pages/moments/MomentsFreePreviewPage';
import MomentUploadRewardsPage from './pages/moments/MomentUploadRewardsPage';
import AdminCreatorViewPage from './pages/AdminCreatorViewPage';
import BdHostDetailPage from './pages/bd/BdHostDetailPage';
import BdLoginPage from './pages/bd/BdLoginPage';
import BdHomePage from './pages/bd/BdHomePage';
import BdAgenciesPage from './pages/bd/BdAgenciesPage';
import BdChangePasswordPage from './pages/bd/BdChangePasswordPage';
import BdWalletPage from './pages/bd/BdWalletPage';
import BdHostsPage from './pages/bd/BdHostsPage';
import AgencyLoginPage from './pages/agency/AgencyLoginPage';
import AgencyHomePage from './pages/agency/AgencyHomePage';
import AgencyReferredUsersPage from './pages/agency/AgencyReferredUsersPage';
import AgencyCreatorsPage from './pages/agency/AgencyCreatorsPage';
import AgencyCreatorViewPage from './pages/agency/AgencyCreatorViewPage';
import AgencyCreatorEditPage from './pages/agency/AgencyCreatorEditPage';
import AgencyWithdrawalsPage from './pages/agency/AgencyWithdrawalsPage';
import AgencyChangePasswordPage from './pages/agency/AgencyChangePasswordPage';
import AgencyProfilePage from './pages/agency/AgencyProfilePage';
import AgencySupportPage from './pages/agency/AgencySupportPage';
import AgencyWalletPage from './pages/agency/AgencyWalletPage';

/** True for `/agency` app routes (not admin `/agencies` management). */
function isAgencyPortalPath(pathname: string): boolean {
  if (pathname === '/agency' || pathname.startsWith('/agency/')) {
    return pathname !== '/agency/login';
  }
  return false;
}

/** True for `/bd` app routes (not admin `/bds` management). */
function isBdPortalPath(pathname: string): boolean {
  if (pathname === '/bd' || pathname.startsWith('/bd/')) {
    return pathname !== '/bd/login';
  }
  return false;
}

/** Legacy middle-tier URLs (/agent, not admin /agents). */
function isLegacyAgentPortalPath(pathname: string): boolean {
  return pathname === '/agent' || pathname.startsWith('/agent/');
}

function loginRedirectForPath(pathname: string): string {
  if (isBdPortalPath(pathname)) return '/bd/login';
  if (isAgencyPortalPath(pathname)) return '/agency/login';
  return '/login';
}

const AgentRouteAliasRedirect: React.FC = () => {
  const loc = useLocation();
  const to = `${loc.pathname.replace(/^\/agent/, '/agency')}${loc.search}`;
  return <Navigate to={to} replace />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    const to = loginRedirectForPath(pathname);
    return <Navigate to={to} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400">You need admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AgencyProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAgency, loading } = useAgencyAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/agency/login" replace />;
  }

  if (!isAgency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <p className="text-red-400 text-center">Agency portal access required.</p>
      </div>
    );
  }

  if (user.mustChangePassword && pathname !== '/agency/change-password') {
    return <Navigate to="/agency/change-password" replace />;
  }

  return <>{children}</>;
};

const BdProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isBd, loading } = useBdAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/bd/login" replace />;
  }

  if (!isBd) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <p className="text-red-400 text-center">BD access required.</p>
      </div>
    );
  }

  if (user.mustChangePassword && pathname !== '/bd/change-password') {
    return <Navigate to="/bd/change-password" replace />;
  }

  return <>{children}</>;
};
const UnknownRouteRedirect: React.FC = () => {
  const { pathname } = useLocation();
  if (isBdPortalPath(pathname)) {
    return <Navigate to="/bd/login" replace />;
  }
  if (isAgencyPortalPath(pathname) || isLegacyAgentPortalPath(pathname)) {
    return <Navigate to="/agency/login" replace />;
  }
  return <Navigate to="/" replace />;
};

const AppRoutes: React.FC = () => {
  const { pathname } = useLocation();
  const { user: adminUser, loading: adminLoading } = useAuth();
  const { user: agencyUser, loading: agencyLoading } = useAgencyAuth();
  const { user: bdUser, loading: bdLoading } = useBdAuth();

  const onAgencyApp =
    pathname === '/agency/login' ||
    isAgencyPortalPath(pathname) ||
    isLegacyAgentPortalPath(pathname);

  const onBdApp = pathname === '/bd/login' || isBdPortalPath(pathname);

  const blockingLoading = onBdApp ? bdLoading : onAgencyApp ? agencyLoading : adminLoading;

  if (blockingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/agents" element={<Navigate to="/bds" replace />} />
      <Route path="/agents/*" element={<Navigate to="/bds" replace />} />
      <Route path="/agent/login" element={<Navigate to="/agency/login" replace />} />
      {/* One-release bookmark support for old middle-tier /agent URLs — remove next release */}
      <Route path="/agent/*" element={<AgentRouteAliasRedirect />} />

      <Route
        path="/login"
        element={adminUser ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/bd/login"
        element={
          bdUser ? (
            <Navigate
              to={bdUser.mustChangePassword ? '/bd/change-password' : '/bd'}
              replace
            />
          ) : (
            <BdLoginPage />
          )
        }
      />
      <Route
        path="/agency/login"
        element={
          agencyUser ? (
            <Navigate
              to={agencyUser.mustChangePassword ? '/agency/change-password' : '/agency'}
              replace
            />
          ) : (
            <AgencyLoginPage />
          )
        }
      />

      <Route
        path="/bd"
        element={
          <BdProtectedRoute>
            <BdDashboardLayout />
          </BdProtectedRoute>
        }
      >
        <Route index element={<BdHomePage />} />
        <Route path="agencies" element={<BdAgenciesPage />} />
        <Route path="hosts" element={<BdHostsPage />} />
        <Route path="hosts/:creatorId" element={<BdHostDetailPage />} />
        <Route path="wallet" element={<BdWalletPage />} />
        <Route path="change-password" element={<BdChangePasswordPage />} />
      </Route>

      <Route
        path="/agency"
        element={
          <AgencyProtectedRoute>
            <AgencyDashboardLayout />
          </AgencyProtectedRoute>
        }
      >
        <Route index element={<AgencyHomePage />} />
        <Route path="referred" element={<AgencyReferredUsersPage />} />
        <Route path="creators" element={<AgencyCreatorsPage />} />
        <Route path="creators/:creatorId/edit" element={<AgencyCreatorEditPage />} />
        <Route path="creators/:creatorId" element={<AgencyCreatorViewPage />} />
        <Route path="withdrawals" element={<AgencyWithdrawalsPage />} />
        <Route path="wallet" element={<AgencyWalletPage />} />
        <Route path="profile" element={<AgencyProfilePage />} />
        <Route path="support" element={<AgencySupportPage />} />
        <Route path="change-password" element={<AgencyChangePasswordPage />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboardPage />} />
        <Route path="dashboard" element={<SuperAdminDashboardPage />} />
        {/* User management */}
        <Route path="users/analytics" element={<UsersPage />} />
        <Route path="users/totals" element={<UserTotalsPage />} />
        <Route path="users/calls" element={<CallsPage />} />
        {/* Host management */}
        <Route path="hosts/bds" element={<BdsManagePage />} />
        <Route path="hosts/bds/:bdId" element={<BdDetailPage />} />
        <Route path="hosts/agencies" element={<AgenciesManagePage />} />
        <Route path="hosts/agencies/:agencyId" element={<AgencyDetailPage />} />
        <Route path="hosts/all" element={<CreatorsPage />} />
        <Route path="hosts/all/:creatorId" element={<AdminCreatorViewPage />} />
        <Route path="hosts/blocked" element={<BlockedHostsPage />} />
        <Route path="hosts/leaderboard" element={<LeaderboardsPage />} />
        {/* Finance */}
        <Route path="finance/payouts" element={<FinancePayoutsPage />} />
        <Route path="finance/payouts/bd" element={<BdStaffWithdrawalsPage />} />
        <Route path="finance/payouts/agency" element={<AgencyStaffWithdrawalsPage />} />
        <Route path="finance/wallet" element={<WalletTransactionsPage />} />
        <Route path="finance/paid-users/coins" element={<CoinsPaidUsersPage />} />
        <Route path="finance/paid-users/moments" element={<MomentsPaidUsersPage />} />
        <Route path="finance/paid-users/vip" element={<VipPaidUsersPage />} />
        <Route path="finance/payments/moments" element={<MomentsPremiumUsersPage />} />
        <Route path="finance/payments/logs" element={<PaymentLogsPage />} />
        <Route path="finance/payments/calls" element={<Navigate to="/finance/payments/logs" replace />} />
        <Route path="finance/payments/:kind" element={<FinancePaymentsPage />} />
        {/* Revenue */}
        <Route path="revenue" element={<RevenueAnalyticsPage />} />
        <Route path="incentives" element={<StubPage title="Incentive rules" description="Coming soon." />} />
        {/* Monitoring */}
        <Route path="monitoring/support" element={<SupportPage />} />
        <Route path="monitoring/health" element={<SystemHealthPage />} />
        <Route path="moments/free-previews" element={<MomentsFreePreviewPage />} />
        <Route path="moments/upload-rewards" element={<MomentUploadRewardsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Legacy redirects */}
        <Route path="overview" element={<Navigate to="/users/analytics" replace />} />
        <Route path="users" element={<Navigate to="/users/analytics" replace />} />
        <Route path="users/moments-paid" element={<Navigate to="/finance/paid-users/moments" replace />} />
        <Route path="users/coins-paid" element={<Navigate to="/finance/paid-users/coins" replace />} />
        <Route path="users/vip-paid" element={<Navigate to="/finance/paid-users/vip" replace />} />
        <Route path="creators" element={<Navigate to="/hosts/all" replace />} />
        <Route path="creators/:creatorId" element={<AdminCreatorViewPage />} />
        <Route path="coins" element={<Navigate to="/finance/wallet" replace />} />
        <Route path="calls" element={<Navigate to="/users/calls" replace />} />
        <Route path="call-logs" element={<Navigate to="/users/calls" replace />} />
        <Route path="withdrawals" element={<Navigate to="/finance/payouts" replace />} />
        <Route path="settlements" element={<Navigate to="/finance/payouts" replace />} />
        <Route path="support" element={<Navigate to="/monitoring/support" replace />} />
        <Route path="system" element={<Navigate to="/monitoring/health" replace />} />
        <Route path="bds" element={<Navigate to="/hosts/bds" replace />} />
        <Route path="bds/:bdId" element={<BdDetailPage />} />
        <Route path="agencies" element={<Navigate to="/hosts/agencies" replace />} />
        <Route path="agencies/:agencyId" element={<AgencyDetailPage />} />
        <Route path="blocked-hosts" element={<Navigate to="/hosts/blocked" replace />} />
        <Route path="blocked-users" element={<Navigate to="/hosts/blocked" replace />} />
        <Route path="leaderboards" element={<Navigate to="/hosts/leaderboard" replace />} />
        <Route path="revenue-split" element={<RevenueSplitPage />} />
        <Route path="analytics/revenue" element={<Navigate to="/revenue" replace />} />
        <Route path="incentives/rules" element={<Navigate to="/incentives" replace />} />
        <Route path="incentives/tracking" element={<Navigate to="/incentives" replace />} />
        <Route path="commission" element={<Navigate to="/settings" replace />} />
        <Route path="system-logs" element={<Navigate to="/monitoring/health" replace />} />
        <Route path="fraud" element={<Navigate to="/monitoring/health" replace />} />
        <Route path="quality" element={<Navigate to="/monitoring/support" replace />} />
        <Route path="kyc" element={<Navigate to="/hosts/all" replace />} />
      </Route>
      <Route path="*" element={<UnknownRouteRedirect />} />
    </Routes>
  );
};

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

  return (
    <Router basename={basename}>
      <AuthProvider>
        <BdAuthProvider>
          <AgencyAuthProvider>
            <div className="dark">
              <AppRoutes />
            </div>
          </AgencyAuthProvider>
        </BdAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
