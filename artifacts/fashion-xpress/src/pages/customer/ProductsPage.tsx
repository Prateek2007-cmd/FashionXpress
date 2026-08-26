import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Search, Loader2, Heart, ShoppingBag, Sparkles, SlidersHorizontal,
  Flame, Tag, Palette, Star, X, ChevronDown, LayoutGrid, Grid3x3, Grid2x2, List, RefreshCw
} from 'lucide-react';

const RENDER_API = 'https://fashionxpress.onrender.com';

const COLOR_OPTIONS = ['Red', 'Pink', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'White', 'Black', 'Gold', 'Silver', 'Maroon', 'Navy Blue', 'Peach', 'Lavender', 'Turquoise', 'Mint', 'Coral', 'Beige', 'Ivory'];
const OCCASION_OPTIONS = ['Wedding', 'Party', 'Festive', 'Casual', 'Formal', 'Engagement', 'Baby Shower', 'Cocktail', 'Office', 'Traditional', 'Sangeet', 'Mehndi', 'Reception', 'College', 'Date Night'];

const getDiscountPercent = (mrp?: number, sellingPrice?: number) => {
  if (!mrp || !sellingPrice || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [brandId, setBrandId] = useState<number | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(undefined);
  const [occasion, setOccasion] = useState<string | undefined>(undefined);
  const [collectionTitle, setCollectionTitle] = useState<string>('The Collection');
  const [discountFilter, setDiscountFilter] = useState<string>('all');
  const [gridView, setGridView] = useState<'grid-2' | 'grid-3' | 'grid-4' | 'list'>('grid-4');

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Load categories & brands on mount
  useEffect(() => {
    fetch(`${RENDER_API}/api/categories`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});

    fetch(`${RENDER_API}/api/brands`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBrands(data); })
      .catch(() => {});
  }, []);

  // Fetch products whenever filters change
  const fetchProducts = () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (categoryId) params.append('categoryId', categoryId.toString());
    if (brandId) params.append('brandId', brandId.toString());
    if (color) params.append('color', color);
    if (occasion) params.append('occasion', occasion);
    params.append('limit', '100');

    const url = `${RENDER_API}/api/products?${params.toString()}`;

    fetch(url)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data)
          ? data
          : data?.products || data?.items || [];
        setProducts(list);
      })
      .catch(err => {
        setError(err.message || 'Failed to load products');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryId, brandId, color, occasion]);

  // Sync URL search params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('category');
    const searchParam = params.get('search');
    const filterParam = params.get('filter');

    if (filterParam === 'price-drop') {
      setDiscountFilter('price-drop');
      setCollectionTitle('Price Drop Collection');
    } else if (filterParam === 'new') {
      setDiscountFilter('all');
      setCollectionTitle('New Arrivals');
    }

    if (searchParam) setSearch(searchParam);

    if (catParam && categories.length > 0) {
      const lower = catParam.toLowerCase();
      if (lower === 'men' || lower === 'mens' || lower === 'mens-ethnic') {
        setCollectionTitle("Men's Collection");
      } else if (lower === 'women' || lower === 'womens' || lower === 'womens-ethnic' || lower === 'sarees') {
        setCollectionTitle("Women's Collection");
      } else if (lower === 'accessories') {
        setCollectionTitle('Accessories');
      }

      const match = categories.find(c =>
        c.slug?.toLowerCase() === lower ||
        c.id?.toString() === catParam ||
        c.name?.toLowerCase().includes(lower)
      );
      if (match) setCategoryId(match.id);
    }
  }, [categories]);

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setLocation(`/products/${productId}`);
  };

  const handleAddToWishlist = async (e: React.MouseEvent, productId: number, productName: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const productObj = products.find(p => p.id === productId) || { id: productId, name: productName };
      
      // Always store locally so UI reflects it immediately
      const guestWishlist = JSON.parse(localStorage.getItem('guest_wishlist') || '[]');
      if (!guestWishlist.some((item: any) => (item.productId || item.id) === productId)) {
        guestWishlist.push({ id: productId, productId, product: productObj });
        localStorage.setItem('guest_wishlist', JSON.stringify(guestWishlist));
      }

      if (isAuthenticated && token) {
        await fetch(`${RENDER_API}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ productId })
        });
      }
      toast({ title: "❤️ Saved to Wishlist", description: `${productName} added to your saved pieces.` });
    } catch {
      toast({ title: "❤️ Saved to Wishlist", description: `${productName} saved for later.` });
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setCategoryId(undefined);
    setBrandId(undefined);
    setColor(undefined);
    setOccasion(undefined);
    setDiscountFilter('all');
  };

  const filteredProducts = products.filter(product => {
    const discount = getDiscountPercent(product.mrp, product.sellingPrice);
    if (discountFilter === 'price-drop') return discount >= 35 || (product.mrp && product.mrp > product.sellingPrice);
    if (discountFilter === '50') return discount >= 50;
    if (discountFilter === 'any') return discount > 0;
    return true;
  });

  const isPriceDrop = discountFilter === 'price-drop';
  const hasActiveFilters = search || categoryId || brandId || color || occasion || discountFilter !== 'all';

  const gridCssClass = {
    'grid-2': 'grid grid-cols-2 gap-3 sm:gap-6',
    'grid-3': 'grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6',
    'grid-4': 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6',
    'list': 'grid grid-cols-1 gap-4 sm:gap-6',
  }[gridView];

  return (
    <div className="min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card/60 to-transparent py-16 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          {isPriceDrop ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs uppercase tracking-[0.2em] font-bold mb-6">
                <Flame className="w-3.5 h-3.5" /> Live Sale — Up to 60% Off
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-black text-foreground leading-tight mb-4">
                Price Drop<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-300 to-red-500">Collection</span>
              </h1>
              <p className="text-foreground/60 text-lg max-w-xl mx-auto">
                Exclusive luxury pieces, dramatically reduced. Limited stock — first come, first served.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-[0.2em] font-bold mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Curated For You
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-black text-foreground leading-tight mb-4">
                {collectionTitle.includes(' ') ? (
                  <>
                    {collectionTitle.split(' ').slice(0, -1).join(' ')}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
                      {collectionTitle.split(' ').slice(-1)[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
                    {collectionTitle}
                  </span>
                )}
              </h1>
              <p className="text-foreground/70 text-lg max-w-2xl mx-auto leading-relaxed">
                Curated designer pieces and exclusive discounted styles with up to <span className="text-amber-300 font-semibold">30%–60% OFF</span>, brought directly to your doorstep by our personal Fashion Executives.
              </p>
            </>
          )}

          {/* Quick stat strip */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {[
              { icon: Tag, label: `${products.length} Curated Pieces`, color: "text-primary" },
              { icon: Flame, label: "Up to 60% OFF", color: "text-red-400" },
              { icon: Star, label: "Premium Brands", color: "text-amber-400" },
              { icon: ShoppingBag, label: "Try Before You Pay", color: "text-purple-400" },
            ].map(({ icon: Icon, label, color }, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-foreground/[0.03] border border-border rounded-xl text-xs font-semibold text-foreground/80 uppercase tracking-wider shadow-sm">
                <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER & GRID CONTROLS BAR ── */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-xl border-b border-border shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 flex-wrap justify-between">

            {/* Left side: Search & Dropdowns */}
            <div className="flex items-center gap-3 flex-wrap flex-grow">
              {/* Search */}
              <div className="relative flex-grow max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search pieces..."
                  className="pl-9 h-10 bg-foreground/5 border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filters row */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="h-10 rounded-xl border border-red-500/30 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold uppercase tracking-wider"
                  value={discountFilter}
                  onChange={(e) => setDiscountFilter(e.target.value)}
                >
                  <option value="all">All Items</option>
                  <option value="price-drop">🔥 35%+ OFF</option>
                  <option value="50">50%+ OFF</option>
                  <option value="any">Any Discount</option>
                </select>

                <select
                  className="h-10 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={brandId || ''}
                  onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">All Brands</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={color || ''}
                  onChange={(e) => setColor(e.target.value || undefined)}
                >
                  <option value="">All Colours</option>
                  {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  className="h-10 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={occasion || ''}
                  onChange={(e) => setOccasion(e.target.value || undefined)}
                >
                  <option value="">All Occasions</option>
                  {OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Right side: Grid View Mode Selector + Count */}
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground font-medium hidden lg:block">
                {isLoading ? '...' : <span><span className="text-foreground font-bold">{filteredProducts.length}</span> pieces</span>}
              </div>

              {/* Grid View Controls */}
              <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setGridView('grid-2')}
                  className={`p-2 rounded-lg transition-colors ${gridView === 'grid-2' ? 'bg-primary text-primary-foreground font-bold shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  title="2 Columns View"
                >
                  <Grid2x2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridView('grid-3')}
                  className={`p-2 rounded-lg transition-colors ${gridView === 'grid-3' ? 'bg-primary text-primary-foreground font-bold shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  title="3 Columns View"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridView('grid-4')}
                  className={`p-2 rounded-lg transition-colors ${gridView === 'grid-4' ? 'bg-primary text-primary-foreground font-bold shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  title="4 Columns View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridView('list')}
                  className={`p-2 rounded-lg transition-colors ${gridView === 'list' ? 'bg-primary text-primary-foreground font-bold shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm font-medium">Loading collection…</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-card/20 border border-border rounded-3xl p-12 max-w-lg mx-auto">
            <p className="text-destructive font-semibold mb-3">Error loading products</p>
            <p className="text-xs text-muted-foreground mb-6">{error}</p>
            <Button onClick={fetchProducts} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-card/20 border border-border rounded-3xl p-12 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-border">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-serif text-foreground mb-2">No pieces found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {hasActiveFilters ? "Try adjusting your filters or search terms." : "No products available in this category yet."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className={gridCssClass}>
            {filteredProducts.map((product) => {
              const discount = getDiscountPercent(product.mrp, product.sellingPrice);
              const isHeavyDiscount = discount >= 35;
              const productImages = Array.isArray(product.images) && product.images.length > 0
                ? product.images
                : [product.imageUrl || '/placeholder.jpg'];

              return (
                <div
                  key={product.id}
                  className="group relative bg-card/30 hover:bg-card/70 border border-border hover:border-primary/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-1"
                >
                  <Link href={`/products/${product.id}`} className="flex-1 flex flex-col">
                    {/* Image Box */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-foreground/5">
                      <img
                        src={productImages[0]}
                        alt={product.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = '0.7';
                        }}
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {discount > 0 && (
                          <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isHeavyDiscount ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-primary text-primary-foreground'}`}>
                            {discount}% OFF
                          </div>
                        )}
                        {product.occasion && (
                          <div className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[9px] font-semibold uppercase tracking-wider text-foreground/80 border border-white/10">
                            {product.occasion}
                          </div>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => handleAddToWishlist(e, product.id, product.name)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-foreground/70 hover:text-red-400 hover:bg-black/80 transition-all z-10"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content Box */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {product.brandName && (
                          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-1">
                            {product.brandName}
                          </p>
                        )}
                        <h4 className="font-serif font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-base sm:text-lg font-bold text-foreground">
                            {formatPrice(product.sellingPrice)}
                          </span>
                          {product.mrp && product.mrp > product.sellingPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.mrp)}
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          onClick={(e) => handleAddToCart(e, product.id)}
                          className="w-full h-9 text-xs uppercase tracking-wider font-bold rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Try at Home
                        </Button>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}