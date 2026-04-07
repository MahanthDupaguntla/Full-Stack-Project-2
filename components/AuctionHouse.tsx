
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

const AuctionHouse: React.FC<Props> = ({ user, artworks, onBidUpdate, onSelectArtwork, onBackToGallery }) => {
  const auctions = artworks.filter(a => a.isAuction);
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
    <div className="space-y-12 animate-fadeIn relative pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBackToGallery}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-zinc-400 hover:text-white"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            <span className="text-xs font-bold uppercase tracking-widest">Back to Gallery</span>
          </button>
          <div>
            <h2 className="text-5xl font-serif">The Auction Floor</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Live Global Stream • 4,209 Online</p>
            </div>
          </div>
        </div>
          <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl text-right">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Your Available Credit</p>
          <p className="text-2xl font-serif text-amber-500">{toINRString(user.walletBalance)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {auctions.map(art => (
          <div key={art.id} className="group bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-full shadow-2xl hover:border-amber-500/20 transition-all duration-500">
            <div className="md:w-5/12 relative h-80 md:h-auto overflow-hidden">
              <img src={art.imageUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <div className="bg-black/70 backdrop-blur-md text-amber-500 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 shadow-lg">
                  {timers[art.id] || "Calculating..." }
                </div>
                <button 
                  onClick={() => setShowTimelineId(art.id)}
                  className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Timeline
                </button>
              </div>
            </div>
            
            <div className="md:w-7/12 p-8 flex flex-col bg-gradient-to-br from-transparent to-zinc-900/50">
              <div className="flex-1">
                <h3 className="text-3xl font-serif mb-2">{art.title}</h3>
                <p className="text-zinc-500 text-sm mb-6 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-zinc-700"></span>
                  {art.artist}
                </p>
                
                <div className="mb-8 space-y-4">
                   <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Latest Bids</h4>
                   <div className="space-y-2 h-24 overflow-y-auto pr-2 scrollbar-thin">
                      {art.bids && art.bids.length > 0 ? (
                        art.bids.slice().reverse().slice(0, 3).map((bid, idx) => (
                          <div key={bid.id} className={`flex justify-between items-center text-xs p-2 rounded ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'text-zinc-400'}`}>
                            <span className="font-medium">{bid.bidderName}</span>
                            <span className={`font-bold ${idx === 0 ? 'text-amber-500' : ''}`}>{toINRString(bid.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-600 italic">No activity yet.</p>
                      )}
                   </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-8">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Highest Current Bid</span>
                    <span className="text-4xl font-serif text-white">{toINRString(art.currentBid || art.price)}</span>
                  </div>
                  <div className="h-[2px] bg-zinc-800 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-amber-500 w-[75%] animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <button 
                  onClick={() => handleQuickBid(art.id, art.currentBid || art.price)}
                  disabled={timers[art.id] === "CLOSED"}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-amber-900/20 flex flex-col items-center justify-center leading-tight group/bid"
                >
                  <span className="text-xs opacity-70 mb-1 font-normal">Quick Bid +{toINRString(500)}</span>
                  {timers[art.id] === "CLOSED" ? "Auction Ended" : "Place Bid"}
                </button>
                <button 
                  onClick={() => onSelectArtwork(art)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-5 rounded-2xl transition-all flex flex-col items-center justify-center"
                >
                  <span className="text-xs opacity-70 mb-1 font-normal">View Piece</span>
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auction Timeline Modal */}
      {showTimelineId && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 p-10 rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={() => setShowTimelineId(null)}
              className="absolute top-8 right-8 text-zinc-500 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-4xl font-serif mb-2">Auction Timeline</h3>
            <p className="text-zinc-500 text-sm mb-12">Chronological events for {artworks.find(a => a.id === showTimelineId)?.title}</p>
            
            <div className="space-y-8 relative">
              <div className="absolute left-2 top-2 bottom-2 w-[1px] bg-zinc-800"></div>
              
              {/* Start Event */}
              <div className="flex items-start gap-8 relative pl-8">
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-zinc-700 border-4 border-zinc-900 -translate-x-1/2"></div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Auction Opened</p>
                  <p className="text-white font-serif mt-1">Lot activated for global bidding.</p>
                </div>
              </div>

              {/* Bids Timeline */}
              {artworks.find(a => a.id === showTimelineId)?.bids?.map((bid, i) => (
                <div key={bid.id} className="flex items-start gap-8 relative pl-8">
                  <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-4 border-zinc-900 -translate-x-1/2 ${i === (artworks.find(a => a.id === showTimelineId)?.bids?.length || 0) - 1 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-zinc-600'}`}></div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Bid Placed • {new Date(bid.timestamp).toLocaleTimeString()}</p>
                    <p className="text-white font-bold mt-1">{toINRString(bid.amount)} by {bid.bidderName}</p>
                  </div>
                </div>
              ))}

              {/* End Prediction */}
              <div className="flex items-start gap-8 relative pl-8">
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-red-500/20 border-4 border-zinc-900 -translate-x-1/2"></div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Auction Closing</p>
                  <p className="text-zinc-400 italic text-sm mt-1">Expected to conclude in {timers[showTimelineId]}</p>
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
