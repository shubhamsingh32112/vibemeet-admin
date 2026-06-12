import React from 'react';
import SystemHealthPanel from '../components/admin/system/SystemHealthPanel';
import AppUpdatePanel from '../components/admin/system/AppUpdatePanel';

/** Legacy full system page — health + app updates. Prefer split routes in super admin nav. */
const SystemPage: React.FC = () => (
  <div className="space-y-10">
    <SystemHealthPanel />
    <AppUpdatePanel />
  </div>
);

export default SystemPage;
