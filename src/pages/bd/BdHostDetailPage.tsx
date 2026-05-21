import React from 'react';
import HostCreatorViewPage from '../HostCreatorViewPage';
import { bdPortalService } from '../../services/bdPortalService';

const BdHostDetailPage: React.FC = () => (
  <HostCreatorViewPage
    config={{
      backHref: '/bd/hosts',
      backLabel: 'Hosts',
      load: async (id) => {
        const d = await bdPortalService.getCreatorDetail(id);
        return {
          creator: d.creator,
          user: d.user,
          agencyLabel: d.agency.label,
        };
      },
    }}
  />
);

export default BdHostDetailPage;
