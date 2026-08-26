import React, { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { Trash2, Loader2, ArrowRight, ShoppingBag, Check, Sparkles, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

const RENDER_API = 'https://fashionxpress.onrender.com';

export function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchCart = async () => {
    setIsLoading(true);
    if (!isAuthenticated || !token) {
      // Load from guest local storage
      try {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        setCartItems(guestCart);
      } catch {
        setCartItems([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${RENDER_API}/api/home-visit-cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(Array.isArray(data) ? data : []);
      } else {
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, token]);

  const handleRemove = async (productId: number, size?: string) => {
    setRemovingId(productId);
    try {
      if (isAuthenticated && token) {
        await fetch(`${RENDER_API}/api/home-visit-cart/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        const updated = cartItems.filter(item => {
          const id = item.productId || item.product?.id || item.id;
          return !(id === productId && (!size || item.size === size));
        });
        localStorage.setItem('guest_cart', JSON.stringify(updated));
      }
      setCartItems(prev => prev.filter(item => {
        const id = item.productId || item.product?.id || item.id;
        return !(id === productId && (!size || item.size === size));
      }));
      toast({ title: "Removed from selection" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to remove", variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const totalEstimate = cartItems.reduce((sum, item) => {
    const product = item.product || item;
    const price = Number(product.sellingPrice) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your selection…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-serif text-foreground mb-2">Home Try-On Selection</h1>
          <p className="text-muted-foreground">Review the designer outfits you want our Fashion Executive to bring to your door.</p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-24 border border-border rounded-3xl bg-card/30 max-w-lg mx-auto p-12">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-4 border border-border">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-serif text-foreground mb-2">Your selection is empty</h3>
          <p className="text-muted-foreground text-sm mb-6">Browse our collection and select the pieces you'd like to try at home.</p>
          <Link href="/products">
            <Button className="tracking-widest uppercase text-xs font-bold gap-2">
              Explore Collection <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Items List */}
          <div className="flex-1 space-y-4">
            {cartItems.map((item, index) => {
              const product = item.product || item;
              const productId = item.productId || product.id;
              const images = Array.isArray(product.images) && product.images.length > 0
                ? product.images
                : [product.imageUrl || '/placeholder.jpg'];

              return (
                <div key={item.id || `${productId}-${index}`} className="flex gap-4 p-4 rounded-2xl border border-border bg-card/40 hover:bg-card/70 transition-all shadow-md">
                  <Link href={`/products/${productId}`} className="w-24 h-32 rounded-xl overflow-hidden bg-foreground/5 shrink-0 block">
                    <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      {product.brandName && (
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                          {product.brandName}
                        </span>
                      )}
                      <Link href={`/products/${productId}`} className="text-base font-serif font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">
                        Size: <span className="font-semibold text-foreground">{item.size || 'M'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="text-base font-bold text-foreground">{formatPrice(product.sellingPrice)}</div>
                      <button 
                        onClick={() => handleRemove(productId, item.size)}
                        disabled={removingId === productId}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 font-semibold p-1"
                      >
                        {removingId === productId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <><Trash2 className="w-3.5 h-3.5" /> Remove</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout Summary Card */}
          <div className="w-full lg:w-96">
            <div className="bg-card border border-border rounded-3xl p-6 sticky top-24 shadow-2xl space-y-6">
              <h3 className="font-serif text-xl font-bold text-foreground">Visit Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pieces for Try-On</span>
                  <span className="text-foreground font-bold">{cartItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Cart Value</span>
                  <span className="text-foreground font-bold">{formatPrice(totalEstimate)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-muted-foreground">Booking & Visit Fee</span>
                  <span className="text-emerald-400 font-bold uppercase text-xs tracking-wider">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upfront Payment</span>
                  <span className="text-primary font-black text-base">{formatPrice(0)}</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 text-xs text-foreground/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <Sparkles className="w-4 h-4" /> Try Before You Pay
                </div>
                <p className="leading-relaxed">
                  Our Fashion Executive will arrive with these items. Try them at home and only pay for what you keep.
                </p>
              </div>

              <Link href="/book-visit">
                <Button className="w-full h-13 text-xs tracking-widest uppercase font-bold rounded-xl gap-2 shadow-lg shadow-primary/20">
                  <MapPin className="w-4 h-4" /> Book Home Visit Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
