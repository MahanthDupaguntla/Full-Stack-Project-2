
import React, { useState, useRef } from 'react';
import { UserRole, Artwork, User, Transaction, Exhibition } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { hybridBackend } from '../services/apiService';
import { generateBrandStory } from '../services/geminiService';
import { toINRString } from '../utils/currency';

const MOCK_FINANCIALS = [
  { date: 'Jan', revenue: 45000 },
  { date: 'Feb', revenue: 52000 },
  { date: 'Mar', revenue: 48000 },
  { date: 'Apr', revenue: 70000 },
];

const StatCard = ({ label, value, colorClass = "text-white" }: { label: string, value: string, colorClass?: string }) => (
  <div className="glass p-5 sm:p-8 rounded-[1.5rem] sm:rounded-3xl group">
    <h3 className="text-zinc-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4">{label}</h3>
    <p className={`text-2xl sm:text-4xl font-serif font-bold ${colorClass}`}>{value}</p>
  </div>
);

const TransactionItem: React.FC<{ tx: Transaction }> = ({ tx }) => (
  <div className="flex items-center justify-between p-4 sm:p-6 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5 hover:bg-white/10 transition-colors gap-4">
    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
      <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${tx.type === 'sale' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-zinc-400'}`}>
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white truncate">{tx.description}</p>
        <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">{new Date(tx.date).toLocaleDateString()}</p>
      </div>
    </div>
    <div className="text-right flex-shrink-0">
      <p className={`font-bold text-sm sm:text-base ${tx.type === 'sale' ? 'text-green-500' : 'text-zinc-300'}`}>
        {tx.type === 'sale' ? '+' : '-'}{toINRString(tx.amount)}
      </p>
      <span className="text-[8px] sm:text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{tx.status}</span>
    </div>
  </div>
);

export const ArtistDashboard: React.FC<{ artworks: Artwork[], user: User, onUpdateUser: (u: User) => void }> = ({ artworks, user, onUpdateUser }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [editingArt, setEditingArt] = useState<Artwork | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const resizeImage = (dataUrl: string, callback: (resized: string) => void) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height *= maxDim / width;
        width = maxDim;
      } else if (height > maxDim) {
        width *= maxDim / height;
        height = maxDim;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if(ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        callback(dataUrl);
      }
    };
    img.src = dataUrl;
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        resizeImage(canvasRef.current.toDataURL('image/png'), (resized) => {
          setCapturedImage(resized);
          const stream = videoRef.current?.srcObject as MediaStream;
          stream?.getTracks().forEach(track => track.stop());
          setCameraActive(false);
        });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        resizeImage(reader.result as string, (resized) => {
          setCapturedImage(resized);
        });
      };
      reader.readAsDataURL(file);
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

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingArt) return;
    setIsProcessing(true);
    try {
      const fd = new FormData(e.currentTarget);
      await hybridBackend.updateArtwork(editingArt.id, {
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        price: Number(fd.get('price')),
        category: fd.get('category') as string,
      });
      setEditingArt(null);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to update artwork');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      await hybridBackend.deleteArtwork(id);
      setDeleteConfirm(null);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to delete artwork');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-16 animate-fadeIn pb-10 sm:pb-20 px-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8">
        <div>
          <h2 className="text-4xl sm:text-5xl font-serif text-white mb-2 italic">Artist Studio</h2>
          <p className="text-zinc-500 text-sm">Welcome back, {user.name}. Track your sales and manage your portfolio.</p>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
          <button onClick={() => alert(`Funds withdrawal initiated. INR \${user.totalEarned} processing to linked account.`)} className="flex-1 sm:flex-none bg-transparent border border-white/20 text-white px-6 sm:px-8 py-3 rounded-full text-xs font-bold hover:bg-white hover:text-black transition-all">
            Withdraw
          </button>
          <button onClick={() => setShowUpload(true)} className="flex-1 sm:flex-none bg-amber-500 text-black px-6 sm:px-8 py-3 rounded-full text-xs font-bold hover:bg-white transition-all shadow-lg hover:scale-105">
            Upload
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard label="Earnings" value={toINRString(user.totalEarned)} />
        <StatCard label="Valuation" value={toINRString(myArtworks.length * 12000)} colorClass="text-amber-500" />
        <StatCard label="Views" value="24.8K" />
        <StatCard label="Pieces" value={myArtworks.length.toString()} />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <h3 className="text-xl sm:text-2xl font-serif text-white italic">Studio Archive</h3>
        <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest outline-none focus:border-amber-500 w-full sm:w-auto">
           <option>Recently Added</option>
           <option>Price: High to Low</option>
           <option>Price: Low to High</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
        <div className="glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl">
          <h3 className="text-lg sm:text-xl font-serif text-amber-500 mb-6 sm:mb-8 uppercase tracking-widest">Active Inventory</h3>
          <div className="space-y-4 sm:space-y-6">
            {myArtworks.map(art => (
              <div key={art.id} className="flex gap-4 sm:gap-6 items-center p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-colors">
                <img src={art.imageUrl} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm sm:text-base truncate">{art.title}</h4>
                  <p className="text-[9px] sm:text-xs text-zinc-500 uppercase tracking-widest mt-1">{art.category}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-1.5">
                  <p className="font-bold text-white text-sm sm:text-base">{toINRString(art.price)}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setEditingArt(art)} className="text-[8px] sm:text-[10px] text-amber-500 font-bold uppercase tracking-widest hover:text-amber-400 transition-colors" title="Edit">
                      <svg className="w-3.5 h-3.5 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Edit
                    </button>
                    <button onClick={() => setDeleteConfirm(art.id)} className="text-[8px] sm:text-[10px] text-red-500 font-bold uppercase tracking-widest hover:text-red-400 transition-colors" title="Delete">
                      <svg className="w-3.5 h-3.5 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Delete
                    </button>
                  </div>
                  {art.isListed && !art.isAuction ? (
                    <button onClick={async () => { await hybridBackend.listArtwork(art.id, false, art.price); window.location.reload(); }} className="text-[8px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-widest hover:text-zinc-200">Delist</button>
                  ) : art.isAuction ? (
                    <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">In Auction</span>
                  ) : (
                    <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Vaulted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl">
          <h3 className="text-xl sm:text-2xl font-serif text-white mb-6 sm:mb-8">Sales Trend</h3>
          <div className="h-48 sm:h-64 w-full">
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
      {/* ── Edit Artwork Modal ── */}
      {editingArt && (
        <div className="fixed inset-0 z-[210] bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-12 rounded-2xl sm:rounded-3xl w-full max-w-2xl relative my-auto">
            <button onClick={() => setEditingArt(null)} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-zinc-500 hover:text-white p-2">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-2xl sm:text-3xl font-serif text-white mb-6 sm:mb-8 uppercase tracking-tight italic">Edit Artwork</h3>
            <form onSubmit={handleEdit} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Title</label><input name="title" defaultValue={editingArt.title} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Price (INR)</label><input name="price" type="number" defaultValue={editingArt.price} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
              </div>
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Category</label><input name="category" defaultValue={editingArt.category} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Description</label><textarea name="description" defaultValue={editingArt.description} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
              {editingArt.imageUrl && <img src={editingArt.imageUrl} className="w-full max-h-48 object-cover rounded-xl opacity-60" />}
              <button type="submit" disabled={isProcessing} className="w-full bg-amber-500 text-black py-4 rounded-xl font-bold hover:bg-white transition-all text-sm uppercase tracking-widest disabled:opacity-50">
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[210] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/20 p-8 sm:p-12 rounded-2xl sm:rounded-3xl w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-2xl font-serif text-white italic">Delete Artwork?</h3>
            <p className="text-zinc-500 text-sm">This action cannot be undone. The artwork and all related bids will be permanently removed.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isProcessing} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-400 transition-all disabled:opacity-50">
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-[210] bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 sm:p-12 rounded-2xl sm:rounded-3xl w-full max-w-2xl relative my-auto">
            <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-zinc-500 hover:text-white p-2">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-2xl sm:text-3xl font-serif text-white mb-6 sm:mb-8 uppercase tracking-tight italic">New Submission</h3>
            <form onSubmit={handleUpload} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Title</label><input name="title" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Price (INR)</label><input name="price" type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Artwork Visual</label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 sm:p-12 text-center bg-white/5">
                  {!cameraActive && !capturedImage ? (
                    <div className="flex flex-col items-center gap-4">
                      <label className="bg-white text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs font-bold hover:bg-amber-500 transition-all cursor-pointer w-full sm:w-auto">
                        Upload File
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                      <span className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest">OR</span>
                      <button type="button" onClick={startCamera} className="bg-transparent border border-white/20 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs font-bold hover:bg-amber-500 hover:border-amber-500 hover:text-black transition-all w-full sm:w-auto">Enable Camera</button>
                    </div>
                  ) : cameraActive ? (
                    <div className="space-y-6">
                      <video ref={videoRef} autoPlay className="w-full rounded-xl shadow-2xl aspect-video object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <button type="button" onClick={capturePhoto} className="bg-amber-500 text-black px-8 sm:px-10 py-3 rounded-full text-xs font-bold shadow-lg">Snap Photo</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <img src={capturedImage!} className="w-full rounded-xl shadow-2xl aspect-video object-cover" />
                      <button type="button" onClick={() => setCapturedImage(null)} className="text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest">Retake Photo</button>
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-amber-500 transition-all text-sm uppercase tracking-widest">Submit Masterpiece</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const VisitorDashboard: React.FC<{ artworks: Artwork[], user: User, onUpdateUser: (u: User) => void }> = ({ artworks, user, onUpdateUser }) => {
  const myCollection = artworks.filter(a => a.currentOwnerName === user.name);

  const handleList = async (id: string) => {
    const price = prompt("Listing Price (INR):", "15000");
    if (price) {
      await hybridBackend.listArtwork(id, true, Number(price));
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 sm:space-y-16 animate-fadeIn pb-10 sm:pb-20 px-2 text-center lg:text-left">
       <header className="flex flex-col md:flex-row justify-between items-center sm:items-end gap-6 sm:gap-8">
          <div className="w-full sm:w-auto">
            <h2 className="text-4xl sm:text-5xl font-serif text-white mb-2 italic">My Sanctuary</h2>
            <p className="text-zinc-500 text-sm">The private collection of {user.name}</p>
          </div>
          <button onClick={async () => { 
            const amt = prompt('Top Up Amount (INR):', '50000'); 
            if(amt) {
              const numAmt = Number(amt);
              if (isNaN(numAmt) || numAmt <= 0) return;
              try {
                await hybridBackend.updateUser({ ...user, walletBalance: user.walletBalance + numAmt });
                const updatedUser = await hybridBackend.fetchCurrentUser();
                if (updatedUser) onUpdateUser(updatedUser);
                alert(`Successfully added ${toINRString(numAmt)} to your secure trading wallet.`);
              } catch(e: any) { alert(e.message); }
            } 
          }} className="w-full sm:w-auto bg-amber-500 text-black px-8 py-3 rounded-full text-sm font-bold hover:bg-white transition-all shadow-lg">
            Top Up Balance
          </button>
       </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-8">
           <div className="col-span-2 sm:col-span-1">
             <StatCard label="Portfolio Value" value={toINRString(myCollection.length * 15000)} colorClass="text-amber-500" />
           </div>
           <StatCard label="Balance" value={toINRString(user.walletBalance)} />
           <StatCard label="Gains" value={toINRString(user.totalEarned)} />
        </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          <div className="lg:col-span-2 glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl">
            <h3 className="text-xl sm:text-2xl font-serif text-white mb-6 sm:mb-8 italic">Owned Artworks</h3>
            <div className="space-y-6 sm:space-y-8">
              {myCollection.map(art => (
                <div key={art.id} className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center p-4 sm:p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                   <img src={art.imageUrl} className="w-full sm:w-24 h-48 sm:h-24 rounded-xl object-cover flex-shrink-0" />
                   <div className="flex-1 w-full sm:w-auto">
                      <h4 className="text-lg sm:text-xl font-bold text-white mb-1 uppercase tracking-tight leading-none">{art.title}</h4>
                      <p className="text-xs sm:text-sm text-zinc-500 mb-4">{art.artist}</p>
                      {!art.isListed ? (
                        <div className="flex gap-2 sm:gap-3 mt-1">
                          <button onClick={() => handleList(art.id)} className="flex-1 sm:flex-none bg-white text-black px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-colors">Sell</button>
                          <button onClick={() => alert('Appraisal requested...')} className="flex-1 sm:flex-none bg-transparent border border-white/20 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Appraise</button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Listed for Sale</span>
                      )}
                   </div>
                </div>
              ))}
              {myCollection.length === 0 && (
                <div className="text-center py-16 sm:py-24 text-zinc-600 italic text-sm">No pieces in your sanctuary yet.</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl">
              <h3 className="text-xl sm:text-2xl font-serif text-white mb-6 sm:mb-8 italic">Watchlist</h3>
              <div className="space-y-4">
                 <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl">
                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold">No items watched</p>
                 </div>
              </div>
            </div>

            <div className="glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl">
              <h3 className="text-xl sm:text-2xl font-serif text-white mb-6 sm:mb-8 italic leading-none">Activity</h3>
              <div className="space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                {(user.transactions || []).length > 0 ? (user.transactions || []).slice().reverse().map(tx => (
                  <TransactionItem key={tx.id} tx={tx} />
                )) : (
                  <p className="text-center py-12 text-zinc-600 italic text-xs">No recent activity.</p>
                )}
              </div>
            </div>
          </div>
       </div>
    </div>
  );
};

export const AdminDashboard: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = () => {
  const [users, setUsers] = useState<User[]>([]);

  React.useEffect(() => {
    hybridBackend.getAllUsers().then(setUsers);
  }, []);
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [brandStory, setBrandStory] = useState<string>('');
  const [isForging, setIsForging] = useState(false);
  const [filterIdentity, setFilterIdentity] = useState('');

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await hybridBackend.updateUserRole(userId, newRole);
    hybridBackend.getAllUsers().then(setUsers);
  };

  const handleToggleSuspension = async (userId: string) => {
    await hybridBackend.toggleUserSuspension(userId);
    hybridBackend.getAllUsers().then(setUsers);
  };

  const handleForgeBrand = async () => {
    setIsForging(true);
    const story = await generateBrandStory('ArtForge');
    setBrandStory(story);
    setIsForging(false);
  };

  return (
    <div className="space-y-8 sm:space-y-16 animate-fadeIn pb-10 sm:pb-20 px-2">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8">
          <div className="w-full">
            <h2 className="text-4xl sm:text-5xl font-serif text-white mb-2 italic leading-tight">Control <br className="sm:hidden" /><span className="text-gold">Station</span></h2>
            <p className="text-zinc-500 text-sm">Oversee platform operations and manage user permissions.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-stretch sm:items-center">
            <div className="relative flex-1 sm:w-64">
               <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input 
                type="text" 
                placeholder="Filter identity..." 
                value={filterIdentity}
                onChange={(e) => setFilterIdentity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-4 sm:px-6 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                Users
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-4 sm:px-6 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                Settings
              </button>
            </div>
          </div>
       </header>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          <StatCard label="Global Volume" value={toINRString(2400000)} colorClass="text-amber-500" />
          <StatCard label="Active Users" value={users.length.toString()} />
          <StatCard label="Status Alerts" value="14" />
       </div>

       {activeTab === 'users' ? (
         <div className="glass p-4 sm:p-10 rounded-2xl sm:rounded-3xl">
           <h3 className="text-xl sm:text-2xl font-serif text-white mb-6 sm:mb-8 italic">User Directory</h3>
           <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
             <table className="w-full text-left min-w-[600px]">
               <thead>
                 <tr className="border-b border-white/10">
                   <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Identity</th>
                   <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Role</th>
                   <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Joined</th>
                   <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {users.filter(u => !filterIdentity || u.name.toLowerCase().includes(filterIdentity.toLowerCase()) || u.email.toLowerCase().includes(filterIdentity.toLowerCase())).map(u => (
                   <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                     <td className="py-5 sm:py-6">
                       <div className={`flex items-center gap-3 sm:gap-4 ${u.isSuspended ? 'opacity-50 grayscale' : ''}`}>
                         <img src={u.avatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 object-cover" />
                         <div className="min-w-0">
                           <p className={`font-bold text-sm sm:text-base truncate ${u.isSuspended ? 'text-zinc-500 line-through' : 'text-white'}`}>{u.name}</p>
                           <p className={`text-[10px] sm:text-xs truncate ${u.isSuspended ? 'text-zinc-500 line-through' : 'text-zinc-500'}`}>{u.email}</p>
                         </div>
                       </div>
                     </td>
                     <td className="py-5 sm:py-6">
                       <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-current opacity-70 ${
                         u.role === UserRole.ADMIN ? 'text-red-500' :
                         u.role === UserRole.ARTIST ? 'text-blue-500' :
                         u.role === UserRole.CURATOR ? 'text-purple-500' :
                         'text-zinc-500'
                       }`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="py-5 sm:py-6 text-xs sm:text-sm text-zinc-500 tabular-nums">
                       {new Date(u.joinedDate).toLocaleDateString()}
                     </td>
                     <td className="py-5 sm:py-6 text-right flex justify-end items-center gap-2 sm:gap-3">
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="bg-zinc-800 border border-white/10 rounded-lg px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {Object.values(UserRole).map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button onClick={() => handleToggleSuspension(u.id)} className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${u.isSuspended ? 'text-green-500 hover:text-green-400' : 'text-red-500 hover:text-red-400'}`}>
                          {u.isSuspended ? 'Restore' : 'Suspend'}
                        </button>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl">
              <h3 className="text-xl sm:text-2xl font-serif text-white mb-6 sm:mb-8 italic">Platform Settings</h3>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5">
                  <span className="text-sm text-zinc-400 font-medium">Public Archive Access</span>
                  <div className="w-10 sm:w-12 h-5 sm:h-6 bg-amber-500 rounded-full relative shadow-inner"><div className="absolute right-0.5 sm:right-1 top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5">
                  <span className="text-sm text-zinc-400 font-medium">Auction Lot Fee</span>
                  <span className="text-white font-bold tabular-nums">2.5%</span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5">
                  <span className="text-sm text-zinc-400 font-medium">Secondary Royalty</span>
                  <span className="text-white font-bold tabular-nums">10%</span>
                </div>
              </div>
            </div>
            
            <div className="glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl flex flex-col">
               <div className="flex justify-between items-center mb-6 sm:mb-8">
                 <h3 className="text-xl sm:text-2xl font-serif text-white italic leading-none">Brand Story</h3>
                 <button 
                   onClick={handleForgeBrand}
                   disabled={isForging}
                   className="bg-amber-500 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 shadow-lg"
                 >
                   {isForging ? 'Forging...' : 'Simulate'}
                 </button>
               </div>
               <div className="flex-1 bg-black/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/5 min-h-[150px] sm:min-h-[200px]">
                 {brandStory ? (
                   <p className="text-xs sm:text-sm text-zinc-400 italic leading-relaxed whitespace-pre-line">{brandStory}</p>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-8">
                     <svg className="w-10 h-10 sm:w-12 sm:h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                     <p className="text-[10px] uppercase font-black tracking-widest">No story forged</p>
                   </div>
                 )}
               </div>
             </div>

            <div className="glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl md:col-span-2">
              <h3 className="text-xl sm:text-2xl font-serif text-white mb-6 sm:mb-8 italic">System Heartbeat</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-400 p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)] flex-shrink-0"></div>
                  <span className="font-medium">Mainnet Node: Active</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-400 p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)] flex-shrink-0"></div>
                  <span className="font-medium">Storage Layer: Linked</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-400 p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)] flex-shrink-0"></div>
                  <span className="font-medium">AI Core: Responsive</span>
                </div>
              </div>
            </div>
         </div>
       )}
    </div>
  );
};

export const CuratorDashboard: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);

  React.useEffect(() => {
    hybridBackend.getExhibitions().then(setExhibitions);
  }, []);
  const [showCreate, setShowCreate] = useState(false);
  const [searchNarrative, setSearchNarrative] = useState('');

  const handleStatusChange = async (ex: Exhibition, status: Exhibition['status']) => {
    await hybridBackend.updateExhibition({ ...ex, status });
    hybridBackend.getExhibitions().then(setExhibitions);
  };

  return (
    <div className="space-y-8 sm:space-y-16 animate-fadeIn pb-10 sm:pb-20 px-2">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8">
          <div>
            <h2 className="text-4xl sm:text-5xl font-serif text-white mb-2 italic leading-tight">Curatorial <br className="sm:hidden" /><span className="text-gold">Station</span></h2>
            <p className="text-zinc-500 text-sm">Manage narratives and exhibition flows across the global sanctuary.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto items-stretch sm:items-center">
            <div className="relative flex-1 sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input 
                type="text" 
                placeholder="Search narratives..." 
                value={searchNarrative}
                onChange={(e) => setSearchNarrative(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            <button onClick={() => setShowCreate(true)} className="bg-white text-black px-6 sm:px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg whitespace-nowrap">
              Launch New
            </button>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {exhibitions.filter(ex => !searchNarrative || ex.title.toLowerCase().includes(searchNarrative.toLowerCase()) || ex.theme.toLowerCase().includes(searchNarrative.toLowerCase()) || ex.description.toLowerCase().includes(searchNarrative.toLowerCase())).map(ex => (
            <div key={ex.id} className="glass rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden flex flex-col border border-white/5 hover:border-white/20 transition-all group shadow-xl">
              <div className="h-40 sm:h-48 relative overflow-hidden">
                <img src={ex.bannerUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-2">
                  <button onClick={() => alert('Curation prioritized...')} className="px-2.5 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-white hover:bg-amber-500 hover:text-black transition-colors border border-white/10">
                    Feature
                  </button>
                  <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-white/10 ${
                    ex.status === 'active' ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                    ex.status === 'upcoming' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {ex.status}
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <h3 className="text-xl sm:text-2xl font-serif text-white mb-1.5 leading-tight italic">{ex.title}</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6 font-bold">{ex.theme}</p>
                <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-8 flex-1 leading-relaxed">{ex.description}</p>
                
                <div className="flex flex-wrap items-center justify-between pt-6 border-t border-white/5 gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 shadow-lg">
                          ?
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] uppercase font-black text-zinc-600 tracking-widest leading-none">Analytics active</span>
                  </div>
                  <select 
                    value={ex.status}
                    onChange={(e) => handleStatusChange(ex, e.target.value as Exhibition['status'])}
                    className="bg-transparent text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500 outline-none cursor-pointer hover:text-white transition-colors"
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
         <div className="fixed inset-0 z-[210] bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
           <div className="bg-zinc-900 border border-white/10 p-6 sm:p-12 rounded-2xl sm:rounded-3xl w-full max-w-2xl relative my-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
             <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-zinc-500 hover:text-white p-2">
               <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
             <h3 className="text-2xl sm:text-3xl font-serif text-white mb-6 sm:mb-8 uppercase tracking-tight italic">Curate Narrative</h3>
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
             }} className="space-y-6 sm:space-y-8">
               <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Exhibition Title</label><input name="title" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
               <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Conceptual Theme</label><input name="theme" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
               <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Narrative Description</label><textarea name="description" rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white outline-none focus:border-amber-500 text-sm" /></div>
               <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-amber-500 transition-all text-sm uppercase tracking-widest">Launch Narrative</button>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};
