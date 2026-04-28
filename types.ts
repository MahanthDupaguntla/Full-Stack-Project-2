
export enum UserRole {
  ADMIN = 'ADMIN',
  ARTIST = 'ARTIST',
  VISITOR = 'VISITOR',
  CURATOR = 'CURATOR'
}

export type SubscriptionType = 'Basic' | 'Premium' | 'Elite' | 'Artist-Pro';

export interface Bid {
  id: string;
  artworkId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
}

export interface PurchaseHistory {
  id: string;
  artworkId: string;
  artworkTitle: string;
  buyerName: string;
  amount: number;
  date: number;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'purchase' | 'bid_fee';
  amount: number;
  date: number;
  description: string;
  status: 'completed' | 'pending' | 'processing';
  paymentMethod: string;
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  year: number;
  imageUrl: string;
  price: number;
  category: string;
  culturalHistory?: string;
  curatorInsight?: string;
  isAuction?: boolean;
  currentBid?: number;
  bidEndTime?: number;
  bids?: Bid[];
  ownerId?: string; // Original creator/artist
  currentOwnerName?: string; // Current owner (collector or artist)
  isListed?: boolean;
}

export interface Exhibition {
  id: string;
  title: string;
  theme: string;
  curatorId: string;
  artworkIds: string[];
  bannerUrl: string;
  description: string;
  status: 'active' | 'upcoming' | 'closed';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  walletBalance: number;
  subscription?: SubscriptionType;
  joinedDate: number;
  totalEarned: number;
  transactions: Transaction[];
  email: string;
  bio?: string;
  isSuspended?: boolean;
}

export interface Sale {
  id: string;
  artworkId: string;
  amount: number;
  date: string;
  buyerName: string;
}
