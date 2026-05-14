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
import OverviewPage from './pages/OverviewPage';
import CreatorsPage from './pages/CreatorsPage';
import UsersPage from './pages/UsersPage';
import CoinsPage from './pages/CoinsPage';
import CallsPage from './pages/CallsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import SupportPage from './pages/SupportPage';
import SystemPage from './pages/SystemPage';
import AgenciesManagePage from './pages/AgenciesManagePage';
import BdsManagePage from './pages/BdsManagePage';
import SuperAdminDashboardPage from './pages/dashboard/SuperAdminDashboardPage';
import StubPage from './pages/StubPage';
import BdLoginPage from './pages/bd/BdLoginPage';
import BdHomePage from './pages/bd/BdHomePage';
import BdAgenciesPage from './pages/bd/BdAgenciesPage';
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

  return <>{children}</>;
};
const UnknownRouteRedirect: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/bd')) {
    return <Navigate to="/bd/login" replace />;
  }
  if (isAgencyPortalPath(pathname) || pathname.startsWith('/agent')) {
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
    pathname === '/agency' ||
    pathname.startsWith('/agency/') ||
    pathname === '/agent/login' ||
    pathname.startsWith('/agent/');

  const onBdApp =
    pathname === '/bd/login' ||
    pathname === '/bd' ||
    pathname.startsWith('/bd/');

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
      <Route path="/agent/login" element={<Navigate to="/agency/login" replace />} />
      {/* One-release bookmark support for old middle-tier /agent URLs — remove next release */}
      <Route path="/agent/*" element={<AgentRouteAliasRedirect />} />

      <Route
        path="/login"
        element={adminUser ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/bd/login"
        element={bdUser ? <Navigate to="/bd" replace /> : <BdLoginPage />}
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
        <Route path="overview" element={<OverviewPage />} />
        <Route path="dashboard" element={<SuperAdminDashboardPage />} />
        <Route path="creators" element={<CreatorsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="coins" element={<CoinsPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="bds" element={<BdsManagePage />} />
        <Route path="agencies" element={<AgenciesManagePage />} />
        <Route
          path="blocked-users"
          element={
            <StubPage title="Blocked users" relatedTo={{ label: 'Open users', href: '/users' }} />
          }
        />
        <Route
          path="kyc"
          element={<StubPage title="KYC verification" relatedTo={{ label: 'Open hosts (creators)', href: '/creators' }} />}
        />
        <Route
          path="analytics/revenue"
          element={<StubPage title="Revenue analytics" relatedTo={{ label: 'Coins & economy', href: '/coins' }} />}
        />
        <Route
          path="leaderboards"
          element={<StubPage title="Leaderboards" relatedTo={{ label: 'Creators performance', href: '/creators' }} />}
        />
        <Route
          path="settlements"
          element={<StubPage title="Settlements" relatedTo={{ label: 'Withdrawals', href: '/withdrawals' }} />}
        />
        <Route
          path="revenue-split"
          element={<StubPage title="Revenue split" relatedTo={{ label: "Platform revenue", href: '/system' }} />}
        />
        <Route path="call-logs" element={<CallsPage />} />
        <Route
          path="fraud"
          element={
            <StubPage
              title="Fraud detection"
              description="Use system health and support for investigations."
              relatedTo={{ label: 'System health', href: '/system' }}
            />
          }
        />
        <Route
          path="quality"
          element={<StubPage title="Quality monitoring" relatedTo={{ label: 'Support tickets', href: '/support' }} />}
        />
        <Route
          path="incentives/rules"
          element={<StubPage title="Incentive rules" />}
        />
        <Route
          path="incentives/tracking"
          element={<StubPage title="Incentive tracking" />}
        />
        <Route
          path="commission"
          element={<StubPage title="Commission settings" relatedTo={{ label: 'System / platform', href: '/system' }} />}
        />
        <Route path="system-logs" element={<SystemPage />} />
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
