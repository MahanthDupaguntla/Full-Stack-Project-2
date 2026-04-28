
import { Artwork, User, UserRole, Bid, PurchaseHistory, Exhibition } from '../types';
import { INITIAL_ARTWORKS, INITIAL_EXHIBITIONS } from '../constants';

const ARTWORKS_KEY = 'etheria_artworks';
const USER_KEY = 'etheria_user';
const ALL_USERS_KEY = 'etheria_all_users';
const EXHIBITIONS_KEY = 'etheria_exhibitions';

const MOCK_COLLECTORS: User[] = [
  { id: 'c1', name: 'Ravi Kumar', email: 'ravi.kumar@art.com', role: UserRole.VISITOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi%20Kumar', walletBalance: 125000, subscription: 'Elite', joinedDate: Date.now() - 1000 * 60 * 60 * 24 * 30, totalEarned: 15000, transactions: [] },
  { id: 'c2', name: 'Priya Sharma', email: 'priya.sharma@art.com', role: UserRole.VISITOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya%20Sharma', walletBalance: 45000, subscription: 'Premium', joinedDate: Date.now() - 1000 * 60 * 60 * 24 * 15, totalEarned: 2000, transactions: [] },
  { id: 'c3', name: 'Amit Patel', email: 'amit.patel@art.com', role: UserRole.VISITOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit%20Patel', walletBalance: 1200, subscription: 'Basic', joinedDate: Date.now() - 1000 * 60 * 60 * 24 * 5, totalEarned: 0, transactions: [] },
];

const MOCK_ARTISTS: User[] = [
  { id: 'a1', name: 'Ananya Singh', email: 'ananya.singh@art.com', role: UserRole.ARTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya%20Singh', walletBalance: 8500, subscription: 'Artist-Pro', joinedDate: Date.now() - 1000 * 60 * 60 * 24 * 60, totalEarned: 45000, transactions: [] },
  { id: 'a2', name: 'Rohan Mehta', email: 'rohan.mehta@art.com', role: UserRole.ARTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan%20Mehta', walletBalance: 12000, subscription: 'Artist-Pro', joinedDate: Date.now() - 1000 * 60 * 60 * 24 * 45, totalEarned: 32000, transactions: [] },
  { id: 'a3', name: 'Sanya Reddy', email: 'sanya.reddy@art.com', role: UserRole.ARTIST, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanya%20Reddy', walletBalance: 25000, subscription: 'Artist-Pro', joinedDate: Date.now() - 1000 * 60 * 60 * 24 * 120, totalEarned: 68000, transactions: [] },
];

export const mockBackend = {
  getArtworks: (): Artwork[] => {
    const data = localStorage.getItem(ARTWORKS_KEY);
    if (!data) {
      const arts = INITIAL_ARTWORKS.map(a => ({ ...a, isListed: true }));
      localStorage.setItem(ARTWORKS_KEY, JSON.stringify(arts));
      return arts;
    }
    return JSON.parse(data);
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem(ALL_USERS_KEY);
    if (!data) {
      const all = [...MOCK_COLLECTORS, ...MOCK_ARTISTS, {
        id: 'admin1', name: 'Admin User', email: 'admin@art.com', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', walletBalance: 1000000, joinedDate: Date.now(), totalEarned: 0, transactions: []
      }, {
        id: 'cur1', name: 'Curator Jane', email: 'jane@art.com', role: UserRole.CURATOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane', walletBalance: 50000, joinedDate: Date.now(), totalEarned: 0, transactions: []
      }];
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(all));
      return all;
    }
    return JSON.parse(data);
  },

  updateUserRole: (userId: string, newRole: UserRole) => {
    const users = mockBackend.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].role = newRole;
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
      
      // If updating current user, update session too
      const currentUser = mockBackend.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.role = newRole;
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      }
    }
  },

  updateUser: (user: User) => {
    const users = mockBackend.getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
      
      const currentUser = mockBackend.getCurrentUser();
      if (currentUser && currentUser.id === user.id) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    }
  },

  getExhibitions: (): Exhibition[] => {
    const data = localStorage.getItem(EXHIBITIONS_KEY);
    if (!data) {
      localStorage.setItem(EXHIBITIONS_KEY, JSON.stringify(INITIAL_EXHIBITIONS));
      return INITIAL_EXHIBITIONS;
    }
    return JSON.parse(data);
  },

  updateExhibition: (exhibition: Exhibition) => {
    const exhibitions = mockBackend.getExhibitions();
    const index = exhibitions.findIndex(e => e.id === exhibition.id);
    if (index !== -1) {
      exhibitions[index] = exhibition;
      localStorage.setItem(EXHIBITIONS_KEY, JSON.stringify(exhibitions));
    }
  },

  createExhibition: (ex: Partial<Exhibition>) => {
    const exhibitions = mockBackend.getExhibitions();
    const newEx: Exhibition = {
      id: `ex-${Math.random().toString(36).substr(2, 5)}`,
      title: ex.title || 'New Exhibition',
      theme: ex.theme || 'General',
      curatorId: ex.curatorId || 'unknown',
      artworkIds: ex.artworkIds || [],
      bannerUrl: ex.bannerUrl || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853',
      description: ex.description || '',
      status: ex.status || 'upcoming'
    };
    exhibitions.push(newEx);
    localStorage.setItem(EXHIBITIONS_KEY, JSON.stringify(exhibitions));
    return newEx;
  },

  updateArtwork: (artwork: Artwork) => {
    const artworks = mockBackend.getArtworks();
    const index = artworks.findIndex(a => a.id === artwork.id);
    if (index !== -1) {
      artworks[index] = artwork;
      localStorage.setItem(ARTWORKS_KEY, JSON.stringify(artworks));
    }
  },

  listArtwork: (id: string, isAuction: boolean, price: number, durationHours: number = 24) => {
    const artworks = mockBackend.getArtworks();
    const art = artworks.find(a => a.id === id);
    if (art) {
      art.isAuction = isAuction;
      art.price = price;
      art.isListed = true;
      if (isAuction) {
        art.bidEndTime = Date.now() + (durationHours * 3600000);
        art.currentBid = price;
        art.bids = [];
      }
      mockBackend.updateArtwork(art);
    }
  },

  uploadArtwork: (newArt: Partial<Artwork>) => {
    const artworks = mockBackend.getArtworks();
    const artwork: Artwork = {
      id: Math.random().toString(36).substr(2, 9),
      title: newArt.title || 'Untitled',
      artist: newArt.artist || 'Unknown',
      description: newArt.description || '',
      year: new Date().getFullYear(),
      imageUrl: newArt.imageUrl || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
      price: newArt.price || 1000,
      category: newArt.category || 'General',
      isAuction: newArt.isAuction || false,
      bids: [],
      isListed: true,
      currentOwnerName: newArt.artist,
      ...newArt
    };
    artworks.push(artwork);
    localStorage.setItem(ARTWORKS_KEY, JSON.stringify(artworks));
    return artwork;
  },

  purchaseArtwork: (artworkId: string, user: User) => {
    const artworks = mockBackend.getArtworks();
    const artwork = artworks.find(a => a.id === artworkId);
    if (artwork && !artwork.isAuction && artwork.isListed) {
      if (user.walletBalance < artwork.price) return false;
      
      artwork.isListed = false;
      artwork.currentOwnerName = user.name;
      
      const currentUser = mockBackend.getCurrentUser();
      if (currentUser && currentUser.name === user.name) {
        currentUser.walletBalance -= artwork.price;
        currentUser.transactions.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'purchase',
          amount: artwork.price,
          date: Date.now(),
          description: `Acquisition of ${artwork.title}`,
          status: 'completed',
          paymentMethod: 'ArtWallet'
        });
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      }
      
      mockBackend.updateArtwork(artwork);
      return true;
    }
    return false;
  },

  placeBid: (artworkId: string, user: User, amount: number) => {
    const artworks = mockBackend.getArtworks();
    const artwork = artworks.find(a => a.id === artworkId);
    if (artwork && artwork.isAuction) {
      if (amount <= (artwork.currentBid || 0)) return false;
      
      const newBid: Bid = {
        id: Math.random().toString(36).substr(2, 9),
        artworkId,
        bidderName: user.name,
        amount,
        timestamp: Date.now()
      };
      
      artwork.currentBid = amount;
      artwork.bids = [...(artwork.bids || []), newBid];
      mockBackend.updateArtwork(artwork);
      
      const currentUser = mockBackend.getCurrentUser();
      if (currentUser && currentUser.name === user.name) {
        currentUser.transactions.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'bid_fee',
          amount: 100,
          date: Date.now(),
          description: `Bid placement fee for ${artwork.title}`,
          status: 'completed',
          paymentMethod: 'ArtWallet'
        });
        currentUser.walletBalance -= 100;
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      }
      return true;
    }
    return false;
  },

  endAuction: (id: string) => {
    const artworks = mockBackend.getArtworks();
    const artwork = artworks.find(a => a.id === id);
    if (artwork && artwork.isAuction) {
      artwork.isAuction = false;
      artwork.isListed = false;
      if (artwork.bids && artwork.bids.length > 0) {
        const topBid = artwork.bids[artwork.bids.length - 1];
        artwork.currentOwnerName = topBid.bidderName;
        artwork.price = topBid.amount;
        
        // Handle earnings for the seller
        const seller = mockBackend.getCurrentUser();
        if (seller) {
           seller.totalEarned += topBid.amount;
           seller.walletBalance += topBid.amount;
           seller.transactions.push({
             id: Math.random().toString(36).substr(2, 9),
             type: 'sale',
             amount: topBid.amount,
             date: Date.now(),
             description: `Sale of ${artwork.title}`,
             status: 'completed',
             paymentMethod: 'Direct Deposit'
           });
           localStorage.setItem(USER_KEY, JSON.stringify(seller));
        }
      }
      mockBackend.updateArtwork(artwork);
    }
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Fix: Added missing method required by ArtistDashboard
  getPurchaseHistoryForArtist: (artistName: string): PurchaseHistory[] => {
    // In a real app, this would filter a global purchase history list.
    // Returning an empty array for the mock implementation.
    return [];
  },

  login: (name: string, role: UserRole): User => {
    const users = mockBackend.getAllUsers();
    let existing = users.find(u => u.name === name && u.role === role);
    
    if (existing && existing.isSuspended) {
      throw new Error('Account is suspended by administrator.');
    }
    
    if (!existing) {
      existing = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@art.com`,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        walletBalance: 50000,
        subscription: role === UserRole.VISITOR ? 'Basic' : 'Artist-Pro',
        joinedDate: Date.now(),
        totalEarned: 0,
        transactions: []
      };
      users.push(existing);
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
    }
    
    localStorage.setItem(USER_KEY, JSON.stringify(existing));
    return existing;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  toggleUserSuspension: (userId: string) => {
    const users = mockBackend.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].isSuspended = !users[index].isSuspended;
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
      
      const currentUser = mockBackend.getCurrentUser();
      if (currentUser && currentUser.id === userId && users[index].isSuspended) {
        mockBackend.logout();
      }
    }
  }
};
