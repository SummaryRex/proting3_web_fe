import api, { useMock } from './api';
import { initialUsers } from '../mocks/userData';

/**
 * Get all users.
 * @param {{ role?: string, search?: string }} filters
 * @returns {Promise<Array>}
 */
export async function getUsers(filters = {}) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));
    let data = [...initialUsers];
    if (filters.role && filters.role !== 'all') data = data.filter((u) => u.role === filters.role);
    if (filters.search) data = data.filter((u) => u.name.toLowerCase().includes(filters.search.toLowerCase()));
    return data;
  }

  const { data } = await api.get('/users', { params: filters });
  return data;
}

/**
 * Create a new user.
 * @param {{ name: string, role: string, username: string }} userData
 * @returns {Promise<Object>}
 */
export async function createUser(userData) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 600));
    return { ...userData, status: 'Active', id: Date.now() };
  }

  const { data } = await api.post('/users', userData);
  return data;
}

/**
 * Update user by ID.
 * @param {string|number} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateUser(id, updates) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return { id, ...updates };
  }

  const { data } = await api.put(`/users/${id}`, updates);
  return data;
}

/**
 * Disable a user account.
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function disableUser(id) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return { id, status: 'Inactive' };
  }

  const { data } = await api.patch(`/users/${id}/disable`);
  return data;
}
