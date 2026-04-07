
import React, { useState, useRef } from 'react';
import { UserRole, Artwork, User, Transaction, Exhibition } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { hybridBackend } from '../services/apiService';
import { generateBrandStory } from '../services/geminiService';

const MOCK_FINANCIALS = [
  { date: 'Jan', revenue: 45000 },
  { date: 'Feb', revenue: 52000 },
  { date: 'Mar', revenue: 48000 },
  { date: 'Apr', revenue: 70000 },
];

const StatCard = ({ label, value, colorClass = "text-white" }: { label: string, value: string, colorClass?: string }) => (
  <div className="glass p-8 rounded-3xl group">
    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">{label}</h3>
    <p className={`text-4xl font-serif ${colorClass}`}>{value}</p>
  </div>
);

const TransactionItem: React.FC<{ tx: Transaction }> = ({ tx }) => (
  <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full ${tx.type === 'sale' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-zinc-400'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <div>
        <p className="text-sm font-bold text-white">{tx.description}</p>
        <p className="text-xs text-zinc-500 mt-1">{new Date(tx.date).toLocaleDateString()}</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`font-bold ${tx.type === 'sale' ? 'text-green-500' : 'text-zinc-300'}`}>
        {tx.type === 'sale' ? '+' : '-'}${tx.amount.toLocaleString()}
      </p>
      <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{tx.status}</span>
    </div>
  </div>
);

export const ArtistDashboard: React.FC<{ artworks: Artwork[] }> = ({ artworks }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const user = hybridBackend.getCurrentUser()!;
  const myArtworks = artworks.filter(a => a.artist === user.name);

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvasRef.current.toDataURL('image/png'));
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setCameraActive(false);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await hybridBackend.uploadArtwork({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      artist: user.name,
      imageUrl: capturedImage || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab',
      category: formData.get('category') as string,
    });
    setShowUpload(false);
    window.location.reload();
  };

  return (
    <div className="space-y-16 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-serif text-white mb-2">Artist Studio</h2>
          <p className="text-zinc-500">Welcome back, {user.name}. Track your sales and manage your portfolio.</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="bg-amber-500 text-black px-8 py-3 rounded-full font-bold hover:bg-white transition-all">
          Upload Artwork
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value={`$${user.totalEarned.toLocaleString()}`} />
        <StatCard label="Live Valuation" value={`$${(myArtworks.length * 12000).toLocaleString()}`} colorClass="text-amber-500" />
        <StatCard label="Portfolio Views" value="24.8K" />
        <StatCard label="Total Pieces" value={myArtworks.length.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="glass p-10 rounded-3xl">
          <h3 className="text-2xl font-serif text-white mb-8">Your Collection</h3>
          <div className="space-y-6">
            {myArtworks.map(art => (
              <div key={art.id} className="flex gap-6 items-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <img src={art.imageUrl} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-white">{art.title}</h4>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{art.category}</p>
                </div>
                <p className="font-bold text-white">${art.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-10 rounded-3xl">
          <h3 className="text-2xl font-serif text-white mb-8">Sales Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_FINANCIALS}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 p-12 rounded-3xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowUpload(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-3xl font-serif text-white mb-8">New Artwork Submission</h3>
            <form onSubmit={handleUpload} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Title</label><input name="title" required className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-amber-500" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Price ($)</label><input name="price" type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-amber-500" /></div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Artwork Visual</label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/5">
                  {!cameraActive && !capturedImage ? (
                    <button type="button" onClick={startCamera} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-amber-500 transition-all">Enable Camera</button>
                  ) : cameraActive ? (
                    <div className="space-y-6"><video ref={videoRef} autoPlay className="w-full rounded-xl shadow-2xl" /><button type="button" onClick={capturePhoto} className="bg-amber-500 text-black px-10 py-3 rounded-full font-bold">Snap Photo</button></div>
                  ) : (
                    <div className="space-y-6"><img src={capturedImage!} className="w-full rounded-xl shadow-2xl" /><button type="button" onClick={() => setCapturedImage(null)} className="text-zinc-500 hover:text-white text-sm font-bold">Retake</button></div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-amber-500 transition-all">Submit Masterpiece</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const VisitorDashboard: React.FC<{ artworks: Artwork[] }> = ({ artworks }) => {
  const user = hybridBackend.getCurrentUser()!;
  
  const myCollection = artworks.filter(a => a.currentOwnerName === user.name);

  const handleList = async (id: string) => {
    const price = prompt("Listing Price ($):", "15000");
    if (price) {
      await hybridBackend.listArtwork(id, false, Number(price));
      window.location.reload();
    }
  };

  return (
    <div className="space-y-16 animate-fadeIn pb-20">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-5xl font-serif text-white mb-2">My Sanctuary</h2>
            <p className="text-zinc-500">The private collection of {user.name}</p>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard label="Portfolio Value" value={`$${(myCollection.length * 15000).toLocaleString()}`} colorClass="text-amber-500" />
          <StatCard label="Trading Balance" value={`$${user.walletBalance.toLocaleString()}`} />
          <StatCard label="Gains Realized" value={`$${user.totalEarned.toLocaleString()}`} />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="glass p-10 rounded-3xl">
            <h3 className="text-2xl font-serif text-white mb-8">Owned Artworks</h3>
            <div className="space-y-8">
              {myCollection.map(art => (
                <div key={art.id} className="flex gap-8 items-center p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                   <img src={art.imageUrl} className="w-24 h-24 rounded-xl object-cover" />
                   <div className="flex-1">
                      <h4 className="text-xl font-bold text-white mb-1">{art.title}</h4>
                      <p className="text-sm text-zinc-500 mb-4">{art.artist}</p>
                      {!art.isListed ? (
                        <button onClick={() => handleList(art.id)} className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold hover:bg-amber-500 transition-colors">Sell Piece</button>
                      ) : (
                        <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Listed for Sale</span>
                      )}
                   </div>
                </div>
              ))}
              {myCollection.length === 0 && (
                <div className="text-center py-24 text-zinc-600 italic">No pieces owned yet.</div>
              )}
            </div>
          </div>

          <div className="glass p-10 rounded-3xl">
            <h3 className="text-2xl font-serif text-white mb-8">Recent Activity</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
              {user.transactions.length > 0 ? user.transactions.slice().reverse().map(tx => (
                <TransactionItem key={tx.id} tx={tx} />
              )) : (
                <p className="text-center py-12 text-zinc-600 italic">No recent activity.</p>
              )}
            </div>
          </div>
       </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  React.useEffect(() => {
    hybridBackend.getAllUsers().then(setUsers);
  }, []);
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [brandStory, setBrandStory] = useState<string>('');
  const [isForging, setIsForging] = useState(false);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await hybridBackend.updateUserRole(userId, newRole);
    hybridBackend.getAllUsers().then(setUsers);
  };

  const handleForgeBrand = async () => {
    setIsForging(true);
    const story = await generateBrandStory('ArtForge');
    setBrandStory(story);
    setIsForging(false);
  };

  return (
    <div className="space-y-16 animate-fadeIn pb-20">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-5xl font-serif text-white mb-2">Gallery Control</h2>
            <p className="text-zinc-500">Oversee platform operations and manage user permissions.</p>
          </div>
          <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              User Management
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Platform Settings
            </button>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard label="Global Volume" value="$2.4M" colorClass="text-amber-500" />
          <StatCard label="Active Users" value={users.length.toString()} />
          <StatCard label="Pending Verifications" value="14" />
       </div>

       {activeTab === 'users' ? (
         <div className="glass p-10 rounded-3xl overflow-hidden">
           <h3 className="text-2xl font-serif text-white mb-8">User Directory</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-white/10">
                   <th className="pb-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Identity</th>
                   <th className="pb-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Role</th>
                   <th className="pb-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Joined</th>
                   <th className="pb-6 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {users.map(u => (
                   <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                     <td className="py-6">
                       <div className="flex items-center gap-4">
                         <img src={u.avatar} className="w-10 h-10 rounded-full bg-white/10" />
                         <div>
                           <p className="font-bold text-white">{u.name}</p>
                           <p className="text-xs text-zinc-500">{u.email}</p>
                         </div>
                       </div>
                     </td>
                     <td className="py-6">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         u.role === UserRole.ADMIN ? 'bg-red-500/10 text-red-500' :
                         u.role === UserRole.ARTIST ? 'bg-blue-500/10 text-blue-500' :
                         u.role === UserRole.CURATOR ? 'bg-purple-500/10 text-purple-500' :
                         'bg-zinc-500/10 text-zinc-500'
                       }`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="py-6 text-sm text-zinc-400">
                       {new Date(u.joinedDate).toLocaleDateString()}
                     </td>
                     <td className="py-6 text-right">
                       <select 
                         value={u.role}
                         onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                         className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1 text-xs text-white outline-none focus:border-amber-500"
                       >
                         {Object.values(UserRole).map(r => (
                           <option key={r} value={r}>{r}</option>
                         ))}
                       </select>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="glass p-10 rounded-3xl">
             <h3 className="text-2xl font-serif text-white mb-8">Gallery Parameters</h3>
             <div className="space-y-6">
               <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                 <span className="text-sm text-zinc-400">Public Access</span>
                 <div className="w-12 h-6 bg-amber-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
               </div>
               <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                 <span className="text-sm text-zinc-400">Auction House Fee (%)</span>
                 <span className="text-white font-bold">2.5%</span>
               </div>
               <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                 <span className="text-sm text-zinc-400">Artist Royalty (%)</span>
                 <span className="text-white font-bold">10%</span>
               </div>
             </div>
           </div>
           
           <div className="glass p-10 rounded-3xl flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif text-white">Brand Forge</h3>
                <button 
                  onClick={handleForgeBrand}
                  disabled={isForging}
                  className="bg-amber-500 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
                >
                  {isForging ? 'Forging...' : 'Forge Story'}
                </button>
              </div>
              <div className="flex-1 bg-black/40 rounded-2xl p-6 border border-white/5 min-h-[200px]">
                {brandStory ? (
                  <p className="text-sm text-zinc-400 italic leading-relaxed whitespace-pre-line">{brandStory}</p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <p className="text-xs uppercase tracking-widest">No brand story forged yet.</p>
                  </div>
                )}
              </div>
            </div>

           <div className="glass p-10 rounded-3xl">
             <h3 className="text-2xl font-serif text-white mb-8">System Health</h3>
             <div className="space-y-4">
               <div className="flex items-center gap-4 text-sm text-zinc-400">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <span>Mainnet Node: Operational</span>
               </div>
               <div className="flex items-center gap-4 text-sm text-zinc-400">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <span>IPFS Gateway: Connected</span>
               </div>
               <div className="flex items-center gap-4 text-sm text-zinc-400">
                 <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                 <span>Gemini API: High Latency</span>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export const CuratorDashboard: React.FC = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);

  React.useEffect(() => {
    hybridBackend.getExhibitions().then(setExhibitions);
  }, []);
  const [showCreate, setShowCreate] = useState(false);

  const handleStatusChange = async (ex: Exhibition, status: Exhibition['status']) => {
    await hybridBackend.updateExhibition({ ...ex, status });
    hybridBackend.getExhibitions().then(setExhibitions);
  };

  return (
    <div className="space-y-16 animate-fadeIn pb-20">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-5xl font-serif text-white mb-2">Curatorial Deck</h2>
            <p className="text-zinc-500">Manage narratives and exhibition flows across the global sanctuary.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-amber-500 transition-all">
            New Exhibition
          </button>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {exhibitions.map(ex => (
            <div key={ex.id} className="glass rounded-[2rem] overflow-hidden flex flex-col border border-white/5 hover:border-white/20 transition-all group">
              <div className="h-48 relative overflow-hidden">
                <img src={ex.bannerUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    ex.status === 'active' ? 'bg-green-500 text-white' :
                    ex.status === 'upcoming' ? 'bg-amber-500 text-black' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {ex.status}
                  </span>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-serif text-white mb-2">{ex.title}</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">{ex.theme}</p>
                <p className="text-sm text-zinc-400 line-clamp-2 mb-8 flex-1">{ex.description}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                        {ex.artworkIds[i-1] || '?'}
                      </div>
                    ))}
                  </div>
                  <select 
                    value={ex.status}
                    onChange={(e) => handleStatusChange(ex, e.target.value as Exhibition['status'])}
                    className="bg-transparent text-xs font-bold text-zinc-500 outline-none cursor-pointer hover:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
       </div>

       {showCreate && (
         <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-6">
           <div className="bg-zinc-900 border border-white/10 p-12 rounded-3xl w-full max-w-2xl relative">
             <button onClick={() => setShowCreate(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
             <h3 className="text-3xl font-serif text-white mb-8">Curate New Narrative</h3>
             <form onSubmit={(e) => {
               e.preventDefault();
               const fd = new FormData(e.currentTarget);
               hybridBackend.createExhibition({
                 title: fd.get('title') as string,
                 theme: fd.get('theme') as string,
                 description: fd.get('description') as string,
                 status: 'upcoming'
               });
               setShowCreate(false);
               hybridBackend.getExhibitions().then(setExhibitions);
             }} className="space-y-6">
               <div><label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Exhibition Title</label><input name="title" required className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-amber-500" /></div>
               <div><label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Conceptual Theme</label><input name="theme" required className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-amber-500" /></div>
               <div><label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Narrative Description</label><textarea name="description" rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-amber-500" /></div>
               <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-amber-500 transition-all">Launch Exhibition</button>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};
