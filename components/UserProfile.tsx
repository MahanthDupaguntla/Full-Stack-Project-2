import React, { useState } from 'react';
import { User, Artwork } from '../types';
import { hybridBackend } from '../services/apiService';
import { toINRString } from '../utils/currency';

interface UserProfileProps {
  user: User;
  artworks: Artwork[];
  onUpdateUser: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, artworks, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'history' | 'preferences'>('collection');
  const [bio, setBio] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const myCollection = artworks.filter(a => a.currentOwnerName === user.name);

  const handleSavePreferences = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(async () => {
      const updatedUser = { ...user, bio };
      await hybridBackend.updateUser(updatedUser);
      onUpdateUser(updatedUser);
      setIsSaving(false);
      alert("Preferences updated successfully.");
    }, 800);
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8 bg-zinc-900/50 p-10 rounded-[3rem] border border-white/5">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-amber-500/30 group-hover:border-amber-500 transition-all duration-500 shadow-2xl">
              <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black p-2 rounded-xl shadow-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-serif font-bold text-white mb-2 italic">{user.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">{user.role}</span>
              <span className="text-zinc-500 text-xs font-medium tracking-wide">Joined {new Date(user.joinedDate).toLocaleDateString()}</span>
            </div>
            <p className="mt-4 text-zinc-400 text-sm max-w-md font-light leading-relaxed">
              {user.bio || "A dedicated patron of the digital arts, exploring the boundaries of creative expression in the ArtForge sanctuary."}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Available Liquidity</p>
          <p className="text-4xl font-serif font-bold text-white">{toINRString(user.walletBalance)}</p>
          <button className="mt-4 px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all">Add Funds</button>
        </div>
      </header>

      <div className="flex justify-center gap-4 border-b border-white/5 pb-6">
        {[
          { id: 'collection', label: 'My Collection', count: myCollection.length },
          { id: 'history', label: 'Transaction Ledger', count: user.transactions.length },
          { id: 'preferences', label: 'Preferences', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            {tab.label} {tab.count !== null && <span className="ml-2 opacity-40">[{tab.count}]</span>}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'collection' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {myCollection.map(art => (
              <div key={art.id} className="glass rounded-[2rem] overflow-hidden border border-white/5 group hover:border-amber-500/30 transition-all duration-500">
                <div className="h-64 relative overflow-hidden">
                  <img src={art.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={art.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6">
                    <p className="text-white font-serif font-bold text-xl italic">{art.title}</p>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">{art.artist}</p>
                  </div>
                </div>
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Acquisition Value</p>
                    <p className="text-white font-bold">{toINRString(art.price)}</p>
                  </div>
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                    View Certificate
                  </button>
                </div>
              </div>
            ))}
            {myCollection.length === 0 && (
              <div className="col-span-full py-32 text-center">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 opacity-20">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-zinc-600 font-serif text-2xl italic">The collection is currently empty.</p>
                <button className="mt-8 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors">Explore the Archive</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
            {user.transactions.slice().reverse().map(tx => (
              <div key={tx.id} className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'sale' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tx.type === 'sale' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{tx.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{new Date(tx.date).toLocaleDateString()}</span>
                      <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                      <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Status: {tx.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-serif font-bold ${tx.type === 'sale' ? 'text-green-500' : 'text-white'}`}>
                    {tx.type === 'sale' ? '+' : '-'}{toINRString(tx.amount)}
                  </p>
                  <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mt-1">Transaction ID: {tx.id.slice(0, 8)}</p>
                </div>
              </div>
            ))}
            {user.transactions.length === 0 && (
              <div className="text-center py-32 opacity-20">
                <p className="text-zinc-500 font-serif text-xl italic">No transactions recorded in the ledger.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="max-w-2xl mx-auto glass p-12 rounded-[3rem] border border-white/5 animate-fadeIn">
            <h3 className="text-2xl font-serif text-white mb-10 italic">Identity Settings</h3>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Personal Narrative (Bio)</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell your story as a collector..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Display Theme</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:border-amber-500">
                    <option>Sovereign Dark (Default)</option>
                    <option>Obsidian Night</option>
                    <option>Gallery White</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Currency</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:border-amber-500">
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                      <option>ETH (Ξ)</option>
                    </select>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white text-sm font-bold">Public Profile</p>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Allow others to view your collection</p>
                  </div>
                  <div className="w-12 h-6 bg-amber-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-bold">Auction Alerts</p>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Notify when outbid or auction ending</p>
                  </div>
                  <div className="w-12 h-6 bg-zinc-800 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-600 rounded-full"></div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="w-full bg-white text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-amber-500 transition-all shadow-2xl disabled:opacity-50"
              >
                {isSaving ? 'Synchronizing...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
