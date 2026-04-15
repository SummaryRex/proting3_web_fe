import api, { useMock } from './api';
import { sparePartsData, costHistoryData } from '../mocks/costData';

/**
 * Get spare parts pending approval.
 * @returns {Promise<Array>}
 */
export async function getSpareParts() {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));
    return sparePartsData.map((s) => ({ ...s, status: 'pending' }));
  }

  const { data } = await api.get('/costs/spare-parts');
  return data;
}

/**
 * Approve or reject a spare part request.
 * @param {number} index
 * @param {'approved'|'rejected'} action
 * @returns {Promise<Object>}
 */
export async function updateSparePartStatus(index, action) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return { index, status: action };
  }

  const { data } = await api.patch(`/costs/spare-parts/${index}`, { status: action });
  return data;
}

/**
 * Get maintenance cost history.
 * @returns {Promise<Array>}
 */
export async function getCostHistory() {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));
    return [...costHistoryData];
  }

  const { data } = await api.get('/costs/history');
  return data;
}

/**
 * Get cost summary stats (total, monthly, sparepart expenses).
 * @returns {Promise<Object>}
 */
export async function getCostSummary() {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 300));
    return {
      totalCost: '4.285.000.000',
      monthlyCost: '842.150.000',
      sparepartExpenses: '1.520.400.000',
      totalTrend: '+12% vs last quarter',
      projection: '900.000.000',
      budgetAlert: 'Over budget by 4.2%',
    };
  }

  const { data } = await api.get('/costs/summary');
  return data;
}
