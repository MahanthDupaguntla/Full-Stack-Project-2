import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { UserRole, Artwork, User } from './types';
import Navbar from './components/Navbar';
import { hybridBackend } from './services/apiService';
import { toINRString } from './utils/currency';
import { INITIAL_EXHIBITIONS } from './constants';
import { getGalleryGuideResponse } from './services/geminiService';

const ArtworkDetails = lazy(() => import('./components/ArtworkDetails'));
const VirtualTour = lazy(() => import('./components/VirtualTour'));
const AuthFlow = lazy(() => import('./components/AuthFlow'));
const AuctionHouse = lazy(() => import('./components/AuctionHouse'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const ArtistDashboard = lazy(() =>
  import('./components/Dashboards').then((module) => ({ default: module.ArtistDashboard }))
);
const CuratorDashboard = lazy(() =>
  import('./components/Dashboards').then((module) => ({ default: module.CuratorDashboard }))
);
const AdminDashboard = lazy(() =>
  import('./components/Dashboards').then((module) => ({ default: module.AdminDashboard }))
);
const VisitorDashboard = lazy(() =>
  import('./components/Dashboards').then((module) => ({ default: module.VisitorDashboard }))
);

 

// ─── AI Assistant ─────────────────────────────────────────────────────────────
const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    {
      role: 'ai',
      text: "Welcome to ArtForge! 🎨 I'm your gallery guide. Ask me about artworks, artists, or how to navigate the gallery.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    const response = await getGalleryGuideResponse(userMsg, []);
    setMessages((prev) => [
      ...prev,
      { role: 'ai', text: response || 'Let me think about that...' },
    ]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-28 right-3 lg:bottom-6 lg:right-6 z-[190]">
      {isOpen ? (
        <div className="glass w-[calc(100vw-24px)] sm:w-[340px] h-[400px] lg:h-[520px] max-h-[65vh] lg:max-h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 animate-fadeInUp fixed bottom-28 right-3 lg:bottom-6 lg:right-6">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">Gallery Guide</h3>
                <p className="text-[9px] text-amber-500/70 uppercase tracking-widest font-semibold">
                  AI Powered
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <span className="text-[8px] text-amber-500 font-black">AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-medium ${
                    m.role === 'user'
                      ? 'bg-amber-500 text-black rounded-tr-sm'
                      : 'bg-white/6 text-zinc-200 rounded-tl-sm border border-white/8'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 pl-8">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-white/8">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any artwork..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="w-9 h-9 bg-amber-500 hover:bg-amber-400 rounded-xl flex items-center justify-center text-black transition-all btn-shine flex-shrink-0 shadow-lg shadow-amber-500/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center shadow-[0_8px_30px_rgba(245,158,11,0.4)] hover:shadow-[0_8px_40px_rgba(245,158,11,0.6)] hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Open AI Guide"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ─── Stats Ticker ─────────────────────────────────────────────────────────────
const StatsTicker: React.FC<{ artworks: Artwork[] }> = ({ artworks }) => {
  const items = [
    `🎨 ${artworks.length} Artworks Listed`,
    `🔥 ${artworks.filter((a) => a.isAuction).length} Live Auctions`,
    `💰 Top Sale: ${toINRString(Math.max(...artworks.map((a) => a.price)))}`,
    `🌍 Artists from 24 Countries`,
    `⚡ Real-time Bidding Active`,
    `🏛️ 3 Curated Exhibitions`,
    `✨ New arrivals every week`,
  ];
  const doubled = [...items, ...items];
  return (
    <div className="w-full overflow-hidden bg-amber-500/8 border-t border-b border-amber-500/10 py-2 sm:py-2.5">
      <div className="ticker-wrap">
        <div className="ticker-inner animate-ticker">
          {doubled.map((item, i) => (
            <span
              key={i}
              className="text-[9px] sm:text-[10px] font-semibold text-amber-500/70 uppercase tracking-widest px-6 sm:px-8 flex-shrink-0"
            >
              {item} <span className="text-amber-500/30 mx-3 sm:mx-4">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const SectionLoader: React.FC<{ label?: string }> = ({ label = 'Loading ArtForge experience...' }) => (
  <div className="flex min-h-[40vh] items-center justify-center px-6 py-20">
    <div className="glass max-w-md rounded-[2rem] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-amber-500" />
      <p className="text-sm uppercase tracking-[0.3em] text-amber-500/80">ArtForge</p>
      <p className="mt-3 text-sm font-medium text-zinc-300">{label}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'gallery'|'exhibitions'|'auctions'|'dashboard'|'sold'|'timeline'|'profile'|'login'|'cart'|'checkout'>('login');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Artwork[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  useEffect(() => { hybridBackend.init().then(() => { hybridBackend.fetchCurrentUser().then((user) => { setCurrentUser(user); if (user) setActiveView('gallery'); setIsAuthLoading(false); }); hybridBackend.getArtworks().then(setArtworks); }); }, []);
  const addToCart = (art: Artwork) => { if (!cart.find(c => c.id === art.id)) setCart(prev => [...prev, art]); };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));
  const cartTotal = cart.reduce((sum, a) => sum + a.price, 0);
  const handleCheckout = async () => { if (!currentUser || cart.length === 0) return; for (const art of cart) { await hybridBackend.purchaseArtwork(art.id, currentUser); } setCart([]); await refreshData(); const u = await hybridBackend.fetchCurrentUser(); if (u) setCurrentUser(u); setActiveView('gallery'); };
  const refreshData = async () => { const a = await hybridBackend.getArtworks(); setArtworks(a); };
  const handleLogout = () => { hybridBackend.logout(); setCurrentUser(null); setActiveView('login'); };
  const handleArtworkAction = async (art: Artwork) => { if (!currentUser) { alert('Please sign in.'); return; } if (art.isAuction) { setActiveView('auctions'); setSelectedArtwork(null); return; } const success = await hybridBackend.purchaseArtwork(art.id, currentUser); if (success) { await refreshData(); const updatedUser = await hybridBackend.fetchCurrentUser(); if (updatedUser) setCurrentUser(updatedUser); setSelectedArtwork(null); } };
  const filteredArtworks = artworks.filter((a) => { const q = searchQuery.toLowerCase(); return (a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)) && (activeCategory === 'All' || a.category === activeCategory) && (activeView === 'sold' ? !a.isListed : a.isListed); });
  const categories = ['All', ...Array.from(new Set(artworks.map((a) => a.category)))];
  const renderContent = () => {
    if (activeView === 'login' || !currentUser) { return (<AuthFlow onLogin={(u) => { setCurrentUser(u); setActiveView('gallery'); }} />); }
    if (activeView === 'dashboard') {
      if (!currentUser) {
        return (
          <div className="flex flex-col items-center justify-center py-20 sm:py-40 text-center animate-fadeIn px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 sm:mb-8 border border-amber-500/20">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4 italic">
              Protected Sanctuary
            </h2>
            <p className="text-zinc-500 max-w-sm mb-10 leading-relaxed font-light text-sm sm:text-base">
              Access to your private dashboard requires authentication. Join the collective to
              manage your collection.
            </p>
            <button
              onClick={() => setActiveView('login')}
              className="bg-white text-black px-10 sm:px-12 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:bg-amber-500 transition-all shadow-xl text-sm"
            >
              Authenticate Now →
            </button>
          </div>
        );
      }
      switch (currentUser.role) {
        case UserRole.ARTIST:
          return <ArtistDashboard artworks={artworks} user={currentUser} onUpdateUser={setCurrentUser} />;
        case UserRole.CURATOR:
          return <CuratorDashboard user={currentUser} onUpdateUser={setCurrentUser} />;
        case UserRole.ADMIN:
          return <AdminDashboard user={currentUser} onUpdateUser={setCurrentUser} />;
        default:
          return <VisitorDashboard artworks={artworks} user={currentUser} onUpdateUser={setCurrentUser} />;
      }
    }
    if (activeView === 'profile') {
      return <UserProfile user={currentUser} artworks={artworks} onUpdateUser={setCurrentUser} />;
    }
    if (activeView === 'auctions') {
      return (
        <AuctionHouse
          user={currentUser!}
          artworks={artworks}
          onBidUpdate={refreshData}
          onSelectArtwork={setSelectedArtwork}
          onBackToGallery={() => setActiveView('gallery')}
          searchQuery={searchQuery}
        />
      );
    }
    if (activeView === 'exhibitions') {
      return (
        <div className="space-y-12 sm:space-y-20 animate-fadeIn py-4 sm:py-8 px-2">
          <header className="max-w-3xl">
            <span className="tag-pill mb-4 sm:mb-5 inline-block">Current Narratives</span>
            <h2 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-5 italic leading-tight">
              Curated <span className="text-gold">Exhibitions</span>
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base font-light leading-relaxed max-w-xl">
              Discover thematic landscapes and conceptual explorations curated by our global network
              of art historians and visionaries.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {INITIAL_EXHIBITIONS.filter(
              (ex) =>
                !searchQuery ||
                ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.description.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((ex, idx) => (
              <div
                key={ex.id}
                className="group cursor-pointer animate-fadeIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="relative h-[360px] sm:h-[420px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-700 hover:border-amber-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                  <img
                    src={ex.bannerUrl}
                    className="w-full h-full object-cover grayscale transition-all duration-[2s] group-hover:scale-110 group-hover:grayscale-0"
                    alt={ex.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute top-4 sm:top-5 left-4 sm:left-5">
                    <span
                      className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border ${ex.status === 'active' ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'}`}
                    >
                      {ex.status}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <h3 className="text-2xl sm:text-3xl font-serif text-white mb-2 sm:mb-3 font-bold italic leading-tight group-hover:text-amber-200 transition-colors uppercase tracking-tight">
                      {ex.title}
                    </h3>
                    <p className="text-zinc-400 text-[10px] sm:text-xs mb-4 sm:mb-5 leading-relaxed sm:opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {ex.description}
                    </p>
                    <button className="btn-shine bg-white/10 hover:bg-amber-500 text-white hover:text-black border border-white/10 hover:border-amber-500 px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black transition-all uppercase tracking-widest">
                      Enter Exhibition →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (activeView === 'timeline') {
      return (
        <div className="animate-fadeIn py-4 sm:py-8 max-w-3xl mx-auto px-2 sm:px-4">
          <header className="mb-10 sm:mb-16">
            <span className="tag-pill mb-4 sm:mb-5 inline-block">Platform Ledger</span>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4 italic">
              Event <span className="text-gold">Timeline</span>
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm font-light leading-relaxed">
              Real-time chronicle of acquisitions, bid placements, and gallery expansions.
            </p>
          </header>
          <div className="space-y-6 sm:space-y-8 relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/30 via-amber-500/10 to-transparent" />
            {[
              {
                type: 'Acquisition',
                icon: '🛒',
                user: 'Julian Reed',
                item: 'Echoes of Eternity',
                price: toINRString(4500),
                time: '2 hours ago',
                color: 'text-green-400 bg-green-400/10 border-green-400/20',
              },
              {
                type: 'New Bid',
                icon: '🔥',
                user: 'Sanya Reddy',
                item: 'Neon Renaissance',
                price: toINRString(7500),
                time: '4 hours ago',
                color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
              },
              {
                type: 'Exhibition Launch',
                icon: '🏛️',
                user: 'Admin',
                item: 'Digital Horizons',
                price: 'Active',
                time: '1 day ago',
                color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
              },
              {
                type: 'Asset Listed',
                icon: '✨',
                user: 'Ananya Singh',
                item: 'Kinetic Solitude',
                price: toINRString(5600),
                time: '2 days ago',
                color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
              },
              {
                type: 'Bid Placed',
                icon: '⚡',
                user: 'Marcus Thorne',
                item: 'Celestial Pulse',
                price: toINRString(6200),
                time: '3 days ago',
                color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
              },
            ].map((event, i) => (
              <div
                key={i}
                className="flex gap-4 sm:gap-6 items-start relative pl-10 sm:pl-12 group animate-fadeIn"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="absolute left-0 top-1 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-900 border border-white/8 flex items-center justify-center z-10 group-hover:border-amber-500/40 transition-all shadow-lg">
                  <span className="text-sm">{event.icon}</span>
                </div>
                <div className="flex-1 glass-light p-4 sm:p-5 rounded-xl sm:rounded-2xl group-hover:border-white/12 transition-all">
                  <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                    <span
                      className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 sm:py-1 rounded-full border ${event.color}`}
                    >
                      {event.type}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-zinc-600 font-semibold">
                      {event.time}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white mt-3 leading-relaxed">
                    <span className="text-amber-400">{event.user}</span>
                    <span className="font-normal text-zinc-400"> interacted with </span>
                    <span className="italic">"{event.item}"</span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                    Value: <span className="text-white font-bold">{event.price}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ─── GALLERY VIEW ──────────────────────────────────────────────────────────
    return (
      <div className="space-y-16 sm:space-y-28 animate-fadeIn">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] sm:min-h-[75vh] flex flex-col justify-end px-4 sm:px-8 pb-10 sm:pb-16 overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2500"
              className="w-full h-full object-cover"
              alt="Hero"
            />
            <div className="absolute inset-0 hero-overlay" />
          </div>

          {/* Floating orbs */}
          <div className="absolute top-10 right-10 w-40 h-40 sm:w-80 sm:h-80 rounded-full bg-amber-500/5 blur-3xl animate-orb pointer-events-none" />
          <div
            className="absolute bottom-20 left-4 w-32 h-32 sm:w-60 sm:h-60 rounded-full bg-indigo-500/5 blur-3xl animate-orb pointer-events-none"
            style={{ animationDelay: '8s' }}
          />

          {/* Badge top */}
          <div className="absolute top-6 sm:top-10 left-4 sm:left-8 z-10">
            <div className="flex items-center gap-2 glass-light px-3 sm:px-4 py-1.5 sm:py-2 rounded-full animate-fadeIn shadow-lg">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/70">
                Gallery Open · Live Bidding
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 animate-fadeIn">
              <div className="h-px w-6 sm:w-10 bg-amber-500/60" />
              <span className="text-amber-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em]">
                Premium Art Sanctuary
              </span>
            </div>
            <h1 className="text-4xl sm:text-7xl md:text-9xl font-serif font-bold leading-[1.1] sm:leading-none mb-6 animate-fadeIn delay-100 italic">
              <span className="text-white">Art</span>
              <span className="text-gold">Forge</span>
            </h1>
            <p className="text-zinc-300 text-sm sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-sm sm:max-w-lg font-light leading-relaxed animate-fadeIn delay-200">
              Transcending the physical. Preserving the eternal. The world's most evocative digital
              art holding.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 animate-fadeIn delay-300">
              <button
                onClick={() => setIsTourActive(true)}
                className="btn-shine bg-white text-black px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-amber-400 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center gap-2 sm:gap-3"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Virtual Tour
              </button>
              <button
                onClick={() => setActiveView('auctions')}
                className="live-badge px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full animate-pulse" />
                Live Auctions
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="hidden sm:flex absolute bottom-8 right-8 z-10 gap-6 animate-fadeIn delay-500">
            {[
              { label: 'Artists', value: '120+' },
              { label: 'Artworks', value: '500+' },
              { label: 'Collectors', value: '2.4K' },
            ].map((stat) => (
              <div key={stat.label} className="text-right">
                <p className="text-2xl font-serif font-bold text-white">{stat.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Ticker */}
        <StatsTicker artworks={artworks} />

        {/* Gallery Section */}
        <section>
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-12 gap-4 sm:gap-6 px-1">
            <div className="animate-fadeIn">
              <span className="tag-pill mb-3 sm:mb-4 inline-block">Archive Directory</span>
              <h2 className="text-4xl sm:text-5xl font-serif text-white italic font-bold">
                The <span className="text-gold">Portfolio</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-zinc-500 font-semibold animate-fadeIn delay-200">
              <span>Showing</span>
              <span className="text-white bg-amber-500/10 border border-amber-500/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-bold">
                {filteredArtworks.length}
              </span>
              <span>available works</span>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8 sm:mb-12 animate-fadeIn no-scrollbar overflow-x-auto pb-2 -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-black shadow-[0_8px_20px_rgba(245,158,11,0.3)]'
                    : 'bg-white/4 border border-white/8 text-zinc-500 hover:text-white hover:border-white/15 hover:bg-white/6'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Art Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredArtworks.map((art, idx) => (
              <div
                key={art.id}
                className="group cursor-pointer artwork-card animate-fadeIn"
                style={{ animationDelay: `${idx * 0.06}s` }}
                onClick={() => setSelectedArtwork(art)}
                onMouseEnter={() => setHoveredCard(art.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Image Container */}
                <div className="relative overflow-hidden aspect-[4/5] mb-4 sm:mb-5 rounded-[1.5rem] sm:rounded-[1.75rem] bg-zinc-950 border border-white/5">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover transition-all duration-[2s] group-hover:scale-110 group-hover:opacity-50"
                  />

                  {/* Hover overlay — visible only on hover or tablet/mobile has tap */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="bg-white text-black px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl btn-shine">
                      View Details
                    </div>
                    <span className="text-zinc-300 text-[8px] sm:text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                      Click to explore
                    </span>
                  </div>

                  {/* Badges */}
                  {art.isAuction && (
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                      <div className="live-badge scale-90 sm:scale-100">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        Live
                      </div>
                    </div>
                  )}
                  {!art.isListed && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] border-2 border-white/20 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl rotate-[-10deg]">
                        Sold
                      </span>
                    </div>
                  )}

                  {/* Category label bottom-left */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-white/60 bg-black/60 px-2 sm:2.5 px-1 py-1 rounded-lg backdrop-blur-sm">
                      {art.category}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="px-1">
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white group-hover:text-amber-400 transition-colors leading-tight italic mb-1 uppercase tracking-tight">
                    {art.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-3 h-px bg-amber-500/40" />
                    <p className="text-zinc-500 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest truncate max-w-[120px]">
                      {art.artist}
                    </p>
                    <span className="text-zinc-700">·</span>
                    <p className="text-zinc-600 text-[9px] sm:text-[10px]">{art.year}</p>
                  </div>
                  <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-white/5">
                    <p className="text-white font-bold text-base sm:text-lg">
                      {toINRString(art.price)}
                    </p>
                    {art.isAuction && art.currentBid && (
                      <div className="text-right">
                        <p className="text-[7px] sm:text-[8px] text-zinc-600 uppercase tracking-widest font-bold">
                          Current Bid
                        </p>
                        <p className="text-amber-400 font-bold text-xs">
                          {toINRString(art.currentBid)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredArtworks.length === 0 && (
              <div className="col-span-full py-20 sm:py-40 text-center">
                <p className="text-4xl sm:text-5xl mb-4">🔍</p>
                <p className="text-zinc-500 italic font-serif text-xl sm:text-2xl font-light">
                  No works found in the archive.
                </p>
                <p className="text-zinc-700 text-xs sm:text-sm mt-2">
                  Try adjusting your search or category filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }}
                  className="mt-6 text-amber-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  Clear Filters →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="pb-10 sm:pb-20 px-1">
          <div className="relative glass rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-16 border border-white/5 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 sm:left-20 w-32 h-32 sm:w-64 sm:h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row justify-between items-center gap-8 sm:gap-12 text-center lg:text-left">
              <div className="max-w-lg">
                <span className="tag-pill mb-4 sm:mb-5 inline-block">Membership</span>
                <h3 className="text-3xl sm:text-4xl font-serif text-white mb-4 sm:mb-5 italic font-bold leading-tight uppercase tracking-tight">
                  Join the inner circle of <span className="text-gold">sovereign collectors</span>
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base font-light leading-relaxed">
                  Early access to masterworks, curatorial reports, private auction invitations, and
                  exclusive artist meetups.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-white outline-none focus:border-amber-500/50 w-full sm:w-72 text-sm font-medium placeholder:text-zinc-600 transition-all text-center sm:text-left"
                />
                <button className="btn-shine bg-amber-500 hover:bg-amber-400 text-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.35)] whitespace-nowrap uppercase tracking-widest">
                  Get Access →
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, show only the auth flow (no navbar, no bottom nav)
  if (!currentUser || activeView === 'login') {
    return (
      <>
        <Suspense fallback={<SectionLoader label="Loading authentication..." />}>
          {renderContent()}
        </Suspense>
        <AiAssistant />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        user={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />
      <main className="pt-24 sm:pt-44 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <Suspense fallback={<SectionLoader />}>{renderContent()}</Suspense>
      </main>
      {selectedArtwork && (
        <Suspense fallback={<SectionLoader label="Loading artwork details..." />}>
          <ArtworkDetails
            artwork={selectedArtwork}
            onClose={() => setSelectedArtwork(null)}
            onAction={handleArtworkAction}
            user={currentUser}
          />
        </Suspense>
      )}
      {isTourActive && (
        <Suspense fallback={<SectionLoader label="Opening virtual tour..." />}>
          <VirtualTour artworks={artworks} onClose={() => setIsTourActive(false)} />
        </Suspense>
      )}
      <AiAssistant />

      {/* --- Mobile Bottom Navigation --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-[200] lg:hidden animate-fadeInUp">
        <div className="glass mx-3 mb-4 rounded-2xl sm:rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] px-2 py-2.5 flex items-center justify-around">
          {[
            {
              id: 'gallery',
              label: 'Explore',
              icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            },
            {
              id: 'exhibitions',
              label: 'Curated',
              icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
            },
            {
              id: 'auctions',
              label: 'Live',
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              badge: artworks.filter((a) => a.isAuction).length,
            },
            {
              id: 'dashboard',
              label: 'Dashboard',
              icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            },
            {
              id: 'profile',
              label: 'Account',
              icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
            },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveView(link.id as any)}
              className={`p-2.5 rounded-xl transition-all duration-300 relative ${
                activeView === link.id
                  ? 'bg-amber-500/15 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'text-zinc-600 hover:text-white'
              }`}
            >
              <svg
                className="w-5 h-5 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
              </svg>
              <span
                className={`text-[8px] uppercase tracking-widest font-black block mt-1 ${activeView === link.id ? 'opacity-100' : 'opacity-0'}`}
              >
                {link.label}
              </span>
              {link.badge && link.id === 'auctions' && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-[7px] text-white font-bold rounded-full flex items-center justify-center border border-black animate-pulse">
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;
