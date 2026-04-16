/**
 * apiService.ts
 * HTTP client for the ArtForge Spring Boot backend.
 * Falls back gracefully to mock data when backend is unreachable.
 */

import { Artwork, User, UserRole, Bid, SubscriptionType, Exhibition } from '../types';
import { mockBackend } from './mockBackend';

// Strip trailing slash manually if accidentally provided to avoid double-slash 301 redirect issues
// which notoriously transform POST requests into GET requests, causing HTTP 405 errors.
const rawUrl = (import.meta as any).env?.VITE_API_URL ?? '';
const configuredBaseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
const BASE_URL = configuredBaseUrl || (isLocalHost ? '' : null);

function getApiBaseUrl(): string {
  if (BASE_URL) return BASE_URL;
  throw new Error('Backend API is not configured. Set VITE_API_URL for production deployments.');
}

// ── Token helpers ──────────────────────────────────────────────────────────────
const TOKEN_KEY = 'artforge_jwt';
export const getToken   = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken   = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ── Base fetch with proper JSON error parsing ──────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
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
  // Cache result for 60 seconds; always re-check before caching
  if (_backendAvailable !== null && (now - _lastCheck) < 60000) return _backendAvailable;

  if (!BASE_URL && !isLocalHost) {
    _backendAvailable = false;
    _lastCheck = now;
    return _backendAvailable;
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/health`, {
      signal: AbortSignal.timeout(3000),
      headers: {
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      _backendAvailable = data.status === 'UP';
    } else {
      _backendAvailable = false;
    }
  } catch {
    _backendAvailable = false;
  }
  _lastCheck = now;
  return _backendAvailable;
}

// Force reset (e.g., on logout)
export function resetBackendCheck() {
  _backendAvailable = null;
  _lastCheck = 0;
}

// ── Hybrid backend (real API + mock fallback) ─────────────────────────────────
export const hybridBackend = {
  available: false,

  async init() {
    this.available = await isBackendAvailable();
    console.log(this.available
      ? `ArtForge: Connected to backend${BASE_URL ? ` at ${BASE_URL}` : ' via local proxy'}`
      : 'ArtForge: Backend not configured or reachable - using mock data');
    return this.available;
  },

  async fetchCurrentUser(): Promise<User | null> {
    if (!this.available) return mockBackend.getCurrentUser();
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
    if (!this.available) return mockBackend.getArtworks();
    try { return await apiGetArtworks(); }
    catch { return mockBackend.getArtworks(); }
  },

  async purchaseArtwork(artworkId: string, user: User): Promise<boolean> {
    if (!this.available) return mockBackend.purchaseArtwork(artworkId, user);
    try {
      await apiPurchase(artworkId);
      return true;
    } catch (e: any) {
      alert(e.message);
      return false;
    }
  },

  async placeBid(artworkId: string, user: User, amount: number): Promise<boolean> {
    if (!this.available) return mockBackend.placeBid(artworkId, user, amount);
    try {
      await apiPlaceBid(artworkId, amount);
      return true;
    } catch (e: any) {
      alert(e.message);
      return false;
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (!this.available) return mockBackend.getAllUsers();
    try { return await apiGetAllUsers(); } catch { return mockBackend.getAllUsers(); }
  },

  async getExhibitions(): Promise<Exhibition[]> {
    if (!this.available) return mockBackend.getExhibitions();
    try { return await apiGetExhibitions(); } catch { return mockBackend.getExhibitions(); }
  },

  async updateExhibition(e: Exhibition): Promise<void> {
    if (!this.available) return mockBackend.updateExhibition(e);
    try { await apiUpdateExhibition(e.id, e); } catch { mockBackend.updateExhibition(e); }
  },

  async createExhibition(e: Partial<Exhibition>): Promise<Exhibition> {
    if (!this.available) return mockBackend.createExhibition(e);
    try { return await apiCreateExhibition(e); } catch { return mockBackend.createExhibition(e); }
  },

  async updateUserRole(id: string, role: UserRole): Promise<void> {
    if (!this.available) return mockBackend.updateUserRole(id, role);
    try { await apiUpdateUserRole(id, role); } catch { mockBackend.updateUserRole(id, role); }
  },

  async updateUser(u: User): Promise<void> {
    if (!this.available) return mockBackend.updateUser(u);
    try { await apiUpdateUser(u); } catch { mockBackend.updateUser(u); }
  },

  async uploadArtwork(a: any): Promise<Artwork> {
    if (!this.available) return mockBackend.uploadArtwork(a);
    try { return await apiCreateArtwork(a); } catch { return mockBackend.uploadArtwork(a); }
  },

  updateArtwork: (a: Artwork) => mockBackend.updateArtwork(a),
  listArtwork: (...args: any[]) => (mockBackend.listArtwork as any)(...args),
  endAuction: (id: string) => mockBackend.endAuction(id),
  getPurchaseHistoryForArtist: (name: string) => mockBackend.getPurchaseHistoryForArtist(name),
  getCurrentUser: () => mockBackend.getCurrentUser(),
  logout: () => {
    clearToken();
    resetBackendCheck();
    mockBackend.logout();
  },
};
