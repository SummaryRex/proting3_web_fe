import api from './api';

// ─────────────────────────────
// NORMALIZE
// ─────────────────────────────
const normalizeUser = (user) => ({
  id: user.id,
  name: user.name ?? '', // ❗ tidak fallback ke username lagi
  username: user.username,
  role: user.role,
  status: user.is_active ? 'active' : 'inactive',
  createdAt: user.created_at,
});

// ─────────────────────────────
// GET USERS
// ─────────────────────────────
export async function getUsers(filters = {}) {
  try {
    const { data } = await api.get('/admin/users', {
      params: filters,
    });

    return data.map(normalizeUser);
  } catch (error) {
    console.error('GET USERS ERROR:', error);
    throw error.response?.data || error.message;
  }
}

// ─────────────────────────────
// CREATE USER
// ─────────────────────────────
export async function createUser(userData) {
  try {
    const payload = {
      name: userData.name,
      username: userData.username,
      password: userData.password,
      role: userData.role,
    };

    const { data } = await api.post('/admin/users', payload);

    return normalizeUser(data);
  } catch (error) {
    console.error('CREATE USER ERROR:', error);
    throw error.response?.data || error.message;
  }
}

// ─────────────────────────────
// UPDATE USER
// ─────────────────────────────
export async function updateUser(id, updates) {
  try {
    const payload = {
      name: updates.name,
      username: updates.username,
      role: updates.role,
    };

    if (updates.status !== undefined) {
      payload.is_active = updates.status === 'active';
    }

    if (updates.password) {
      payload.password = updates.password;
    }

    const { data } = await api.put(`/admin/users/${id}`, payload);

    return normalizeUser(data);
  } catch (error) {
    console.error('UPDATE USER ERROR:', error);
    throw error.response?.data || error.message;
  }
}

// ─────────────────────────────
// DISABLE USER
// ─────────────────────────────
export async function disableUser(id) {
  try {
    const { data } = await api.put(`/admin/users/${id}`, {
      is_active: false,
    });

    return {
      id: data.id,
      status: data.is_active ? 'active' : 'inactive',
    };
  } catch (error) {
    console.error('DISABLE USER ERROR:', error);
    throw error.response?.data || error.message;
  }
}

// ─────────────────────────────
// ENABLE USER
// ─────────────────────────────
export async function enableUser(id) {
  try {
    const { data } = await api.put(`/admin/users/${id}`, {
      is_active: true,
    });

    return {
      id: data.id,
      status: data.is_active ? 'active' : 'inactive',
    };
  } catch (error) {
    console.error('ENABLE USER ERROR:', error);
    throw error.response?.data || error.message;
  }
}

// ─────────────────────────────
// DELETE USER
// ─────────────────────────────
export async function deleteUser(id) {
  try {
    await api.delete(`/admin/users/${id}`);
    return { success: true };
  } catch (error) {
    console.error('DELETE USER ERROR:', error);
    throw error.response?.data || error.message;
  }
}

// ─────────────────────────────
// GET DRIVERS ONLY (UNTUK ASSIGNMENT)
// ─────────────────────────────
export async function getDrivers() {
  try {
    const users = await getUsers();

    return users.filter((user) => user.role === 'driver');
  } catch (error) {
    console.error('GET DRIVERS ERROR:', error);
    throw error;
  }
}