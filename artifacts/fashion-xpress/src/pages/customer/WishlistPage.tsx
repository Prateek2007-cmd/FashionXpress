import React, { useState } from 'react';
import { useListWishlist } from '@workspace/api-client-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { Trash2, ShoppingBag, Loader2, Heart } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export function WishlistPage() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();
  const { data: wishlist, isLoading } = useListWishlist();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "";

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    try {
      console.log("API_BASE:", API_BASE);
      console.log("Request URL:", `${API_BASE}/api/wishlist/${productId}`);
      const res = await fetch(`${API_BASE}/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to remove');
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({ title: "Removed from wishlist" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = async (productId: number) => {
    toast({
      title: "Select a Size",
      description: "Please select a size on the product details page to add it to your cart.",
      variant: "destructive"
    });
    setLocation(`/products/${productId}`);
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-serif text-white mb-2">Saved Pieces</h1>
      <p className="text-muted-foreground mb-12">Your personal curation of luxury fashion.</p>

      {!wishlist || wishlist.length === 0 ? (
        <div className="text-center py-24 border border-white/5 rounded-2xl bg-card/30">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
          <Link href="/products">
            <Button variant="outline" className="tracking-widest uppercase text-xs">Explore Collection</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlist.map(item => (
            <div key={item.id} className="group border border-white/5 bg-card/50 rounded-lg overflow-hidden flex flex-col">
              <Link href={`/products/${item.product.id}`} className="block relative aspect-[3/4] overflow-hidden">
                {item.product.images[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
              </Link>
              <div className="p-4 flex-grow flex flex-col">
                <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{item.product.brandName}</div>
                <h3 className="text-white font-serif mb-1 truncate">{item.product.name}</h3>
                <div className="text-white/80 mb-4">{formatPrice(item.product.sellingPrice)}</div>
                
                <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                  <Button 
                    className="flex-1 text-xs tracking-widest uppercase h-9" 
                    onClick={() => handleMoveToCart(item.productId)}
                    disabled={movingId === item.productId}
                  >
                    {movingId === item.productId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><ShoppingBag className="w-4 h-4 mr-2" /> Add to Cart</>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9"
                    onClick={() => handleRemove(item.productId)}
                    disabled={removingId === item.productId}
                  >
                    {removingId === item.productId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
