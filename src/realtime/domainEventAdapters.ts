import type { DashboardSection } from '../types/dashboardStale';

const DOMAIN_TO_SECTIONS: Record<string, DashboardSection[]> = {
  'billing:settled': ['revenue', 'calls'],
  'creator:status_changed': ['creators', 'realtime'],
  'creator:status': ['creators', 'realtime'],
  'withdrawal:created': ['withdrawals'],
  'withdrawal:requested': ['withdrawals'],
  'withdrawal:updated': ['withdrawals'],
  'support:changed': ['support'],
  'support:ticket_created': ['support'],
  'support:ticket_updated': ['support'],
  'wallet:pricing_updated': ['revenue'],
  wallet_pricing_updated: ['revenue'],
  'dashboard:data_changed': [],
  'metrics:refresh': ['overview', 'realtime'],
};

export function sectionsFromDomainEvent(
  type: string,
  affected?: DashboardSection[]
): DashboardSection[] {
  if (affected && affected.length > 0) return affected;
  return DOMAIN_TO_SECTIONS[type] ?? [];
}

export function hintForDomainEvent(type: string): string {
  switch (type) {
    case 'billing:settled':
      return 'New call revenue available';
    case 'creator:status_changed':
    case 'creator:status':
      return 'New creator activity available';
    case 'withdrawal:created':
    case 'withdrawal:requested':
    case 'withdrawal:updated':
      return 'Withdrawal queue updated';
    case 'support:changed':
    case 'support:ticket_created':
    case 'support:ticket_updated':
      return 'Support queue updated';
    case 'wallet:pricing_updated':
    case 'wallet_pricing_updated':
      return 'Pricing settings changed';
    default:
      return 'New updates available';
  }
}
