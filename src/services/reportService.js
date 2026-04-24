  import api, { useMock } from './api';
import { reportData, tableRows } from '../mocks/damageReportData';
import { latestReports } from '../mocks/dashboardData';

/**
 * Get all damage reports (table list).
 * @param {{ status?: string, search?: string }} filters
 * @returns {Promise<Array>}
 */
export async function getReports(filters = {}) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));
    let data = [...tableRows];
    if (filters.status) data = data.filter((r) => r.status === filters.status);
    if (filters.search) data = data.filter((r) =>
      r.equip.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.operator.toLowerCase().includes(filters.search.toLowerCase())
    );
    return data;
  }

  const { data } = await api.get('/reports', { params: filters });
  return data;
}

/**
 * Get a single report's full detail.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getReportById(id) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const report = reportData[id];
    if (!report) throw new Error(`Report ${id} not found`);
    return report;
  }

  const { data } = await api.get(`/reports/${id}`);
  return data;
}

/**
 * Approve a damage report.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function approveReport(id) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return { id, status: 'Approved' };
  }

  const { data } = await api.patch(`/reports/${id}/approve`);
  return data;
}

/**
 * Reject a damage report.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function rejectReport(id) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return { id, status: 'Rejected' };
  }

  const { data } = await api.patch(`/reports/${id}/reject`);
  return data;
}

/**
 * Get latest reports for dashboard widget.
 * @returns {Promise<Array>}
 */
export async function getLatestReports() {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 300));
    return latestReports;
  }

  const { data } = await api.get('/reports/latest');
  return data;
}
