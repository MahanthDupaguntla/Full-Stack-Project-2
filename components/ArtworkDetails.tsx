
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
      // Use existing curator insight if available, otherwise fetch from Gemini
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-6xl bg-zinc-950 rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        <div className="md:w-1/2 h-[400px] md:h-auto bg-black flex items-center justify-center p-8">
          <img src={artwork.imageUrl} alt={artwork.title} className="max-w-full max-h-full object-contain" />
        </div>
        
        <div className="md:w-1/2 p-12 overflow-y-auto">
          <button onClick={onClose} className="absolute top-8 right-8 text-zinc-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <h2 className="text-4xl font-serif text-white mb-2">{artwork.title}</h2>
          <p className="text-zinc-500 text-lg mb-8">{artwork.artist}, {artwork.year}</p>
          
          <div className="space-y-8">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4">About the Piece</h3>
              <p className="text-zinc-400 leading-relaxed">{artwork.description}</p>
            </section>
            
            <section className="bg-white/5 p-8 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Curator's Analysis</h3>
                {user?.role === 'CURATOR' && !isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-[10px] text-amber-500 font-bold uppercase tracking-widest hover:text-white transition-colors">Edit Insight</button>
                )}
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-2 bg-white/10 rounded w-full"></div>
                  <div className="h-2 bg-white/10 rounded w-5/6"></div>
                </div>
              ) : isEditing ? (
                <div className="space-y-4">
                  <textarea 
                    value={editedInsight}
                    onChange={(e) => setEditedInsight(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 outline-none focus:border-amber-500 min-h-[150px]"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveInsight} className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold">Save</button>
                    <button onClick={() => setIsEditing(false)} className="text-zinc-500 px-4 py-2 text-xs font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic leading-relaxed whitespace-pre-line">{insight}</p>
              )}
            </section>
            
            <div className="flex items-center justify-between pt-8 border-t border-white/10">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Price</p>
                <p className="text-3xl font-bold text-white">{toINRString(artwork.price)}</p>
              </div>
              <button 
                onClick={() => onAction(artwork)}
                className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-amber-500 transition-colors"
              >
                {artwork.isAuction ? 'Place Bid' : 'Purchase Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetails;
