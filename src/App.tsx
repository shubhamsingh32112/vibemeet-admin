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
import Login from './components/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import AgentDashboardLayout from './components/layout/AgentDashboardLayout';
import OverviewPage from './pages/OverviewPage';
import CreatorsPage from './pages/CreatorsPage';
import UsersPage from './pages/UsersPage';
import CoinsPage from './pages/CoinsPage';
import CallsPage from './pages/CallsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import SupportPage from './pages/SupportPage';
import SystemPage from './pages/SystemPage';
import AgentsManagePage from './pages/AgentsManagePage';
import AgentLoginPage from './pages/agent/AgentLoginPage';
import AgentHomePage from './pages/agent/AgentHomePage';
import AgentPendingPage from './pages/agent/AgentPendingPage';
import AgentCreatorsPage from './pages/agent/AgentCreatorsPage';
import AgentCreatorViewPage from './pages/agent/AgentCreatorViewPage';
import AgentCreatorEditPage from './pages/agent/AgentCreatorEditPage';
import AgentWithdrawalsPage from './pages/agent/AgentWithdrawalsPage';

/** Agent-facing URLs: unauthenticated users go to /agent/login (not admin /login). */
function isAgentPortalPath(pathname: string): boolean {
  if (pathname === '/agent' || pathname.startsWith('/agent/')) {
    return pathname !== '/agent/login';
  }
  return pathname === '/agents' || pathname.startsWith('/agents/');
}

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
    const to = isAgentPortalPath(pathname) ? '/agent/login' : '/login';
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
        <p className="text-red-400 text-center">Agent access required.</p>
      </div>
    );
  }

  return <>{children}</>;
};

const UnknownRouteRedirect: React.FC = () => {
  const { pathname } = useLocation();
  if (isAgentPortalPath(pathname)) {
    return <Navigate to="/agent/login" replace />;
  }
  return <Navigate to="/" replace />;
};

const AppRoutes: React.FC = () => {
  const { user: adminUser, loading: adminLoading } = useAuth();
  const { user: agentUser, loading: agentLoading } = useAgentAuth();

  if (adminLoading || agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={adminUser ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/agent/login"
        element={agentUser ? <Navigate to="/agent" replace /> : <AgentLoginPage />}
      />

      <Route
        path="/agent"
        element={
          <AgentProtectedRoute>
            <AgentDashboardLayout />
          </AgentProtectedRoute>
        }
      >
        <Route index element={<AgentHomePage />} />
        <Route path="pending" element={<AgentPendingPage />} />
        <Route path="creators" element={<AgentCreatorsPage />} />
        <Route path="creators/:creatorId/edit" element={<AgentCreatorEditPage />} />
        <Route path="creators/:creatorId" element={<AgentCreatorViewPage />} />
        <Route path="withdrawals" element={<AgentWithdrawalsPage />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="creators" element={<CreatorsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="coins" element={<CoinsPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="agents" element={<AgentsManagePage />} />
      </Route>
      <Route path="*" element={<UnknownRouteRedirect />} />
    </Routes>
  );
};

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

export default App;
