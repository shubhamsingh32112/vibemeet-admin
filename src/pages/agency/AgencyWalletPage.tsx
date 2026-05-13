import React from 'react';
import agencyApi from '../../config/agencyApi';
import StaffWalletPage from '../../components/staff/StaffWalletPage';

const AgencyWalletPage: React.FC = () => (
  <StaffWalletPage api={agencyApi} basePath="/agency" portalLabel="Agency" />
);

export default AgencyWalletPage;
