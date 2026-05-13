import React from 'react';
import agentApi from '../../config/agentApi';
import StaffSupportPage from '../../components/staff/StaffSupportPage';

const AgentSupportPage: React.FC = () => (
  <StaffSupportPage api={agentApi} portalLabel="BD" />
);

export default AgentSupportPage;
