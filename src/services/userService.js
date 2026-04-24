import api, { useMock } from './api';
import { initialUsers } from '../mocks/userData';

// 🔥 normalize biar UI konsisten
const normalizeUser = (user) => ({
  ...user,
  status: user.status?.toLowerCase?.() || 'active',
  role: user.role || 'Mechanic',
});

// 🔍 GET USERS
export async function getUsers(filters = {}) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 400));
    let data = [...initialUsers];

    if (filters.role && filters.role !== 'all') {
      data = data.filter(
        (u) => u.role.toLowerCase() === filters.role.toLowerCase()
      );
    }

    if (filters.search) {
      data = data.filter((u) =>
        u.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    return data.map(normalizeUser);
  }

  const { data } = await api.get('/users', { params: filters });
  const users = data.data ?? data;

  return users.map(normalizeUser);
}

// ➕ CREATE USER
export async function createUser(userData) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 600));
    return normalizeUser({
      ...userData,
      status: 'active',
      id: Date.now(),
    });
  }

  const payload = {
    name: userData.name,
    username: userData.username,
    password: userData.accessKey, // 🔥 mapping FE → BE
    role: userData.role,
  };

  const { data } = await api.post('/users', payload);
  return normalizeUser(data.data ?? data);
}

// ✏️ UPDATE USER (EDIT)
export async function updateUser(id, updates) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return normalizeUser({ id, ...updates });
  }

  const payload = {
    name: updates.name,
    username: updates.username,
    role: updates.role,
  };

  // kalau user edit password
  if (updates.accessKey) {
    payload.password = updates.accessKey;
  }

  const { data } = await api.put(`/users/${id}`, payload);
  return normalizeUser(data.data ?? data);
}

// 🚫 DISABLE USER
export async function disableUser(id) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return { id, status: 'inactive' };
  }

  const { data } = await api.patch(`/users/${id}/disable`);
  return normalizeUser(data.data ?? data);
}

// 🔐 RESET PASSWORD
export async function resetPassword(id) {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 500));
    return { success: true };
  }

  const { data } = await api.post(`/users/${id}/reset-password`);
  return data;
}