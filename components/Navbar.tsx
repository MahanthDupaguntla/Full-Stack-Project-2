
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Logo from './Logo';
import { toINRString } from '../utils/currency';

interface NavbarProps {
  user: User | null;
  activeView: 'gallery' | 'exhibitions' | 'auctions' | 'dashboard' | 'sold' | 'timeline' | 'profile' | 'login';
  onViewChange: (view: any) => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Navbar: React.FC<NavbarProps> = ({ user, activeView, onViewChange, onLogout, onSearch, searchQuery }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const getDashboardLabel = () => {
    if (!user) return 'Sanctuary';
    switch (user.role) {
      case 'ARTIST': return 'Studio';
      case 'CURATOR': return 'Curatorial';
      case 'ADMIN': return 'Control';
      default: return 'Sanctuary';
    }
  };

  const navLinks = [
    { id: 'gallery', label: 'Gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'auctions', label: 'Auctions', icon: 'M13 10V3L4 14h7v7l9-11h-7z', badge: 'LIVE' },
    { id: 'exhibitions', label: 'Exhibitions', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'dashboard', label: getDashboardLabel(), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'timeline', label: 'Ledger', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-2 sm:py-3' : 'py-3 sm:py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`glass rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-3 flex items-center gap-2 sm:gap-4 transition-all duration-500 ${scrolled ? 'shadow-[0_20px_60px_rgba(0,0,0,0.6)]' : 'shadow-[0_10px_30px_rgba(0,0,0,0.3)]'}`}>

            {/* Logo */}
            <div className="cursor-pointer flex-shrink-0 scale-90 sm:scale-100" onClick={() => onViewChange('gallery')}>
              <Logo size="md" showTagline={false} />
            </div>

            {/* Nav Links — Desktop */}
            <div className="hidden lg:flex items-center gap-1 flex-1 ml-4">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => onViewChange(link.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    activeView === link.id
                      ? 'bg-amber-500/12 text-amber-400 border border-amber-500/20'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/4'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={link.icon} />
                  </svg>
                  <span className="text-[11px] font-semibold tracking-wide">{link.label}</span>
                  {link.badge && (
                    <span className="text-[7px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                  {activeView === link.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Search — Universal Visibility */}
            <div className="flex-grow max-w-sm lg:flex-none lg:w-56 relative group mx-2">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 transition-colors group-focus-within:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white/4 border border-white/8 rounded-xl py-2 pl-8 pr-8 text-[10px] text-white outline-none focus:border-amber-500/40 focus:bg-white/6 transition-all placeholder:text-zinc-600 font-medium"
              />
              {searchQuery && (
                <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Mobile Wallet Display */}
            {user && (
              <div className="flex lg:hidden items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl ml-2 overflow-hidden flex-shrink-0">
                <span className="text-[10px] font-bold text-amber-500">{toINRString(user.walletBalance)}</span>
              </div>
            )}

            {/* Hamburger — Mobile Only */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex flex-col items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ml-auto flex-shrink-0"
              aria-label="Toggle menu"
            >
              <span className={`block w-4 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
              <span className={`block w-4 h-0.5 bg-white rounded-full transition-all duration-300 my-[3px] ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-4 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
            </button>

            {/* User / Auth Section */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 lg:ml-0">
              {user ? (
                <>
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] text-white font-bold tracking-wide leading-none">{user.name}</p>
                    <p className="text-[8px] text-amber-500/60 uppercase tracking-widest font-semibold mt-0.5">{user.role}</p>
                  </div>

                  <div className="relative group">
                    <div 
                      onClick={() => { if(window.innerWidth < 1024) onViewChange('profile'); }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 cursor-pointer overflow-hidden hover:border-amber-500/50 transition-all shadow-lg active:scale-95"
                    >
                      <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                    </div>

                    {/* Dropdown — Desktop only */}
                    <div className="hidden lg:block absolute right-0 top-full pt-3 opacity-0 -translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                      <div className="glass rounded-2xl p-4 w-56 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10">
                        <div className="flex items-center gap-3 pb-4 border-b border-white/8 mb-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                            <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-white font-bold truncate">{user.name}</p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{user.role}</p>
                          </div>
                        </div>
                        <div className="mb-3 p-3 bg-amber-500/8 border border-amber-500/12 rounded-xl">
                          <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1 font-semibold text-center">Wallet Balance</p>
                          <p className="text-base font-bold text-white text-center">{toINRString(user.walletBalance)}</p>
                        </div>
                        <div className="space-y-1.5">
                          <button onClick={() => onViewChange('profile')} className="w-full text-left px-3 py-2.5 bg-white/4 hover:bg-white/8 text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all flex items-center gap-2">
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                             View Profile
                          </button>
                          <button onClick={onLogout} className="w-full text-left px-3 py-2.5 bg-red-500/8 hover:bg-red-500/15 text-red-400 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all flex items-center gap-2">
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                             Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => onViewChange('login')}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Drawer Menu */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] z-[70] glass border-l border-white/10 transition-transform duration-500 transform lg:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-6 pt-20">
          {/* Close button */}
          <button onClick={() => setMobileOpen(false)} className="absolute top-5 right-5 text-zinc-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-4 ml-2">Navigation</p>
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => { onViewChange(link.id); setMobileOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                  activeView === link.id
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-widest">{link.label}</span>
                </div>
                {link.badge && <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">{link.badge}</span>}
              </button>
            ))}
          </div>

          {user && (
            <div className="mt-auto pb-8">
              <div className="sep mb-6" />
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">{user.name}</p>
                  <p className="text-[9px] text-amber-500/60 uppercase tracking-widest font-black">{user.role}</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/8 mb-4">
                <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Wallet Balance</p>
                <p className="text-lg font-bold text-white">{toINRString(user.walletBalance)}</p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => { onViewChange('profile'); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest">My Profile</span>
                </button>
                <button
                  onClick={() => { onLogout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav is rendered in App.tsx */}
    </>
  );
};

export default Navbar;
