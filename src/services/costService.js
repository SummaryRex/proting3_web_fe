import api, { useMock } from './api';
import { sparePartsData, costHistoryData } from '../mocks/costData';

const TIMEZONE = 'Asia/Jakarta';

/**
 * Convert response payload to array safely.
 */
function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

/**
 * Convert value to number safely.
 */
function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') return value;

  const cleaned = String(value)
    .replace(/[^\d.-]/g, '');

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Format number to Indonesian number format.
 * Example: 1500000 -> 1.500.000
 */
function formatNumberID(value) {
  return new Intl.NumberFormat('id-ID').format(toNumber(value));
}

/**
 * Get date string safely as YYYY-MM-DD.
 *
 * Important:
 * - If backend already sends YYYY-MM-DD, keep it.
 * - If backend sends datetime, take date part safely.
 * - Avoid shifting date because of browser timezone.
 */
function normalizeDateString(value) {
  if (!value) return '';

  const raw = String(value);

  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const result = {};

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      result[part.type] = part.value;
    }
  });

  return `${result.year}-${result.month}-${result.day}`;
}

/**
 * Get current month in Asia/Jakarta.
 * Format: YYYY-MM
 */
function getCurrentMonthJakarta() {
  return normalizeDateString(new Date()).slice(0, 7);
}

/**
 * Get previous month from YYYY-MM.
 */
function getPreviousMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);

  const date = new Date(year, monthNumber - 2, 1);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');

  return `${y}-${m}`;
}

/**
 * Map backend status to frontend status.
 */
function mapStatusToFrontend(status) {
  if (status === 'requested') return 'pending';
  return status || 'pending';
}

/**
 * Normalize sparepart usage from backend.
 */
function normalizeSparePartUsage(item) {
  const technician = item?.technician || {};
  const part = item?.part || {};

  const damageReport =
    item?.damage_report ||
    item?.damageReport ||
    {};

  const vehicle =
    damageReport?.vehicle ||
    {};

  const qty = toNumber(item?.qty);
  const buyPrice = toNumber(part?.buy_price ?? item?.buy_price);
  const totalCost = qty * buyPrice;

  const vehicleLabel = [
    vehicle?.brand,
    vehicle?.model,
    vehicle?.plate_number,
  ]
    .filter(Boolean)
    .join(' - ');

  return {
    id: item?.id,
    requestId: item?.id,

    part_id: item?.part_id,
    partId: item?.part_id,

    partName: part?.name || item?.part_name || '-',
    name: part?.name || item?.part_name || '-',

    sku: part?.sku || '-',

    qty,
    quantity: qty,

    unitPrice: buyPrice,
    buyPrice,
    price: buyPrice,

    totalCost,
    total: totalCost,

    status: mapStatusToFrontend(item?.status),

    technicianId: item?.technician_id,
    technicianName: technician?.username || '-',

    damageReportId: item?.damage_report_id,
    damageDescription: damageReport?.description || '-',

    vehicleId: damageReport?.vehicle_id,
    vehicle: vehicleLabel || '-',
    plateNumber: vehicle?.plate_number || '-',

    note: item?.note || '',
    createdAt: item?.created_at || '',
    date: normalizeDateString(item?.created_at || item?.date),

    raw: item,
  };
}

/**
 * Normalize finance transaction from backend.
 */
function normalizeTransaction(item) {
  const amount = toNumber(item?.amount);

  return {
    id: item?.id,

    type: item?.type || '',
    category: item?.category || '',
    amount,
    displayAmount: formatNumberID(amount),

    date: normalizeDateString(item?.date),
    note: item?.note || '',

    source: item?.source || '',
    ref: item?.ref || null,
    locked: Boolean(item?.locked),

    raw: item,
  };
}

/**
 * Sum amount from transaction array.
 */
function sumAmount(items) {
  return items.reduce((total, item) => {
    return total + toNumber(item?.amount);
  }, 0);
}

/**
 * Get spare parts pending approval.
 *
 * Backend:
 * GET /api/admin/part-usages/pending
 *
 * @param {Object} options
 * @param {number} options.limit
 * @returns {Promise<Array>}
 */
export async function getSpareParts(options = {}) {
  const { limit = 50 } = options;

  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));

    return sparePartsData.map((s, index) => ({
      ...s,
      id: s.id ?? index + 1,
      requestId: s.id ?? index + 1,
      status: 'pending',
    }));
  }

  const { data } = await api.get('/admin/part-usages/pending', {
    params: {
      limit,
    },
  });

  return toArray(data).map(normalizeSparePartUsage);
}

/**
 * Get sparepart usage list by status.
 *
 * Backend:
 * GET /api/admin/part-usages?status=pending|approved|rejected
 *
 * @param {'pending'|'approved'|'rejected'|'requested'} status
 * @param {Object} options
 * @param {number} options.limit
 * @returns {Promise<Array>}
 */
export async function getPartUsages(status = 'pending', options = {}) {
  const { limit = 50 } = options;

  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));

    return sparePartsData.map((s, index) => ({
      ...s,
      id: s.id ?? index + 1,
      requestId: s.id ?? index + 1,
      status,
    }));
  }

  const { data } = await api.get('/admin/part-usages', {
    params: {
      status,
      limit,
    },
  });

  return toArray(data).map(normalizeSparePartUsage);
}

/**
 * Approve or reject a spare part request.
 *
 * Backend:
 * POST /api/admin/part-usages/{id}/approve
 * POST /api/admin/part-usages/{id}/reject
 *
 * @param {number|string} id
 * @param {'approved'|'rejected'} action
 * @param {string} note
 * @returns {Promise<Object>}
 */
export async function updateSparePartStatus(id, action, note = '') {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));

    return {
      id,
      requestId: id,
      status: action,
      message:
        action === 'approved'
          ? 'Request sparepart disetujui.'
          : 'Request sparepart ditolak.',
    };
  }

  if (!id) {
    throw new Error('ID request sparepart tidak ditemukan.');
  }

  if (!['approved', 'rejected'].includes(action)) {
    throw new Error('Action tidak valid. Gunakan approved atau rejected.');
  }

  let response;

  if (action === 'approved') {
    response = await api.post(`/admin/part-usages/${id}/approve`, {
      admin_note: note || undefined,
    });
  } else {
    response = await api.post(`/admin/part-usages/${id}/reject`, {
      reason: note || undefined,
    });
  }

  const payload = response.data;

  return {
    ...payload,
    status: action,
    usage: payload?.usage
      ? normalizeSparePartUsage(payload.usage)
      : payload?.usage,
  };
}

/**
 * Get maintenance cost history.
 *
 * Backend:
 * GET /api/admin/transactions?type=expense&month=YYYY-MM&source=inventory|repair
 *
 * @param {Object} filters
 * @param {string} filters.month - format YYYY-MM
 * @param {'income'|'expense'} filters.type
 * @param {'manual'|'repair'|'inventory'} filters.source
 * @returns {Promise<Array>}
 */
export async function getCostHistory(filters = {}) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));
    return [...costHistoryData];
  }

  const params = {
    type: filters.type || 'expense',
  };

  if (filters.month) {
    params.month = filters.month;
  }

  if (filters.source) {
    params.source = filters.source;
  }

  const { data } = await api.get('/admin/transactions', {
    params,
  });

  return toArray(data).map(normalizeTransaction);
}

/**
 * Get all finance transactions.
 *
 * Backend:
 * GET /api/admin/transactions
 *
 * @param {Object} filters
 * @param {string} filters.month
 * @param {'income'|'expense'} filters.type
 * @param {'manual'|'repair'|'inventory'} filters.source
 * @returns {Promise<Array>}
 */
export async function getFinanceTransactions(filters = {}) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));
    return [...costHistoryData];
  }

  const params = {};

  if (filters.month) {
    params.month = filters.month;
  }

  if (filters.type) {
    params.type = filters.type;
  }

  if (filters.source) {
    params.source = filters.source;
  }

  const { data } = await api.get('/admin/transactions', {
    params,
  });

  return toArray(data).map(normalizeTransaction);
}

/**
 * Get cost summary stats.
 *
 * Summary dihitung dari finance transaction karena backend yang tersedia adalah:
 * GET /api/admin/transactions
 *
 * @param {Object} options
 * @param {string} options.month - format YYYY-MM
 * @returns {Promise<Object>}
 */
export async function getCostSummary(options = {}) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 300));

    return {
      totalCost: '4.285.000.000',
      monthlyCost: '842.150.000',
      sparepartExpenses: '1.520.400.000',
      totalTrend: '+12% vs last quarter',
      projection: '900.000.000',
      budgetAlert: 'Over budget by 4.2%',

      totalCostRaw: 4285000000,
      monthlyCostRaw: 842150000,
      sparepartExpensesRaw: 1520400000,
      projectionRaw: 900000000,
    };
  }

  const selectedMonth = options.month || getCurrentMonthJakarta();
  const previousMonth = getPreviousMonth(selectedMonth);

  const [allTransactions, selectedMonthTransactions, previousMonthTransactions] =
    await Promise.all([
      getFinanceTransactions({
        type: 'expense',
      }),
      getFinanceTransactions({
        type: 'expense',
        month: selectedMonth,
      }),
      getFinanceTransactions({
        type: 'expense',
        month: previousMonth,
      }),
    ]);

  const totalExpense = sumAmount(allTransactions);
  const monthlyExpense = sumAmount(selectedMonthTransactions);
  const previousMonthlyExpense = sumAmount(previousMonthTransactions);

  const sparepartExpense = sumAmount(
    allTransactions.filter((item) => {
      const source = String(item.source || '').toLowerCase();
      const category = String(item.category || '').toLowerCase();

      return source === 'inventory' || category.includes('inventory');
    })
  );

  let totalTrend = 'Belum ada data bulan lalu';

  if (previousMonthlyExpense > 0) {
    const percentage =
      ((monthlyExpense - previousMonthlyExpense) / previousMonthlyExpense) * 100;

    const sign = percentage >= 0 ? '+' : '';

    totalTrend = `${sign}${percentage.toFixed(1)}% vs bulan lalu`;
  }

  return {
    totalCost: formatNumberID(totalExpense),
    monthlyCost: formatNumberID(monthlyExpense),
    sparepartExpenses: formatNumberID(sparepartExpense),
    totalTrend,
    projection: formatNumberID(monthlyExpense),
    budgetAlert: 'Tidak ada data budget',

    totalCostRaw: totalExpense,
    monthlyCostRaw: monthlyExpense,
    sparepartExpensesRaw: sparepartExpense,
    projectionRaw: monthlyExpense,

    month: selectedMonth,
    previousMonth,
  };
}