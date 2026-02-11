import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-200">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
