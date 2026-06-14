import api from './api';

// ─────────────────────────────
// NORMALIZE
// ─────────────────────────────
const normalizeUser = (user = {}) => ({
  id: user.id,
  name: user.name ?? '',
  username: user.username ?? '',
  role: user.role ?? '',
  status: user.is_active ? 'active' : 'inactive',
  isActive: Boolean(user.is_active),
  createdAt: user.created_at ?? null,
  updatedAt: user.updated_at ?? null,
});

// ─────────────────────────────
// NORMALIZE API ERROR
// ─────────────────────────────
const normalizeError = (error) => {
  const responseData = error.response?.data;

  if (responseData?.message) {
    return responseData;
  }

  if (responseData?.errors) {
    return responseData;
  }

  return {
    message: error.message || 'Terjadi kesalahan pada server.',
  };
};

// ─────────────────────────────
// GET USERS
// Backend response:
// {
//   data: [...users]
// }
// ─────────────────────────────
export async function getUsers(filters = {}) {
  try {
    const response = await api.get('/admin/users', {
      params: filters,
    });

    const users = response.data?.data ?? [];

    return users.map(normalizeUser);
  } catch (error) {
    console.error('GET USERS ERROR:', error);
    throw normalizeError(error);
  }
}

// ─────────────────────────────
// CREATE USER
// Backend response:
// {
//   message: 'User berhasil dibuat.',
//   data: user
// }
// ─────────────────────────────
export async function createUser(userData) {
  try {
    const payload = {
      name: userData.name,
      username: userData.username,
      password: userData.password,
      role: userData.role,
    };

    const response = await api.post('/admin/users', payload);

    return normalizeUser(response.data?.data);
  } catch (error) {
    console.error('CREATE USER ERROR:', error);
    throw normalizeError(error);
  }
}

// ─────────────────────────────
// UPDATE USER
// Backend response:
// {
//   message: 'User berhasil diperbarui.',
//   data: user
// }
// ─────────────────────────────
export async function updateUser(id, updates = {}) {
  try {
    const payload = {};

    if (updates.name !== undefined) {
      payload.name = updates.name;
    }

    if (updates.username !== undefined) {
      payload.username = updates.username;
    }

    if (updates.role !== undefined) {
      payload.role = updates.role;
    }

    if (updates.status !== undefined) {
      payload.is_active = updates.status === 'active';
    }

    if (updates.is_active !== undefined) {
      payload.is_active = Boolean(updates.is_active);
    }

    if (updates.password) {
      payload.password = updates.password;
    }

    const response = await api.put(`/admin/users/${id}`, payload);

    return normalizeUser(response.data?.data);
  } catch (error) {
    console.error('UPDATE USER ERROR:', error);
    throw normalizeError(error);
  }
}

// ─────────────────────────────
// DISABLE USER
// Backend bisa menolak jika driver/teknisi masih progress.
// Response success:
// {
//   message: 'User berhasil diperbarui.',
//   data: user
// }
// ─────────────────────────────
export async function disableUser(id) {
  try {
    const response = await api.put(`/admin/users/${id}`, {
      is_active: false,
    });

    return normalizeUser(response.data?.data);
  } catch (error) {
    console.error('DISABLE USER ERROR:', error);
    throw normalizeError(error);
  }
}

// ─────────────────────────────
// ENABLE USER
// Response success:
// {
//   message: 'User berhasil diperbarui.',
//   data: user
// }
// ─────────────────────────────
export async function enableUser(id) {
  try {
    const response = await api.put(`/admin/users/${id}`, {
      is_active: true,
    });

    return normalizeUser(response.data?.data);
  } catch (error) {
    console.error('ENABLE USER ERROR:', error);
    throw normalizeError(error);
  }
}

// ─────────────────────────────
// DELETE USER
// Backend response success:
// {
//   message: 'User berhasil dihapus.'
// }
//
// Backend response gagal contoh:
// {
//   message: 'Driver tidak dapat dihapus karena masih memiliki kendaraan...'
// }
// ─────────────────────────────
export async function deleteUser(id) {
  try {
    const response = await api.delete(`/admin/users/${id}`);

    return {
      success: true,
      message: response.data?.message || 'User berhasil dihapus.',
    };
  } catch (error) {
    console.error('DELETE USER ERROR:', error);
    throw normalizeError(error);
  }
}

// ─────────────────────────────
// GET DRIVERS ONLY
// Untuk Vehicle Assignment
// ─────────────────────────────
export async function getDrivers() {
  try {
    const users = await getUsers();

    return users.filter(
      (user) => user.role === 'driver' && user.status === 'active'
    );
  } catch (error) {
    console.error('GET DRIVERS ERROR:', error);
    throw error;
  }
}

// ─────────────────────────────
// GET TECHNICIANS ONLY
// Untuk Maintenance Scheduling
// ─────────────────────────────
export async function getTechnicians() {
  try {
    const users = await getUsers();

    return users.filter(
      (user) => user.role === 'teknisi' && user.status === 'active'
    );
  } catch (error) {
    console.error('GET TECHNICIANS ERROR:', error);
    throw error;
  }
}