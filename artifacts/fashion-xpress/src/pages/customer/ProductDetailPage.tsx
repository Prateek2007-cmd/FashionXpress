import React, { useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { useGetProduct, useListWishlist } from '@workspace/api-client-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Heart, Loader2, ArrowLeft, Ruler, ShoppingBag, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function ProductDetailPage() {
  const [, params] = useRoute('/products/:id');
  const productId = Number(params?.id);
  const { isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: ['/products', productId] }
  });
  const { data: wishlistData } = useListWishlist();

  const isWishlisted = wishlistData?.some(w => w.productId === productId) || false;

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://fashionxpress.onrender.com";

  const handleWishlist = async () => {
    if (!isAuthenticated) { setLocation('/login'); return; }
    setAddingToWishlist(true);
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({ title: "❤️ Added to Wishlist", description: "Piece saved for later." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add to wishlist.", variant: "destructive" });
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleCart = async () => {
    if (!isAuthenticated) { setLocation('/login'); return; }
    if (!selectedSize) {
      toast({ title: "Select a size", description: "Please select a size before adding to Home Visit.", variant: "destructive" });
      return;
    }
    setAddingToCart(true);
    try {
      const res = await fetch(`${API_BASE}/api/home-visit-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: 1, size: selectedSize })
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries({ queryKey: ['/api/home-visit-cart'] });
      setAddedToCart(true);
      toast({ title: "✅ Added to Home Visit", description: "This piece will be brought to your consultation." });
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add to your selection.", variant: "destructive" });
    } finally {
      setAddingToCart(false);
    }
  };

  if (isLoading) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!product) return <div className="min-h-[80vh] flex items-center justify-center text-muted-foreground">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link href="/products" className="inline-flex items-center text-sm tracking-widest uppercase text-muted-foreground hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collection
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-card/50 rounded-lg overflow-hidden border border-white/5">
            {product.images[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.slice(1).map((img, i) => (
              <div key={i} className="aspect-square bg-card/50 rounded-md overflow-hidden border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
                <img src={img} alt={`${product.name} view ${i+2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="text-sm text-primary tracking-widest uppercase mb-2">{product.brandName}</div>
          <h1 className="text-4xl font-serif text-white mb-4 leading-tight">{product.name}</h1>
          <div className="text-2xl text-white/90 mb-8 font-light">{formatPrice(product.sellingPrice)}</div>

          <p className="text-muted-foreground leading-relaxed mb-10 text-lg">
            {product.description || "A masterclass in modern tailoring, this piece embodies the sophisticated aesthetic of the house. Cut from premium fabric with impeccable attention to detail."}
          </p>

          <div className="grid grid-cols-2 gap-6 mb-10 border-y border-white/5 py-8">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Color</div>
              <div className="text-white capitalize">{product.color}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Fabric</div>
              <div className="text-white">{product.fabric}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Occasion</div>
              <div className="text-white capitalize">{product.occasion}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1 mb-1">
                <Ruler className="w-3 h-3" /> Available Sizes
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                      selectedSize === s 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-white/10 bg-white/5 text-white hover:border-white/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className={`flex-1 h-14 text-sm tracking-widest uppercase ${addedToCart ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={handleCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : addedToCart ? (
                  <><Check className="w-5 h-5 mr-2" /> Added!</>
                ) : (
                  <><ShoppingBag className="w-5 h-5 mr-2" /> Add to Home Visit</>
                )}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 border-white/20 text-white hover:bg-white/5 hover:text-white"
                onClick={handleWishlist}
                disabled={addingToWishlist}
              >
                {addingToWishlist ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              No payment required until you decide to keep the item after your fitting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
