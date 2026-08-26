import React, { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Heart, Loader2, ArrowLeft, Ruler, ShoppingBag, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const RENDER_API = 'https://fashionxpress.onrender.com';

export function ProductDetailPage() {
  const [, params] = useRoute('/products/:id');
  const productId = Number(params?.id);
  const { isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setIsLoading(true);
    fetch(`${RENDER_API}/api/products/${productId}`)
      .then(async res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
      })
      .catch(() => {
        setProduct(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId]);

  const handleWishlist = async () => {
    if (!isAuthenticated) { setLocation('/login'); return; }
    setAddingToWishlist(true);
    try {
      const res = await fetch(`${RENDER_API}/api/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
      if (!res.ok) throw new Error(await res.text());
      setIsWishlisted(true);
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
      setSizeError(true);
      toast({ title: "Select a size", description: "Please select a size before adding to cart.", variant: "destructive" });
      return;
    }
    setSizeError(false);
    setAddingToCart(true);
    try {
      const res = await fetch(`${RENDER_API}/api/home-visit-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: 1, size: selectedSize })
      });
      if (!res.ok) throw new Error(await res.text());
      setAddedToCart(true);
      toast({ title: "✅ Added to Cart", description: "This piece has been added to your cart." });
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add to your selection.", variant: "destructive" });
    } finally {
      setAddingToCart(false);
    }
  };

  if (isLoading) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!product) return <div className="min-h-[80vh] flex items-center justify-center text-muted-foreground">Product not found</div>;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.imageUrl || '/placeholder.jpg'];
  const sizes = Array.isArray(product.sizes) ? product.sizes : ['Free Size'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link href="/products" className="inline-flex items-center text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collection
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-card/50 rounded-lg overflow-hidden border border-white/5">
            {images[0] ? (
              <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.slice(1).map((img: string, i: number) => (
                <div key={i} className="aspect-square bg-card/50 rounded-md overflow-hidden border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
                  <img src={img} alt={`${product.name} view ${i+2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.brandName && <div className="text-sm text-primary tracking-widest uppercase mb-2">{product.brandName}</div>}
          <h1 className="text-4xl font-serif text-foreground mb-4 leading-tight">{product.name}</h1>
          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-3xl font-serif text-foreground font-semibold">{formatPrice(product.sellingPrice)}</span>
            {product.mrp && product.mrp > product.sellingPrice && (
              <span className="text-lg text-muted-foreground line-through font-light">{formatPrice(product.mrp)}</span>
            )}
            {product.mrp && product.mrp > product.sellingPrice && (
              <span className="px-2.5 py-1 bg-red-600/90 text-foreground text-xs font-bold rounded-md tracking-wider uppercase shadow">
                {Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}% OFF
              </span>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed mb-10 text-lg">
            {product.description || "A masterclass in modern tailoring, this piece embodies the sophisticated aesthetic of the house. Cut from premium fabric with impeccable attention to detail."}
          </p>

          <div className="grid grid-cols-2 gap-6 mb-10 border-y border-white/5 py-8">
            {product.color && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Color</div>
                <div className="text-foreground capitalize">{product.color}</div>
              </div>
            )}
            {product.fabric && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Fabric</div>
                <div className="text-foreground">{product.fabric}</div>
              </div>
            )}
            {product.occasion && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Occasion</div>
                <div className="text-foreground capitalize">{product.occasion}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1 mb-1">
                <Ruler className="w-3 h-3" /> Available Sizes
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s: string) => (
                  <button 
                    key={s} 
                    onClick={() => {
                      setSelectedSize(s);
                      setSizeError(false);
                    }}
                    className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                      selectedSize === s 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border bg-muted/50 text-foreground hover:border-white/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            {sizeError && (
              <div className="text-red-500 text-xs font-semibold uppercase tracking-wider mb-2 animate-pulse text-left">
                ⚠️ Please select a size first and try again!
              </div>
            )}
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
                  <><ShoppingBag className="w-5 h-5 mr-2" /> Add to Cart</>
                )}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 border-border text-foreground hover:bg-muted/50 hover:text-foreground"
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
