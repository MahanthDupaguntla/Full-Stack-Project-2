
import React, { useState, useEffect } from 'react';
import { Artwork, User } from '../types';
import { getCulturalInsight } from '../services/geminiService';
import { hybridBackend } from '../services/apiService';
import { toINRString } from '../utils/currency';


interface Props {
  artwork: Artwork;
  onClose: () => void;
  onAction: (art: Artwork) => void;
  user: User | null;
}

const ArtworkDetails: React.FC<Props> = ({ artwork, onClose, onAction, user }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInsight, setEditedInsight] = useState('');

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      if (artwork.curatorInsight) {
        setInsight(artwork.curatorInsight);
        setEditedInsight(artwork.curatorInsight);
      } else {
        const res = await getCulturalInsight(artwork.title, artwork.artist, artwork.description);
        setInsight(res || 'No additional information available.');
        setEditedInsight(res || '');
      }
      setLoading(false);
    };
    fetchInfo();
  }, [artwork]);

  const handleSaveInsight = async () => {
    await hybridBackend.updateArtwork({ ...artwork, curatorInsight: editedInsight });
    setInsight(editedInsight);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-6xl bg-zinc-950 rounded-[2rem] border border-white/10 overflow-hidden flex flex-col md:flex-row max-h-none md:max-h-[85vh] my-auto shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        {/* Image Section */}
        <div className="w-full md:w-1/2 h-[50vh] sm:h-[60vh] md:h-auto bg-[#050505] flex items-center justify-center p-4 sm:p-12 relative group">
          <img 
            src={artwork.imageUrl} 
            alt={artwork.title} 
            className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-1000 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        </div>
        
        {/* Content Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-16 overflow-y-auto bg-zinc-950">
          <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2 z-10">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-serif text-white italic leading-tight uppercase tracking-tight">{artwork.title}</h2>
            <p className="text-zinc-500 text-base sm:text-lg mb-8">{artwork.artist}, {artwork.year}</p>
          </div>
          
          <div className="space-y-8 sm:space-y-10 mt-8">
            <section>
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-amber-500 mb-4">Provenance & Narrative</h3>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-light">{artwork.description}</p>
            </section>
            
            <section className="glass-light p-6 sm:p-8 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-zinc-300">Curatorial Intelligence</h3>
                {user?.role === 'CURATOR' && !isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-[10px] text-amber-500 font-black uppercase tracking-widest hover:text-white transition-colors">Edit</button>
                )}
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-2 bg-white/10 rounded w-full"></div>
                  <div className="h-2 bg-white/10 rounded w-5/6"></div>
                  <div className="h-2 bg-white/10 rounded w-4/6"></div>
                </div>
              ) : isEditing ? (
                <div className="space-y-4">
                  <textarea 
                    value={editedInsight}
                    onChange={(e) => setEditedInsight(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-zinc-300 outline-none focus:border-amber-500 min-h-[150px] font-medium"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveInsight} className="bg-white text-black px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Apply Changes</button>
                    <button onClick={() => setIsEditing(false)} className="text-zinc-500 px-5 py-2 text-[10px] font-black uppercase tracking-widest">Discard</button>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-zinc-400 italic leading-relaxed whitespace-pre-line font-medium opacity-80">{insight}</p>
              )}
            </section>
            
            <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/10 gap-6">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Valuation</p>
                <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums">{toINRString(artwork.price)}</p>
              </div>
              <button 
                onClick={() => onAction(artwork)}
                className="w-full sm:w-auto btn-shine bg-white text-black px-12 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all shadow-xl hover:scale-105"
              >
                {artwork.isAuction ? 'Participate in Auction' : 'Acquire Asset'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetails;
