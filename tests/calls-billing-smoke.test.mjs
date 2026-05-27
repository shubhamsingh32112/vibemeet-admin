import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

test('dashboard page wires date range into all key queries', () => {
  const src = read('src/pages/dashboard/SuperAdminDashboardPage.tsx');
  assert.ok(src.includes('useAdminDateRange'), 'uses shared admin date hook');
  assert.ok(src.includes("queryKey: [DASH, 'overview', dashboardDateParams.from, dashboardDateParams.to]"));
  assert.ok(src.includes('fetchDashboardRevenue(14, dashboardDateParams)'));
  assert.ok(src.includes('fetchDashboardTopHosts(dashboardDateParams)'));
  assert.ok(src.includes('fetchDashboardTopBds(dashboardDateParams)'));
  assert.ok(src.includes('fetchDashboardTopAgencies(dashboardDateParams)'));
  assert.ok(src.includes('fetchDashboardCallAnalytics(dashboardDateParams)'));
  assert.ok(src.includes('fetchDashboardPayouts(dashboardDateParams)'));
});

test('calls and ops pages keep pagination/filter state in URL', () => {
  const calls = read('src/pages/CallsPage.tsx');
  const withdrawals = read('src/pages/WithdrawalsPage.tsx');
  const support = read('src/pages/SupportPage.tsx');
  const blocked = read('src/pages/BlockedHostsPage.tsx');
  assert.ok(calls.includes('useSearchParams'), 'calls page uses URL params');
  assert.ok(withdrawals.includes('useSearchParams'), 'withdrawals page uses URL params');
  assert.ok(support.includes('useSearchParams'), 'support page uses URL params');
  assert.ok(blocked.includes('useSearchParams'), 'blocked page uses URL params');
  assert.ok(calls.includes('updateListQuery({ page: 1 })'), 'calls resets page on filter/date changes');
  assert.ok(withdrawals.includes('updateListQuery({ page: 1 })'), 'withdrawals resets page on filter/date changes');
  assert.ok(support.includes('updateListQuery({ page: 1 })'), 'support resets page on filter/date changes');
});

test('sidebar preserves global date range query params', () => {
  const src = read('src/components/admin/dashboard/SuperAdminSidebar.tsx');
  assert.ok(src.includes("for (const key of ['drPreset', 'drFrom', 'drTo'])"));
  assert.ok(src.includes('to={{ pathname: item.to, search: preservedSearch }}'));
});
