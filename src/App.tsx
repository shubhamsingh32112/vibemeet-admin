import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AgentAuthProvider, useAgentAuth } from './contexts/AgentAuthContext';
import { AgencyAuthProvider, useAgencyAuth } from './contexts/AgencyAuthContext';
import Login from './components/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import AgentDashboardLayout from './components/layout/AgentDashboardLayout';
import AgencyDashboardLayout from './components/layout/AgencyDashboardLayout';
import OverviewPage from './pages/OverviewPage';
import CreatorsPage from './pages/CreatorsPage';
import UsersPage from './pages/UsersPage';
import CoinsPage from './pages/CoinsPage';
import CallsPage from './pages/CallsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import SupportPage from './pages/SupportPage';
import SystemPage from './pages/SystemPage';
import AgentsManagePage from './pages/AgentsManagePage';
import AgenciesManagePage from './pages/AgenciesManagePage';
import SuperAdminDashboardPage from './pages/dashboard/SuperAdminDashboardPage';
import StubPage from './pages/StubPage';
import AgentLoginPage from './pages/agent/AgentLoginPage';
import AgentHomePage from './pages/agent/AgentHomePage';
import AgentReferredUsersPage from './pages/agent/AgentReferredUsersPage';
import AgentCreatorsPage from './pages/agent/AgentCreatorsPage';
import AgentCreatorViewPage from './pages/agent/AgentCreatorViewPage';
import AgentCreatorEditPage from './pages/agent/AgentCreatorEditPage';
import AgentWithdrawalsPage from './pages/agent/AgentWithdrawalsPage';
import AgentProfilePage from './pages/agent/AgentProfilePage';
import AgentSupportPage from './pages/agent/AgentSupportPage';
import AgentWalletPage from './pages/agent/AgentWalletPage';
import AgencyLoginPage from './pages/agency/AgencyLoginPage';
import AgencyHomePage from './pages/agency/AgencyHomePage';
import AgencyBdsPage from './pages/agency/AgencyBdsPage';
import AgencyProfilePage from './pages/agency/AgencyProfilePage';
import AgencySupportPage from './pages/agency/AgencySupportPage';
import AgencyWalletPage from './pages/agency/AgencyWalletPage';

/** True for `/agent` app routes (not admin `/agents` management). */
function isAgentPortalPath(pathname: string): boolean {
  if (pathname === '/agent' || pathname.startsWith('/agent/')) {
    return pathname !== '/agent/login';
  }
  return false;
}

/** True for `/agency` app routes (not admin `/agencies` management). */
function isAgencyPortalPath(pathname: string): boolean {
  if (pathname === '/agency' || pathname.startsWith('/agency/')) {
    return pathname !== '/agency/login';
  }
  return false;
}

function loginRedirectForPath(pathname: string): string {
  if (isAgencyPortalPath(pathname)) return '/agency/login';
  if (isAgentPortalPath(pathname)) return '/agent/login';
  return '/login';
}

const BdRouteAliasRedirect: React.FC = () => {
  const loc = useLocation();
  const to = `${loc.pathname.replace(/^\/bd/, '/agent')}${loc.search}`;
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

const AgentProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAgent, loading } = useAgentAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/agent/login" replace />;
  }

  if (!isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <p className="text-red-400 text-center">BD portal access required.</p>
      </div>
    );
  }

  return <>{children}</>;
};

const AgencyProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAgency, loading } = useAgencyAuth();

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
        <p className="text-red-400 text-center">Agency access required.</p>
      </div>
    );
  }

  return <>{children}</>;
};

const UnknownRouteRedirect: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/agency')) {
    return <Navigate to="/agency/login" replace />;
  }
  if (isAgentPortalPath(pathname) || pathname.startsWith('/bd')) {
    return <Navigate to="/agent/login" replace />;
  }
  return <Navigate to="/" replace />;
};

const AppRoutes: React.FC = () => {
  const { pathname } = useLocation();
  const { user: adminUser, loading: adminLoading } = useAuth();
  const { user: agentUser, loading: agentLoading } = useAgentAuth();
  const { user: agencyUser, loading: agencyLoading } = useAgencyAuth();

  const onAgentApp =
    pathname === '/agent/login' ||
    pathname === '/agent' ||
    pathname.startsWith('/agent/') ||
    pathname === '/bd/login' ||
    pathname.startsWith('/bd/');

  const onAgencyApp =
    pathname === '/agency/login' ||
    pathname === '/agency' ||
    pathname.startsWith('/agency/');

  const blockingLoading = onAgentApp ? agentLoading : onAgencyApp ? agencyLoading : adminLoading;

  if (blockingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/bd/login" element={<Navigate to="/agent/login" replace />} />
      <Route path="/bd/*" element={<BdRouteAliasRedirect />} />

      <Route
        path="/login"
        element={adminUser ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/agent/login"
        element={agentUser ? <Navigate to="/agent" replace /> : <AgentLoginPage />}
      />
      <Route
        path="/agency/login"
        element={agencyUser ? <Navigate to="/agency" replace /> : <AgencyLoginPage />}
      />

      <Route
        path="/agency"
        element={
          <AgencyProtectedRoute>
            <AgencyDashboardLayout />
          </AgencyProtectedRoute>
        }
      >
        <Route index element={<AgencyHomePage />} />
        <Route path="bds" element={<AgencyBdsPage />} />
        <Route path="wallet" element={<AgencyWalletPage />} />
        <Route path="profile" element={<AgencyProfilePage />} />
        <Route path="support" element={<AgencySupportPage />} />
      </Route>

      <Route
        path="/agent"
        element={
          <AgentProtectedRoute>
            <AgentDashboardLayout />
          </AgentProtectedRoute>
        }
      >
        <Route index element={<AgentHomePage />} />
        <Route path="referred" element={<AgentReferredUsersPage />} />
        <Route path="creators" element={<AgentCreatorsPage />} />
        <Route path="creators/:creatorId/edit" element={<AgentCreatorEditPage />} />
        <Route path="creators/:creatorId" element={<AgentCreatorViewPage />} />
        <Route path="wallet" element={<AgentWalletPage />} />
        <Route path="withdrawals" element={<AgentWithdrawalsPage />} />
        <Route path="profile" element={<AgentProfilePage />} />
        <Route path="support" element={<AgentSupportPage />} />
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
        <Route path="agents" element={<AgentsManagePage />} />
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
        <AgentAuthProvider>
          <AgencyAuthProvider>
            <div className="dark">
              <AppRoutes />
            </div>
          </AgencyAuthProvider>
        </AgentAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
