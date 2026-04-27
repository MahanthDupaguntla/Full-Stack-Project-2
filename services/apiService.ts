/**
 * apiService.ts
 * HTTP client for the ArtForge Spring Boot backend.
 * Connects directly to the live backend — no mock/demo fallback.
 */

import { Artwork, User, UserRole, Bid, SubscriptionType, Exhibition } from '../types';

// Strip trailing slash manually if accidentally provided to avoid double-slash 301 redirect issues
// which notoriously transform POST requests into GET requests, causing HTTP 405 errors.
const rawUrl = (import.meta as any).env?.VITE_API_URL ?? '';
const configuredBaseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
const BASE_URL = configuredBaseUrl || (isLocalHost ? '' : null);

function getApiBaseUrl(): string | null {
  if (BASE_URL !== null) return BASE_URL;
  return null;
}

// ── Token helpers ──────────────────────────────────────────────────────────────
const TOKEN_KEY = 'artforge_jwt';
export const getToken   = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken   = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ── Base fetch with proper JSON error parsing ──────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl === null) {
    throw new Error('Backend API is not configured. Set VITE_API_URL for production deployments.');
  }
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });

  if (!res.ok) {
    // Always try to parse JSON body — our GlobalExceptionHandler returns JSON
    let message = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      message = errBody.message || errBody.error || message;
    } catch {
      // If body isn't JSON (shouldn't happen with our handler), use status text
      message = res.statusText || message;
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthPayload {
  token: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  walletBalance: number;
  subscription: string;
  totalEarned: number;
}

export async function apiRegister(
  name: string, email: string, password: string, role: UserRole
): Promise<User> {
  const data = await request<AuthPayload>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
  // PENDING_VERIFICATION = OTP required
  if (data.token === 'PENDING_VERIFICATION') {
    setToken('');
  } else {
    setToken(data.token);
  }
  return payloadToUser(data);
}

export async function apiLogin(email: string, password: string): Promise<User> {
  const data = await request<AuthPayload>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token === 'PENDING_VERIFICATION') {
    setToken('');
  } else {
    setToken(data.token);
  }
  return payloadToUser(data);
}

export async function apiVerifyOtp(email: string, otp: string): Promise<User> {
  const data = await request<AuthPayload>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
  setToken(data.token);
  return payloadToUser(data);
}

export async function apiResendOtp(email: string): Promise<void> {
  await request<{ message: string }>('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiGetMe(): Promise<User> {
  const data = await request<any>('/api/users/me');
  return mapUser(data);
}

// ── Artworks ───────────────────────────────────────────────────────────────────
export async function apiGetArtworks(): Promise<Artwork[]> {
  const data = await request<any[]>('/api/artworks');
  return data.map(mapArtwork);
}

export async function apiGetArtwork(id: string): Promise<Artwork> {
  const data = await request<any>(`/api/artworks/${id}`);
  return mapArtwork(data);
}

export async function apiSearchArtworks(query: string): Promise<Artwork[]> {
  const data = await request<any[]>(`/api/artworks/search?q=${encodeURIComponent(query)}`);
  return data.map(mapArtwork);
}

export async function apiPurchase(artworkId: string): Promise<void> {
  await request<any>(`/api/artworks/${artworkId}/purchase`, { method: 'POST' });
}

export async function apiPlaceBid(artworkId: string, amount: number): Promise<void> {
  await request<any>(`/api/artworks/${artworkId}/bid`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function apiCreateArtwork(
  data: Partial<Artwork> & { auctionDurationHours?: number }
): Promise<Artwork> {
  const res = await request<any>('/api/artworks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapArtwork(res);
}

export async function apiListArtwork(id: string, isListed: boolean, price?: number): Promise<Artwork> {
  const data = await request<any>(`/api/artworks/${id}/list`, {
    method: 'PUT',
    body: JSON.stringify({ isListed, price }),
  });
  return mapArtwork(data);
}

export async function apiUpdateArtwork(id: string, updates: Partial<Artwork>): Promise<Artwork> {
  const data = await request<any>(`/api/artworks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return mapArtwork(data);
}

export async function apiDeleteArtwork(id: string): Promise<void> {
  await request<any>(`/api/artworks/${id}`, { method: 'DELETE' });
}

// ── Users ──────────────────────────────────────────────────────────────────────
export async function apiUpdateUser(updates: Partial<User>): Promise<User> {
  const data = await request<any>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return mapUser(data);
}

export async function apiGetAllUsers(): Promise<User[]> {
  const data = await request<any[]>('/api/users');
  return data.map(mapUser);
}

export async function apiUpdateUserRole(userId: string, role: UserRole): Promise<User> {
  const data = await request<any>(`/api/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
  return mapUser(data);
}

// ── Exhibitions ────────────────────────────────────────────────────────────────
export async function apiGetExhibitions(): Promise<Exhibition[]> {
  const data = await request<any[]>('/api/exhibitions');
  return data.map(mapExhibition);
}

export async function apiCreateExhibition(exhibition: Partial<Exhibition>): Promise<Exhibition> {
  const data = await request<any>('/api/exhibitions', {
    method: 'POST',
    body: JSON.stringify(exhibition),
  });
  return mapExhibition(data);
}

export async function apiUpdateExhibition(id: string, updates: Partial<Exhibition>): Promise<Exhibition> {
  const data = await request<any>(`/api/exhibitions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return mapExhibition(data);
}

// ── Mappers (Spring → Frontend types) ────────────────────────────────────────
function payloadToUser(p: AuthPayload): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    avatar: p.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`,
    walletBalance: Number(p.walletBalance ?? 50000),
    subscription: (p.subscription as SubscriptionType) ?? 'Basic',
    joinedDate: Date.now(),
    totalEarned: Number(p.totalEarned ?? 0),
    transactions: [],
  };
}

function mapUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    avatar: u.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name ?? '')}`,
    walletBalance: Number(u.walletBalance ?? 50000),
    subscription: (u.subscription as SubscriptionType) ?? 'Basic',
    joinedDate: u.joinedDate ? new Date(u.joinedDate).getTime() : Date.now(),
    totalEarned: Number(u.totalEarned ?? 0),
    transactions: (u.transactions ?? []).map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      date: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
      description: t.description ?? '',
      status: 'completed',
      paymentMethod: 'ArtWallet',
    })),
  };
}

function mapArtwork(a: any): Artwork {
  const bids: Bid[] = (a.bids ?? []).map((b: any) => ({
    id: b.id,
    artworkId: a.id,
    bidderName: b.bidderName ?? b.bidder?.name ?? 'Anonymous',
    amount: Number(b.amount),
    timestamp: b.timestamp ? new Date(b.timestamp).getTime() : Date.now(),
  }));

  return {
    id: a.id,
    title: a.title,
    artist: a.artist,
    description: a.description ?? '',
    year: a.year ?? new Date().getFullYear(),
    imageUrl: a.imageUrl ?? '',
    price: Number(a.price),
    category: a.category ?? 'General',
    culturalHistory: a.culturalHistory ?? '',
    curatorInsight: a.curatorInsight ?? '',
    isAuction: Boolean(a.isAuction),
    currentBid: a.currentBid != null ? Number(a.currentBid) : undefined,
    bidEndTime: a.bidEndTime ? new Date(a.bidEndTime).getTime() : undefined,
    bids,
    ownerId: a.owner?.id,
    currentOwnerName: a.currentOwnerName ?? a.owner?.name,
    isListed: Boolean(a.isListed ?? true),
  };
}

function mapExhibition(e: any): Exhibition {
  return {
    id: e.id,
    title: e.title,
    theme: e.theme ?? '',
    curatorId: e.curator?.id ?? e.curatorId ?? '',
    artworkIds: e.artworks ? e.artworks.map((a: any) => a.id) : (e.artworkIds ?? []),
    bannerUrl: e.bannerUrl ?? '',
    description: e.description ?? '',
    status: e.status ?? 'upcoming',
  };
}

// ── Backend availability — uses /api/health for fast, lightweight ping ─────────
let _backendAvailable: boolean | null = null;
let _lastCheck = 0;

export async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now();
  if (_backendAvailable !== null && (now - _lastCheck) < 10000) {
    return _backendAvailable;
  }
  
  _lastCheck = now;
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (apiBaseUrl === null) {
      _backendAvailable = false;
      return false;
    }
    const res = await fetch(`${apiBaseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    _backendAvailable = res.ok;
  } catch (error) {
    _backendAvailable = false;
  }
  
  return _backendAvailable;
}

// Force reset (e.g., on logout)
export function resetBackendCheck() {
  _backendAvailable = null;
  _lastCheck = 0;
}

// ── Live backend (real API only — no mock fallback) ───────────────────────────
export const hybridBackend = {
  available: false,

  async init() {
    this.available = await isBackendAvailable();
    console.log(this.available
      ? `ArtForge: Connected to backend${BASE_URL ? ` at ${BASE_URL}` : ' via local proxy'}`
      : 'ArtForge: ⚠️ Backend not reachable — features will be unavailable');
    return this.available;
  },

  async fetchCurrentUser(): Promise<User | null> {
    const token = getToken();
    if (!token) return null;
    try {
      return await apiGetMe();
    } catch {
      clearToken();
      return null;
    }
  },

  async getArtworks(): Promise<Artwork[]> {
    try { return await apiGetArtworks(); }
    catch { return []; }
  },

  async purchaseArtwork(artworkId: string, _user: User): Promise<boolean> {
    try {
      await apiPurchase(artworkId);
      return true;
    } catch (e: any) {
      alert(e.message);
      return false;
    }
  },

  async placeBid(artworkId: string, _user: User, amount: number): Promise<boolean> {
    try {
      await apiPlaceBid(artworkId, amount);
      return true;
    } catch (e: any) {
      alert(e.message);
      return false;
    }
  },

  async getAllUsers(): Promise<User[]> {
    try { return await apiGetAllUsers(); } catch { return []; }
  },

  async getExhibitions(): Promise<Exhibition[]> {
    try { return await apiGetExhibitions(); } catch { return []; }
  },

  async updateExhibition(e: Exhibition): Promise<void> {
    await apiUpdateExhibition(e.id, e);
  },

  async createExhibition(e: Partial<Exhibition>): Promise<Exhibition> {
    return await apiCreateExhibition(e);
  },

  async updateUserRole(id: string, role: UserRole): Promise<void> {
    await apiUpdateUserRole(id, role);
  },

  async updateUser(u: User): Promise<void> {
    await apiUpdateUser(u);
  },

  async uploadArtwork(a: any): Promise<Artwork> {
    return await apiCreateArtwork(a);
  },

  async updateArtwork(id: string, updates: Partial<Artwork>): Promise<Artwork> {
    return await apiUpdateArtwork(id, updates);
  },

  async deleteArtwork(id: string): Promise<void> {
    await apiDeleteArtwork(id);
  },

  async listArtwork(id: string, isListed: boolean, price?: number): Promise<void> {
    try {
      await apiListArtwork(id, isListed, price);
    } catch (e: any) {
      alert(e.message);
    }
  },

  // These need backend endpoints — currently no-ops
  endAuction: (_id: string) => {},
  getPurchaseHistoryForArtist: (_name: string) => [],

  getCurrentUser: (): User | null => null,

  logout: () => {
    clearToken();
    resetBackendCheck();
  },
};
