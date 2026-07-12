import React from 'react';
import { useListWishlist, useRemoveFromWishlist, useAddToHomeVisitCart } from '@workspace/api-client-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

export function WishlistPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: wishlist, isLoading } = useListWishlist();
  const remove = useRemoveFromWishlist();
  const addToCart = useAddToHomeVisitCart();

  const handleRemove = (id: number) => {
    remove.mutate({ data: { productId: id } } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
        toast({ title: "Removed from wishlist" });
      }
    });
  };

  const handleMoveToCart = (productId: number, wishlistItemId: number) => {
    addToCart.mutate({ data: { productId, quantity: 1 } }, {
      onSuccess: () => {
        handleRemove(wishlistItemId);
        toast({ title: "Added to Home Visit", description: "Item moved to your visit selection." });
      }
    });
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-serif text-white mb-2">Saved Pieces</h1>
      <p className="text-muted-foreground mb-12">Your personal curation of luxury fashion.</p>

      {wishlist?.length === 0 ? (
        <div className="text-center py-24 border border-white/5 rounded-2xl bg-card/30">
          <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
          <Link href="/products">
            <Button variant="outline" className="tracking-widest uppercase text-xs">Explore Collection</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlist?.map(item => (
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
                    onClick={() => handleMoveToCart(item.product.id, item.id)}
                    disabled={addToCart.isPending}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" /> Add to Visit
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9"
                    onClick={() => handleRemove(item.id)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
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
