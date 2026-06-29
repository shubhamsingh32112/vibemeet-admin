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

test('sidebar preserves global date range query params', () => {
  const src = read('src/components/admin/dashboard/SuperAdminSidebar.tsx');
  assert.ok(src.includes("for (const key of ['drPreset', 'drFrom', 'drTo'])"));
  assert.ok(src.includes('to={{ pathname: item.to, search: preservedSearch }}'));
});

test('calls page wires settlement retry UI', () => {
  const calls = read('src/pages/CallsPage.tsx');
  const adminService = read('src/services/adminService.ts');
  assert.ok(calls.includes('getSettlementRetryPreview'), 'calls page loads settlement preview');
  assert.ok(calls.includes('retryCallSettlement'), 'calls page retries settlement');
  assert.ok(calls.includes('canRetrySettlement'), 'calls page shows retryable rows');
  assert.ok(calls.includes('settlementIssue'), 'calls page shows settlement issues');
  assert.ok(adminService.includes('getSettlementRetryPreview'), 'admin service settlement preview');
  assert.ok(adminService.includes('retryCallSettlementBulk'), 'admin service bulk retry');
});
