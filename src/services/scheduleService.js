import api, { useMock } from './api';
import { approvedReports, initialSchedules } from '../mocks/maintenanceData';

/**
 * Get approved damage reports (ready to schedule).
 * @returns {Promise<Array>}
 */
export async function getApprovedReports() {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 300));
    return [...approvedReports];
  }

  const { data } = await api.get('/reports/approved');
  return data;
}

/**
 * Get maintenance schedules.
 * @returns {Promise<Array>}
 */
export async function getSchedules() {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));
    return [...initialSchedules];
  }

  const { data } = await api.get('/schedules');
  return data;
}

/**
 * Create a new maintenance schedule.
 * @param {{ equipName: string, mechanic: string, date: string, priority: string }} scheduleData
 * @returns {Promise<Object>}
 */
export async function createSchedule(scheduleData) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      id: `MS-${1050 + Math.floor(Math.random() * 100)}`,
      equip: scheduleData.equipName,
      mechanic: scheduleData.mechanic,
      date: new Date(scheduleData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dateVal: scheduleData.date,
      priority: scheduleData.priority,
      status: 'scheduled',
    };
  }

  const { data } = await api.post('/schedules', scheduleData);
  return data;
}

/**
 * Update a maintenance schedule.
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateSchedule(id, updates) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return { id, ...updates };
  }

  const { data } = await api.put(`/schedules/${id}`, updates);
  return data;
}
