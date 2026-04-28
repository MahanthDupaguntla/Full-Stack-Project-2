
import React, { useState, useEffect } from 'react';
import { Artwork, User, Bid } from '../types';
import { hybridBackend } from '../services/apiService';
import { toINRString } from '../utils/currency';

interface Props {
  user: User;
  artworks: Artwork[];
  onBidUpdate: () => void;
  onSelectArtwork: (art: Artwork) => void;
  onBackToGallery: () => void;
}

const AuctionHouse: React.FC<Props & { searchQuery?: string }> = ({ user, artworks, onBidUpdate, onSelectArtwork, onBackToGallery, searchQuery = "" }) => {
  const auctions = artworks.filter(a => {
    const isMatched = a.isAuction;
    const matchesSearch = !searchQuery || 
      (a.title && a.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (a.artist && a.artist.toLowerCase().includes(searchQuery.toLowerCase()));
    return isMatched && matchesSearch;
  });
  const [timers, setTimers] = useState<Record<string, string>>({});
  const [showTimelineId, setShowTimelineId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: Record<string, string> = {};
      auctions.forEach(art => {
        const remaining = (art.bidEndTime || 0) - Date.now();
        if (remaining <= 0) {
          newTimers[art.id] = "CLOSED";
        } else {
          const hours = Math.floor(remaining / 3600000);
          const minutes = Math.floor((remaining % 3600000) / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          newTimers[art.id] = `${hours}h ${minutes}m ${seconds}s`;
        }
      });
      setTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [auctions]);

  const handleQuickBid = async (artworkId: string, currentBid: number) => {
    const bidAmount = (currentBid || 0) + 500;
    const success = await hybridBackend.placeBid(artworkId, user, bidAmount);
    if (success) onBidUpdate();
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-fadeIn relative pb-10 sm:pb-20 px-2 sm:px-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-4 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
          <button 
            onClick={onBackToGallery}
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-zinc-400 hover:text-white"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Exit Floor</span>
          </button>
          <div className="w-full sm:w-auto">
            <h2 className="text-4xl sm:text-5xl font-serif text-white italic leading-tight">The <span className="text-gold">Auction</span> House</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              <p className="text-zinc-500 text-[9px] uppercase tracking-[0.2em] font-black">Live Stream Active • 4,209 Online</p>
            </div>
          </div>
        </div>
          <div className="w-full sm:w-auto bg-zinc-900/60 backdrop-blur-xl border border-white/8 px-6 py-4 rounded-2xl md:text-right shadow-2xl">
          <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-1 leading-none">Trading Wallet</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-500 tabular-nums">{toINRString(user.walletBalance)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10">
        {auctions.map(art => (
          <div key={art.id} className="group bg-[#0a0a0a] border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-full shadow-2xl hover:border-amber-500/20 transition-all duration-700">
            {/* Visual Section */}
            <div className="w-full md:w-5/12 relative h-[300px] sm:h-80 md:h-auto overflow-hidden bg-black flex items-center justify-center">
              <img src={art.imageUrl} className="w-full h-full object-cover transition-all duration-[2s] group-hover:scale-110 opacity-80 group-hover:opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-transparent to-transparent" />
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex flex-col gap-2">
                <div className="bg-black/80 backdrop-blur-md text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest border border-amber-500/20 shadow-xl uppercase">
                  {timers[art.id] || "Syncing..." }
                </div>
                <button 
                  onClick={() => setShowTimelineId(art.id)}
                  className="bg-white/10 backdrop-blur-md text-white hover:bg-amber-500 hover:text-black px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-lg flex items-center gap-2 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Events
                </button>
              </div>
            </div>
            
            {/* Control Section */}
            <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col relative z-10">
              <div className="flex-1">
                <div className="mb-4">
                  <h3 className="text-2xl sm:text-3xl font-serif italic text-white leading-tight uppercase tracking-tight">{art.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-amber-500/40"></span>
                    {art.artist}
                  </p>
                </div>
                
                <div className="mb-6 space-y-3">
                   <h4 className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-black">History (Live)</h4>
                   <div className="space-y-1.5 h-20 overflow-y-auto pr-2 no-scrollbar">
                      {art.bids && art.bids.length > 0 ? (
                        art.bids.slice().reverse().slice(0, 3).map((bid, idx) => (
                          <div key={bid.id} className={`flex justify-between items-center text-[10px] px-3 py-2 rounded-lg transition-all ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/20 font-black text-amber-300' : 'text-zinc-600 font-semibold'}`}>
                            <span className="truncate">{bid.bidderName}</span>
                            <span className="tabular-nums">{toINRString(bid.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-700 italic font-medium px-2 py-4 border border-dashed border-white/5 rounded-xl text-center">Open for bidding.</p>
                      )}
                   </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-6 sm:mb-8 group/val transition-all hover:bg-white/[0.07]">
                  <div className="flex flex-col items-center sm:items-end gap-1">
                    <span className="text-[9px] uppercase text-zinc-500 font-black tracking-[0.3em] mb-1">Current Highest Value</span>
                    <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums group-hover/val:text-gold transition-colors">{toINRString(art.currentBid || art.price)}</span>
                  </div>
                  <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-amber-500 w-[75%] animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button 
                  onClick={() => handleQuickBid(art.id, art.currentBid || art.price)}
                  disabled={timers[art.id] === "CLOSED"}
                  className="bg-amber-500 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-amber-900/10 flex flex-col items-center justify-center leading-none text-xs uppercase tracking-widest"
                >
                  <span className="text-[9px] opacity-60 mb-1 font-bold">Quick +500</span>
                  {timers[art.id] === "CLOSED" ? "ENDED" : "Place Bid"}
                </button>
                <button 
                  onClick={() => onSelectArtwork(art)}
                  className="bg-zinc-800 hover:bg-white border border-white/5 text-white hover:text-black text-xs font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl transition-all flex flex-col items-center justify-center uppercase tracking-widest shadow-lg"
                >
                  <span className="text-[9px] opacity-60 mb-1 font-bold">Explore</span>
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auction Timeline Modal */}
      {showTimelineId && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 sm:p-6 backdrop-blur-2xl overflow-y-auto">
          <div className="bg-[#0c0c0c] border border-white/10 p-6 sm:p-10 rounded-[2rem] w-full max-w-2xl relative shadow-[0_0_100px_rgba(0,0,0,0.8)] my-auto animate-fadeInUp">
            <button 
              onClick={() => setShowTimelineId(null)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="mb-8">
              <h3 className="text-3xl sm:text-4xl font-serif text-white italic uppercase tracking-tight">Timeline Log</h3>
              <p className="text-zinc-500 text-[10px] sm:text-xs font-black uppercase tracking-widest mt-2">Chronological events for {artworks.find(a => a.id === showTimelineId)?.title}</p>
            </div>
            
            <div className="space-y-6 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-amber-500 via-zinc-800 to-transparent"></div>
              
              {/* Start Event */}
              <div className="flex items-start gap-6 relative pl-6">
                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-800 border-2 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"></div>
                <div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Floor Opened</p>
                  <p className="text-white font-serif mt-1 text-sm sm:text-base italic">Lot activated for worldwide bidding.</p>
                </div>
              </div>

              {/* Bids Timeline */}
              {artworks.find(a => a.id === showTimelineId)?.bids?.map((bid, i) => (
                <div key={bid.id} className="flex items-start gap-6 relative pl-6">
                  <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${i === (artworks.find(a => a.id === showTimelineId)?.bids?.length || 0) - 1 ? 'bg-amber-500 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110' : 'bg-zinc-700 border-zinc-800'}`}></div>
                  <div className="w-full">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Entry • {new Date(bid.timestamp).toLocaleTimeString()}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-white font-bold text-sm sm:text-base">{bid.bidderName}</p>
                      <p className="text-amber-500 font-black tabular-nums">{toINRString(bid.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* End Prediction */}
              <div className="flex items-start gap-6 relative pl-6 opacity-60">
                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-red-900/40 border-2 border-red-500/40 animate-pulse"></div>
                <div>
                  <p className="text-[9px] text-red-500/70 font-black uppercase tracking-widest">Estimated Close</p>
                  <p className="text-zinc-500 italic text-xs mt-1">Lot concludes in approximately {timers[showTimelineId]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionHouse;
