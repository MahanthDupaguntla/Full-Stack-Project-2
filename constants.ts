import { Artwork, Exhibition } from './types';

export const INITIAL_ARTWORKS: Artwork[] = [
  {
    id: '1',
    title: 'Echoes of Eternity',
    artist: 'Elena Vance',
    description:
      'An abstract exploration of time and memory using layered gold leaf and deep cerulean pigments.',
    year: 2023,
    imageUrl:
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1000',
    price: 4500,
    category: 'Abstract',
    isAuction: true,
    currentBid: 4200,
    bidEndTime: Date.now() + 1000 * 60 * 60 * 24,
    bids: [
      {
        id: 'b1',
        artworkId: '1',
        bidderName: 'John Doe',
        amount: 4200,
        timestamp: Date.now() - 50000,
      },
    ],
  },
  {
    id: '2',
    title: 'The Silent Watcher',
    artist: 'Marcus Thorne',
    description: 'A hyper-realistic charcoal portrait capturing the wisdom of the coastal elders.',
    year: 2022,
    imageUrl:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000',
    price: 3200,
    category: 'Realism',
  },
  {
    id: '3',
    title: 'Neon Renaissance',
    artist: 'Sora Kim',
    description:
      'Classic sculpture forms reimagined with cyberpunk aesthetic and digital projections.',
    year: 2024,
    imageUrl:
      'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1000',
    price: 8900,
    category: 'Mixed Media',
    isAuction: true,
    currentBid: 7500,
    bidEndTime: Date.now() + 1000 * 60 * 60 * 2,
    bids: [],
  },
  {
    id: '4',
    title: 'Whispers of the Tundra',
    artist: 'Anya Petrov',
    description: 'A minimalist landscape piece evoking the vast, chilling beauty of the Arctic.',
    year: 2023,
    imageUrl:
      'https://images.unsplash.com/photo-1501472312651-726afe119ff1?auto=format&fit=crop&q=80&w=1000',
    price: 2100,
    category: 'Minimalism',
  },
  {
    id: '5',
    title: 'Kinetic Solitude',
    artist: 'David Chen',
    description:
      'A study of movement in stillness, representing the urban flow through long-exposure painting techniques.',
    year: 2024,
    imageUrl:
      'https://images.unsplash.com/photo-1515405290399-ed34273bb427?auto=format&fit=crop&q=80&w=1000',
    price: 5600,
    category: 'Abstract',
    isAuction: true,
    currentBid: 5100,
    bidEndTime: Date.now() + 1000 * 60 * 60 * 5,
    bids: [],
  },
  {
    id: '6',
    title: 'The Glass Horizon',
    artist: 'Isabella Ross',
    description: 'A breathtaking digital render of a futuristic skyline reflected in a calm ocean.',
    year: 2023,
    imageUrl:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000',
    price: 12000,
    category: 'Digital',
  },
  {
    id: '7',
    title: 'Velvet Shadows',
    artist: 'Julian Reed',
    description: 'An intimate oil painting exploring light and shadow in a silent corridor.',
    year: 2022,
    imageUrl:
      'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=1000',
    price: 3800,
    category: 'Oil',
  },
  {
    id: '8',
    title: 'Celestial Pulse',
    artist: 'Sora Kim',
    description: 'Dynamic swirls of ultraviolet and deep violet, mimicking the birth of a star.',
    year: 2024,
    imageUrl:
      'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1000',
    price: 6400,
    category: 'Abstract',
    isAuction: true,
    currentBid: 6000,
    bidEndTime: Date.now() + 1000 * 60 * 60 * 12,
    bids: [],
  },
];

export const INITIAL_EXHIBITIONS: Exhibition[] = [
  {
    id: 'ex-1',
    title: 'Digital Horizons',
    theme: 'Technology & Human Nature',
    curatorId: 'cur-1',
    artworkIds: ['1', '3', '6'],
    bannerUrl:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
    description: 'Exploring the intersection of classical art techniques and the digital age.',
    status: 'active',
  },
  {
    id: 'ex-2',
    title: 'The Silent Era',
    theme: 'Black & White Narratives',
    curatorId: 'cur-1',
    artworkIds: ['2', '4', '7'],
    bannerUrl:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1200',
    description: 'A collection focused on the power of monochrome storytelling.',
    status: 'active',
  },
  {
    id: 'ex-3',
    title: 'Quantum Aesthetics',
    theme: 'Science in Art',
    curatorId: 'cur-2',
    artworkIds: ['5', '8'],
    bannerUrl:
      'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=1200',
    description: 'Visualizing the invisible laws of physics through vibrant abstract forms.',
    status: 'upcoming',
  },
];
