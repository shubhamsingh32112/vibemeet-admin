import React from 'react';
import agentApi from '../../config/agentApi';
import StaffWalletPage from '../../components/staff/StaffWalletPage';

const AgentWalletPage: React.FC = () => (
  <StaffWalletPage api={agentApi} basePath="/agent" portalLabel="BD" />
);

export default AgentWalletPage;
