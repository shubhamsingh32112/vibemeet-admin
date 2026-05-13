import React from 'react';
import agencyApi from '../../config/agencyApi';
import StaffSupportPage from '../../components/staff/StaffSupportPage';

const AgencySupportPage: React.FC = () => (
  <StaffSupportPage api={agencyApi} portalLabel="Agency" />
);

export default AgencySupportPage;
