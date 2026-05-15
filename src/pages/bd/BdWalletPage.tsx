import React from 'react';
import bdApi from '../../config/bdApi';
import StaffWalletPage from '../../components/staff/StaffWalletPage';

const BdWalletPage: React.FC = () => (
  <StaffWalletPage api={bdApi} basePath="/bd" portalLabel="BD" />
);

export default BdWalletPage;
