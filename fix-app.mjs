import fs from 'fs';
const c = fs.readFileSync('App.tsx', 'utf8');
const appIdx = c.indexOf('const App: React.FC = () => {');
const dashboardIdx = c.indexOf("if (activeView === 'dashboard')");
if (appIdx === -1 || dashboardIdx === -1) { console.error('Markers not found', appIdx, dashboardIdx); process.exit(1); }

const newHead = `const App: React.FC = () => {
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

  useEffect(() => {
    hybridBackend.init().then(() => {
      hybridBackend.fetchCurrentUser().then((user) => {
        setCurrentUser(user);
        if (user) setActiveView('gallery');
        setIsAuthLoading(false);
      });
      hybridBackend.getArtworks().then(setArtworks);
    });
  }, []);

  const addToCart = (art: Artwork) => { if (!cart.find(c => c.id === art.id)) setCart(prev => [...prev, art]); };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));
  const cartTotal = cart.reduce((sum, a) => sum + a.price, 0);

  const handleCheckout = async () => {
    if (!currentUser || cart.length === 0) return;
    for (const art of cart) { await hybridBackend.purchaseArtwork(art.id, currentUser); }
    setCart([]);
    await refreshData();
    const u = await hybridBackend.fetchCurrentUser();
    if (u) setCurrentUser(u);
    setActiveView('gallery');
  };

  const refreshData = async () => { const a = await hybridBackend.getArtworks(); setArtworks(a); };
  const handleLogout = () => { hybridBackend.logout(); setCurrentUser(null); setActiveView('login'); };

  const handleArtworkAction = async (art: Artwork) => {
    if (!currentUser) { alert('Please sign in.'); return; }
    if (art.isAuction) { setActiveView('auctions'); setSelectedArtwork(null); return; }
    const success = await hybridBackend.purchaseArtwork(art.id, currentUser);
    if (success) {
      await refreshData();
      const updatedUser = await hybridBackend.fetchCurrentUser();
      if (updatedUser) setCurrentUser(updatedUser);
      setSelectedArtwork(null);
    }
  };

  const filteredArtworks = artworks.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
    if (activeView === 'sold') return matchesSearch && matchesCategory && !a.isListed;
    return matchesSearch && matchesCategory && a.isListed;
  });

  const categories = ['All', ...Array.from(new Set(artworks.map((a) => a.category)))];

  const renderContent = () => {
    if (activeView === 'login' || !currentUser) {
      return (
        <AuthFlow
          onLogin={(u) => {
            setCurrentUser(u);
            setActiveView('gallery');
          }}
        />
      );
    }
    `;

const result = c.substring(0, appIdx) + newHead + c.substring(dashboardIdx);
fs.writeFileSync('App.tsx', result, 'utf8');
console.log('Fixed! Old:', c.length, 'New:', result.length);
