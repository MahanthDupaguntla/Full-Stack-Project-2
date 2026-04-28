import { mockBackend } from './mockBackend';
import { User, Artwork, UserRole, Exhibition } from '../types';

export const isBackendAvailable = async () => true;
export const getToken = () => localStorage.getItem('artforge_jwt');
export const setToken = (t: string) => localStorage.setItem('artforge_jwt', t);
export const clearToken = () => localStorage.removeItem('artforge_jwt');

export const apiLogin = async (email: string, password?: string) => mockBackend.login(email.split('@')[0], UserRole.VISITOR);
export const apiRegister = async (name: string, email: string, password?: string, role?: UserRole) => mockBackend.login(name, role || UserRole.VISITOR);
export const apiVerifyOtp = async (email: string, otp: string) => mockBackend.login(email.split('@')[0], UserRole.VISITOR);
export const apiResendOtp = async (email: string) => {};

export const hybridBackend = {
  available: true,
  init: async () => true,
  fetchCurrentUser: async () => mockBackend.getCurrentUser(),
  getArtworks: async () => mockBackend.getArtworks(),
  purchaseArtwork: async (artworkId: string, user: User) => mockBackend.purchaseArtwork(artworkId, user),
  placeBid: async (artworkId: string, user: User, amount: number) => mockBackend.placeBid(artworkId, user, amount),
  getAllUsers: async () => mockBackend.getAllUsers(),
  getExhibitions: async () => mockBackend.getExhibitions(),
  updateExhibition: async (e: Exhibition) => mockBackend.updateExhibition(e),
  createExhibition: async (e: Partial<Exhibition>) => mockBackend.createExhibition(e),
  updateUserRole: async (id: string, role: UserRole) => mockBackend.updateUserRole(id, role),
  updateUser: async (u: User) => mockBackend.updateUser(u),
  toggleUserSuspension: async (id: string) => mockBackend.toggleUserSuspension(id),
  uploadArtwork: async (a: any) => mockBackend.uploadArtwork(a),
  updateArtwork: async (id: string, updates: Partial<Artwork>) => {
    const arts = mockBackend.getArtworks();
    const existing = arts.find(x => x.id === id);
    if(existing) {
      const merged = { ...existing, ...updates };
      mockBackend.updateArtwork(merged);
      return merged;
    }
    return updates as Artwork;
  },
  deleteArtwork: async (id: string) => {
    const arts = mockBackend.getArtworks();
    const updated = arts.filter(a => a.id !== id);
    localStorage.setItem('etheria_artworks', JSON.stringify(updated));
  },
  listArtwork: async (id: string, isListed: boolean, price?: number) => {
    const arts = mockBackend.getArtworks();
    const art = arts.find(a => a.id === id);
    if (art) {
        art.isListed = isListed;
        if (price !== undefined) art.price = price;
        mockBackend.updateArtwork(art);
    }
  },
  endAuction: async (id: string) => mockBackend.endAuction(id),
  getPurchaseHistoryForArtist: async (name: string) => mockBackend.getPurchaseHistoryForArtist(name),
  getCurrentUser: () => mockBackend.getCurrentUser(),
  logout: () => mockBackend.logout(),
};
