import React, { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { Trash2, ShoppingBag, Loader2, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

const RENDER_API = 'https://fashionxpress.onrender.com';

export function WishlistPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, token, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchWishlist = async () => {
    setIsLoading(true);
    if (!isAuthenticated || !token) {
      // Load from guest local storage
      try {
        const guestWishlist = JSON.parse(localStorage.getItem('guest_wishlist') || '[]');
        setWishlist(guestWishlist);
      } catch {
        setWishlist([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${RENDER_API}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(Array.isArray(data) ? data : []);
      } else {
        setWishlist([]);
      }
    } catch {
      setWishlist([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated, token]);

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    try {
      if (isAuthenticated && token) {
        await fetch(`${RENDER_API}/api/wishlist/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        const updated = wishlist.filter(item => (item.productId || item.product?.id || item.id) !== productId);
        localStorage.setItem('guest_wishlist', JSON.stringify(updated));
      }
      setWishlist(prev => prev.filter(item => (item.productId || item.product?.id || item.id) !== productId));
      toast({ title: "Removed from wishlist" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to remove", variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = (productId: number) => {
    toast({
      title: "Select a Size",
      description: "Please select a size on the product details page to add it to your cart.",
    });
    setLocation(`/products/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your saved pieces…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-serif text-foreground mb-2">Saved Pieces</h1>
          <p className="text-muted-foreground">Your personal curation of luxury fashion.</p>
        </div>
        {!isAuthenticated && (
          <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 p-3 px-4 rounded-xl text-xs text-foreground">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>Sign in to sync your wishlist across all devices.</span>
            <Link href="/login">
              <Button size="sm" className="h-8 text-xs font-bold uppercase">Sign In</Button>
            </Link>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-24 border border-border rounded-3xl bg-card/30 max-w-lg mx-auto p-12">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-border">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-serif text-foreground mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground text-sm mb-6">Explore our curated collection and save pieces you love.</p>
          <Link href="/products">
            <Button className="tracking-widest uppercase text-xs font-bold gap-2">
              Explore Collection <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map(item => {
            const product = item.product || item;
            const productId = item.productId || product.id;
            const images = Array.isArray(product.images) && product.images.length > 0
              ? product.images
              : [product.imageUrl || '/placeholder.jpg'];

            return (
              <div key={item.id || productId} className="group border border-border bg-card/40 hover:bg-card/80 rounded-2xl overflow-hidden flex flex-col transition-all shadow-lg hover:shadow-2xl">
                <Link href={`/products/${productId}`} className="block relative aspect-[3/4] overflow-hidden bg-foreground/5">
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {product.brandName && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md text-primary text-[10px] font-bold uppercase rounded-md border border-white/10">
                      {product.brandName}
                    </span>
                  )}
                </Link>
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-foreground font-serif font-bold text-base mb-1 line-clamp-1">{product.name}</h3>
                    <div className="text-foreground/90 font-bold mb-4">{formatPrice(product.sellingPrice)}</div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-3 border-t border-border">
                    <Button 
                      className="flex-1 text-xs tracking-wider uppercase font-bold h-10 gap-1.5" 
                      onClick={() => handleMoveToCart(productId)}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Pick Size
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10"
                      onClick={() => handleRemove(productId)}
                      disabled={removingId === productId}
                    >
                      {removingId === productId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
