import React from 'react';
import { useParams } from 'react-router-dom';
import HostCreatorViewPage from './HostCreatorViewPage';
import { adminService } from '../services/adminService';

const AdminCreatorViewPage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();

  return (
    <HostCreatorViewPage
      config={{
        backHref: '/creators',
        backLabel: 'Creators',
        load: async (id) => {
          const d = await adminService.getCreatorDetail(id);
          return {
            creator: d.creator,
            user: d.user,
            assignedAgencyLabel: d.assignedAgencyLabel,
          };
        },
        extraMetrics: creatorId ? (
          <p className="text-xs text-zinc-500">
            Creator ID: <span className="font-mono text-zinc-400">{creatorId}</span>
          </p>
        ) : null,
      }}
    />
  );
};

export default AdminCreatorViewPage;
