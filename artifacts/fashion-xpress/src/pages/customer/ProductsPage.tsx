import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useListProducts, useListCategories } from '@workspace/api-client-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Search, Loader2, Heart, ShoppingBag } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const { isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: categories } = useListCategories();
  const { data: productsData, isLoading } = useListProducts({
    search: search || undefined,
    categoryId,
  });

  const handleAddToCart = async (e: React.MouseEvent, productId: number, productName: string) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    if (!isAuthenticated) { setLocation('/login'); return; }
    
    try {
      const res = await fetch('/api/home-visit-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: 1, size: 'M' })
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "✅ Added to Home Visit", description: `${productName} will be brought to your consultation.` });
      queryClient.invalidateQueries({ queryKey: ['/api/home-visit-cart'] });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent, productId: number, productName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLocation('/login'); return; }
    
    try {
      const res = await fetch('/api/wishlist', {
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">The Collection</h1>
          <p className="text-muted-foreground">Curated pieces for your personal style.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search pieces..." 
              className="pl-9 bg-card border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="h-10 rounded-md border border-white/10 bg-card px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Categories</option>
            {Array.isArray(categories) && categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !productsData?.items?.length ? (
        <div className="text-center py-24 border border-white/5 rounded-2xl bg-card/30">
          <p className="text-muted-foreground">No pieces found matching your criteria.</p>
          <Button variant="link" onClick={() => { setSearch(''); setCategoryId(undefined); }} className="text-primary mt-2">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {productsData?.items?.map(product => (
            <div key={product.id} className="group block">
              <Link href={`/products/${product.id}`} className="block">
                <div className="relative aspect-[3/4] bg-card/50 rounded-lg overflow-hidden mb-4 border border-white/5 group-hover:border-primary/30 transition-colors">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                  )}
                  {product.stock < 5 && product.stock > 0 && (
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 text-[10px] uppercase tracking-widest text-primary border border-primary/20 rounded">
                      Few Left
                    </div>
                  )}
                  
                  {/* Quick action buttons - visible on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    <button 
                      onClick={(e) => handleAddToCart(e, product.id, product.name)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-md py-2 text-xs font-medium tracking-wider uppercase hover:bg-primary/90 transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Add to Visit
                    </button>
                    <button 
                      onClick={(e) => handleAddToWishlist(e, product.id, product.name)}
                      className="flex items-center justify-center bg-white/10 backdrop-blur text-white rounded-md px-3 py-2 hover:bg-white/20 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
              <div>
                <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{product.brandName}</div>
                <h3 className="text-white font-serif text-lg mb-1 truncate">{product.name}</h3>
                <div className="text-white/80">{formatPrice(product.sellingPrice)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}