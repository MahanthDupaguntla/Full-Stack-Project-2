import { User, Artwork, UserRole, Exhibition } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

export const isBackendAvailable = async () => {
    try {
        const res = await fetch(`${API_BASE}/api/health`);
        return res.ok;
    } catch {
        return false;
    }
};

export const getToken = () => localStorage.getItem('artforge_jwt');
export const setToken = (t: string) => localStorage.setItem('artforge_jwt', t);
export const clearToken = () => localStorage.removeItem('artforge_jwt');

const authHeaders = () => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const jsonHeaders = () => ({
    'Content-Type': 'application/json',
    ...authHeaders()
});

export const apiLogin = async (email: string, password?: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'password' })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Login failed');
    }
    const data = await res.json();
    if (data.token) setToken(data.token);
    return data;
};

export const apiRegister = async (name: string, email: string, password?: string, role?: UserRole) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: password || 'password', role: role || UserRole.VISITOR })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Registration failed');
    }
    const data = await res.json();
    if (data.token) setToken(data.token);
    return data;
};

export const apiVerifyOtp = async (email: string, otp: string) => {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Invalid OTP');
    }
    const data = await res.json();
    if (data.token) setToken(data.token);
    return data;
};

export const apiResendOtp = async (email: string) => {
    // Calling login again will generate and send a new OTP if we don't change passwords
    // Note: We need the password to call login. If we don't have it, we might need a dedicated resend endpoint.
    // For now, this is a placeholder.
};

export const hybridBackend = {
  available: true,
  init: async () => true,
  fetchCurrentUser: async () => {
      try {
          const res = await fetch(`${API_BASE}/api/users/me`, { headers: authHeaders() });
          if (!res.ok) return null;
          return await res.json();
      } catch {
          return null;
      }
  },
  getArtworks: async () => {
      try {
          const res = await fetch(`${API_BASE}/api/artworks`, { headers: authHeaders() });
          if (!res.ok) return [];
          return await res.json();
      } catch {
          return [];
      }
  },
  purchaseArtwork: async (artworkId: string, user: User) => {
      const res = await fetch(`${API_BASE}/api/artworks/${artworkId}/purchase`, {
          method: 'POST',
          headers: authHeaders()
      });
      if (!res.ok) throw new Error('Purchase failed');
      return res.json();
  },
  placeBid: async (artworkId: string, user: User, amount: number) => {
      const res = await fetch(`${API_BASE}/api/artworks/${artworkId}/bid`, {
          method: 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify({ amount, bidderName: user.name })
      });
      if (!res.ok) throw new Error('Bid failed');
      return res.json();
  },
  getAllUsers: async () => {
      try {
          const res = await fetch(`${API_BASE}/api/users`, { headers: authHeaders() });
          if (!res.ok) return [];
          return await res.json();
      } catch {
          return [];
      }
  },
  getExhibitions: async () => {
      try {
          const res = await fetch(`${API_BASE}/api/exhibitions`, { headers: authHeaders() });
          if (!res.ok) return [];
          return await res.json();
      } catch {
          return [];
      }
  },
  updateExhibition: async (e: Exhibition) => {
      const res = await fetch(`${API_BASE}/api/exhibitions/${e.id}`, {
          method: 'PUT',
          headers: jsonHeaders(),
          body: JSON.stringify(e)
      });
      if (!res.ok) throw new Error('Failed to update exhibition');
      return res.json();
  },
  createExhibition: async (e: Partial<Exhibition>) => {
      const res = await fetch(`${API_BASE}/api/exhibitions`, {
          method: 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify(e)
      });
      if (!res.ok) throw new Error('Failed to create exhibition');
      return res.json();
  },
  updateUserRole: async (id: string, role: UserRole) => {
      const res = await fetch(`${API_BASE}/api/users/${id}/role`, {
          method: 'PUT',
          headers: jsonHeaders(),
          body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error('Failed to update user role');
      return res.json();
  },
  updateUser: async (u: User) => {
      const res = await fetch(`${API_BASE}/api/users/me`, {
          method: 'PUT',
          headers: jsonHeaders(),
          body: JSON.stringify(u)
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
  },
  toggleUserSuspension: async (id: string) => {
      console.warn("toggleUserSuspension not fully supported by backend");
      return null;
  },
  uploadArtwork: async (a: any) => {
      const res = await fetch(`${API_BASE}/api/artworks`, {
          method: 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify(a)
      });
      if (!res.ok) throw new Error('Failed to upload artwork');
      return res.json();
  },
  updateArtwork: async (id: string, updates: Partial<Artwork>) => {
      const res = await fetch(`${API_BASE}/api/artworks/${id}`, {
          method: 'PUT',
          headers: jsonHeaders(),
          body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update artwork');
      return res.json();
  },
  deleteArtwork: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/artworks/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete artwork');
  },
  listArtwork: async (id: string, isListed: boolean, price?: number) => {
      const res = await fetch(`${API_BASE}/api/artworks/${id}/list`, {
          method: 'PUT',
          headers: jsonHeaders(),
          body: JSON.stringify({ isListed, price })
      });
      if (!res.ok) throw new Error('Failed to update listing');
      return res.json();
  },
  endAuction: async (id: string) => {
      console.warn("endAuction not explicitly supported, using listArtwork to unlist");
      return await hybridBackend.listArtwork(id, false);
  },
  getPurchaseHistoryForArtist: async (name: string) => {
      return [];
  },
  getCurrentUser: async () => {
      return await hybridBackend.fetchCurrentUser();
  },
  logout: () => {
      clearToken();
  },
};
