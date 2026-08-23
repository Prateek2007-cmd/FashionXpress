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
  Flame, Tag, Palette, Star, X, ChevronDown
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

  const filteredProducts = (productsData?.items || []).filter(product => {
    const discount = getDiscountPercent(product.mrp, product.sellingPrice);
    if (discountFilter === 'price-drop') return discount >= 35 || (product.mrp && product.mrp > product.sellingPrice);
    if (discountFilter === '50') return discount >= 50;
    if (discountFilter === 'any') return discount > 0;
    return true;
  });

  const isPriceDrop = discountFilter === 'price-drop';
  const hasActiveFilters = search || categoryId || brandId || color || occasion || discountFilter !== 'all';

  return (
    <div className="min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-card/60 to-transparent py-16 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          {isPriceDrop ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs uppercase tracking-[0.2em] font-bold mb-6">
                <Flame className="w-3.5 h-3.5" /> Live Sale — Up to 60% Off
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-black text-white leading-tight mb-4">
                Price Drop<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-300 to-red-500">Collection</span>
              </h1>
              <p className="text-white/60 text-lg max-w-xl mx-auto">
                Exclusive luxury pieces, dramatically reduced. Limited stock — first come, first served.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-[0.2em] font-bold mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Curated For You
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-black text-white leading-tight mb-4">
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
              <p className="text-white/60 text-lg max-w-xl mx-auto">
                Hand-picked premium pieces brought to your doorstep by our personal Fashion Executives.
              </p>
            </>
          )}

          {/* Quick stat strip */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {[
              { icon: Tag, label: `${productsData?.total || 0} Pieces`, color: "text-primary" },
              { icon: Star, label: "Premium Brands", color: "text-amber-400" },
              { icon: ShoppingBag, label: "Try at Home", color: "text-purple-400" },
            ].map(({ icon: Icon, label, color }, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-semibold text-white/70 uppercase tracking-wider">
                <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-grow max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pieces..."
                className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary/40 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className="h-10 rounded-xl border border-red-500/30 bg-card/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold uppercase tracking-wider"
                value={discountFilter}
                onChange={(e) => setDiscountFilter(e.target.value)}
              >
                <option value="all">All Items</option>
                <option value="price-drop">🔥 35%+ OFF</option>
                <option value="50">50%+ OFF</option>
                <option value="any">Any Discount</option>
              </select>

              <select
                className="h-10 rounded-xl border border-white/10 bg-card/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">All Categories</option>
                {Array.isArray(categories) && categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                className="h-10 rounded-xl border border-white/10 bg-card/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                value={brandId || ''}
                onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">All Brands</option>
                {Array.isArray(brands) && brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                className="h-10 rounded-xl border border-white/10 bg-card/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                value={color || ''}
                onChange={(e) => setColor(e.target.value || undefined)}
              >
                <option value="">All Colours</option>
                {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                className="h-10 rounded-xl border border-white/10 bg-card/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
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

            {/* Results count */}
            <div className="ml-auto text-xs text-muted-foreground font-medium hidden md:block">
              {isLoading ? '...' : <span><span className="text-white font-bold">{filteredProducts.length}</span> pieces found</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Loading Collection…</p>
          </div>
        ) : !filteredProducts.length ? (
          <div className="text-center py-32 border border-white/5 border-dashed rounded-3xl bg-card/10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-white font-serif text-2xl mb-2">No pieces found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms.</p>
            <Button onClick={clearAllFilters} variant="outline" className="rounded-xl">
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const discountPercent = getDiscountPercent(product.mrp, product.sellingPrice);
              const wishlisted = isWishlisted(product.id);
              return (
                <div key={product.id} className="group relative">
                  <Link href={`/products/${product.id}`} className="block">

                    {/* Image container */}
                    <div className="relative aspect-[3/4] bg-card/50 rounded-2xl overflow-hidden mb-4 border border-white/5 group-hover:border-primary/30 transition-all duration-500 shadow-xl group-hover:shadow-primary/10 group-hover:shadow-2xl">
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
                          <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground border border-white/10 rounded-lg font-bold">
                            Sold Out
                          </div>
                        )}
                      </div>

                      {discountPercent > 0 && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-lg border border-red-400/30">
                          {discountPercent}% OFF
                        </div>
                      )}

                      {/* Wishlist button — always visible */}
                      <button
                        onClick={(e) => handleAddToWishlist(e, product.id, product.name)}
                        className={`absolute top-3 ${discountPercent > 0 ? 'top-12' : 'top-3'} right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg z-10 ${wishlisted ? 'bg-red-500 border-red-400/30' : 'bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-red-500/20'}`}
                        style={{ top: discountPercent > 0 ? '3.2rem' : '0.75rem' }}
                      >
                        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-white text-white' : 'text-white/80'}`} />
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
                      <h3 className="text-white font-serif text-base mb-2 truncate hover:text-primary transition-colors cursor-pointer">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">{formatPrice(product.sellingPrice)}</span>
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
                        className={`h-10 px-3 flex items-center justify-center rounded-xl border transition-colors ${wishlisted ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-400 text-red-400' : 'text-white'}`} />
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