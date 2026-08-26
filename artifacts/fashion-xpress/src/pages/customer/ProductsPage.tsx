import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useListProducts, useListCategories, useListWishlist, useListBrands } from '@workspace/api-client-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search, Loader2, Heart, ShoppingBag, Sparkles, SlidersHorizontal,
  Flame, Tag, Palette, Star, X, ChevronDown, LayoutGrid, Grid3x3, Grid2x2, List
} from 'lucide-react';

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

  const { isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  // Sync URL search params on mount and navigation
  React.useEffect(() => {
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

    if (searchParam) {
      setSearch(searchParam);
    }

    if (catParam) {
      const lower = catParam.toLowerCase();
      if (lower === 'men' || lower === 'mens' || lower === 'mens-ethnic') {
        setCollectionTitle("Men's Collection");
      } else if (lower === 'women' || lower === 'womens' || lower === 'womens-ethnic' || lower === 'sarees') {
        setCollectionTitle("Women's Collection");
      } else if (lower === 'accessories') {
        setCollectionTitle('Accessories');
      }

      if (categories && Array.isArray(categories)) {
        const match = categories.find(c =>
          c.slug.toLowerCase() === lower ||
          c.id.toString() === catParam ||
          c.name.toLowerCase().includes(lower)
        );
        if (match) {
          setCategoryId(match.id);
        } else if (lower.includes('men')) {
          const menMatch = categories.find(c => c.name.toLowerCase().includes('men') || c.slug.includes('men'));
          if (menMatch) setCategoryId(menMatch.id);
          else setSearch('Men');
        } else if (lower.includes('women')) {
          const womenMatch = categories.find(c => c.name.toLowerCase().includes('women') || c.slug.includes('women') || c.name.toLowerCase().includes('saree'));
          if (womenMatch) setCategoryId(womenMatch.id);
          else setSearch('Women');
        } else if (lower.includes('accessori')) {
          const accMatch = categories.find(c => c.name.toLowerCase().includes('accessori') || c.slug.includes('accessori'));
          if (accMatch) setCategoryId(accMatch.id);
          else setSearch('Accessories');
        }
      }
    }
  }, [categories]);

  const { data: productsData, isLoading } = useListProducts({
    search: search || undefined,
    categoryId,
    brandId,
    color,
    occasion,
  });
  const { data: wishlistData } = useListWishlist();

  const isWishlisted = (productId: number) =>
    wishlistData?.some(w => w.productId === productId) || false;

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const handleAddToCart = async (e: React.MouseEvent, productId: number, productName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLocation('/login'); return; }
    toast({ title: "Select a Size", description: "Please select a size on the product page.", variant: "destructive" });
    setTimeout(() => setLocation(`/products/${productId}`), 1000);
  };

  const handleAddToWishlist = async (e: React.MouseEvent, productId: number, productName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLocation('/login'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "❤️ Saved to Wishlist", description: `${productName} saved for later.` });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
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

  const allProducts: any[] = Array.isArray(productsData)
    ? productsData
    : (productsData as any)?.products || (productsData as any)?.items || [];

  const filteredProducts = allProducts.filter(product => {
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
              { icon: Tag, label: `${(productsData as any)?.total || allProducts.length} Curated Pieces`, color: "text-primary" },
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
                  {Array.isArray(categories) && categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={brandId || ''}
                  onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">All Brands</option>
                  {Array.isArray(brands) && brands.map(b => (
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
          <div className={gridCssClass}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-2xl mb-4" />
                <div className="px-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                  <div className="h-4 bg-muted rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : !filteredProducts.length ? (
          <div className="text-center py-32 border border-border border-dashed rounded-3xl bg-card/10">
            <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-serif text-2xl mb-2">No pieces found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms.</p>
            <Button onClick={clearAllFilters} variant="outline" className="rounded-xl">
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className={gridCssClass}>
            {filteredProducts.map(product => {
              const discountPercent = getDiscountPercent(product.mrp, product.sellingPrice);
              const wishlisted = isWishlisted(product.id);

              /* List View Rendering */
              if (gridView === 'list') {
                return (
                  <div key={product.id} className="group relative bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-6 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
                    <Link href={`/products/${product.id}`} className="shrink-0 w-full md:w-56 aspect-[3/4] rounded-xl overflow-hidden relative bg-muted">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ShoppingBag className="w-8 h-8 opacity-30" /></div>
                      )}
                      {discountPercent > 0 && (
                        <span className="absolute top-2 left-2 bg-red-600 text-foreground text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </Link>

                    <div className="flex-grow flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{product.brandName}</div>
                        <Link href={`/products/${product.id}`}>
                          <h3 className="text-foreground font-serif text-xl font-bold hover:text-primary transition-colors cursor-pointer mb-2">{product.name}</h3>
                        </Link>
                        {product.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{product.description}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          {product.color && <span className="px-2.5 py-1 bg-foreground/5 rounded-md border border-border">Color: <strong className="text-foreground capitalize">{product.color}</strong></span>}
                          {product.fabric && <span className="px-2.5 py-1 bg-foreground/5 rounded-md border border-border">Fabric: <strong className="text-foreground">{product.fabric}</strong></span>}
                          {product.occasion && <span className="px-2.5 py-1 bg-foreground/5 rounded-md border border-border">Occasion: <strong className="text-foreground capitalize">{product.occasion}</strong></span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-foreground font-bold text-2xl">{formatPrice(product.sellingPrice)}</span>
                          {product.mrp > product.sellingPrice && (
                            <span className="text-muted-foreground text-base line-through">{formatPrice(product.mrp)}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleAddToWishlist(e, product.id, product.name)}
                            className={`p-3 rounded-xl border transition-all ${wishlisted ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-foreground/5 border-border hover:bg-foreground/10 text-foreground'}`}
                            title="Save to Wishlist"
                          >
                            <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
                          </button>
                          <Button
                            onClick={(e) => handleAddToCart(e, product.id, product.name)}
                            className="h-11 px-6 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" /> Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              /* Standard Grid Card Rendering */
              return (
                <div key={product.id} className="group relative">
                  <Link href={`/products/${product.id}`} className="block">

                    {/* Image container */}
                    <div className="relative aspect-[3/4] bg-card/50 rounded-2xl overflow-hidden mb-4 border border-border group-hover:border-primary/30 transition-all duration-500 shadow-xl group-hover:shadow-primary/10 group-hover:shadow-2xl">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <ShoppingBag className="w-8 h-8 opacity-30" />
                          <span className="text-xs">No Image</span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.stock < 5 && product.stock > 0 && (
                          <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] uppercase tracking-widest text-primary border border-primary/30 rounded-lg font-bold">
                            Few Left
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-lg font-bold">
                            Sold Out
                          </div>
                        )}
                      </div>

                      {discountPercent > 0 && (
                        <div className="absolute top-3 right-3 bg-red-600 text-foreground text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-lg border border-red-400/30">
                          {discountPercent}% OFF
                        </div>
                      )}

                      {/* Wishlist button */}
                      <button
                        onClick={(e) => handleAddToWishlist(e, product.id, product.name)}
                        className={`absolute top-3 ${discountPercent > 0 ? 'top-12' : 'top-3'} right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg z-10 ${wishlisted ? 'bg-red-500 border-red-400/30 text-white' : 'bg-card backdrop-blur-sm border border-border hover:bg-red-500/20 text-foreground'}`}
                        style={{ top: discountPercent > 0 ? '3.2rem' : '0.75rem' }}
                      >
                        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
                      </button>

                      {/* Quick actions on hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex gap-2">
                        <button
                          onClick={(e) => handleAddToCart(e, product.id, product.name)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2.5 text-xs font-bold tracking-wider uppercase hover:bg-primary/90 transition-colors shadow-lg"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="px-1">
                    <div className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-1">{product.brandName}</div>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-foreground font-serif text-base mb-2 truncate hover:text-primary transition-colors cursor-pointer">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-bold text-lg">{formatPrice(product.sellingPrice)}</span>
                      {product.mrp > product.sellingPrice && (
                        <span className="text-muted-foreground text-sm line-through">{formatPrice(product.mrp)}</span>
                      )}
                      {discountPercent > 0 && (
                        <span className="text-red-400 text-xs font-bold">-{discountPercent}%</span>
                      )}
                    </div>

                    {/* Mobile actions */}
                    <div className="mt-3 flex gap-2 md:hidden">
                      <button
                        onClick={(e) => handleAddToCart(e, product.id, product.name)}
                        className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-primary/90 transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Cart
                      </button>
                      <button
                        onClick={(e) => handleAddToWishlist(e, product.id, product.name)}
                        className={`h-10 px-3 flex items-center justify-center rounded-xl border transition-colors ${wishlisted ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-foreground/5 border-border hover:bg-white/10 text-foreground'}`}
                      >
                        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}