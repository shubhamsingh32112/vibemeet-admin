import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AgentCreatorDetailPage from './pages/agent/AgentCreatorDetailPage';
import AgentWithdrawalsPage from './pages/agent/AgentWithdrawalsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
        <Route path="creators/:creatorId" element={<AgentCreatorDetailPage />} />
        <Route path="withdrawals" element={<AgentWithdrawalsPage />} />
      </Route>

      <Route
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
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
