import React, { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { Trash2, Loader2, ArrowRight, ShoppingBag, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useListHomeVisitCart } from '@workspace/api-client-react';

export function CartPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();
  const { data: cartItems, isLoading } = useListHomeVisitCart();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const API_BASE =
    import.meta.env.VITE_API_URL || "";

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    try {
      console.log("API_BASE:", API_BASE);
      console.log("Request URL:", `${API_BASE}/api/home-visit-cart/${productId}`);
      const res = await fetch(`${API_BASE}/api/home-visit-cart/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to remove');
      queryClient.invalidateQueries({ queryKey: ['/api/home-visit-cart'] });
      toast({ title: "Removed from selection" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const totalEstimate = cartItems?.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0) || 0;

  const handleReservePickup = async () => {
    setIsPlacingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: "Store Pickup Reservation",
          specialRequirements: "Pickup selected items in-store"
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Error ${res.status}`);
      }

      const orderData = await res.json();
      setConfirmedOrder(orderData);
      
      // Invalidate queries to refresh cart
      queryClient.invalidateQueries({ queryKey: ['/api/home-visit-cart'] });
    } catch (err: any) {
      toast({
        title: "Reservation Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-serif text-white mb-2">Store Pick-up Selection</h1>
      <p className="text-muted-foreground mb-12">Review the items you've selected for in-store pickup.</p>

      {!cartItems || cartItems.length === 0 ? (
        <div className="text-center py-24 border border-white/5 rounded-2xl bg-card/30">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Your selection is empty.</p>
          <Link href="/products">
            <Button variant="outline" className="tracking-widest uppercase text-xs">Explore Collection</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex gap-6 p-4 rounded-xl border border-white/5 bg-card/30">
                <div className="w-24 h-32 rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                  {item.product.images[0] && (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 flex flex-col py-1">
                  <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{item.product.brandName}</div>
                  <Link href={`/products/${item.product.id}`} className="text-lg font-serif text-white hover:text-primary transition-colors">
                    {item.product.name}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1">
                    Size: {(item as any).size || item.product.sizes?.join(', ') || 'M'}
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="text-white/90">{formatPrice(item.product.sellingPrice)}</div>
                    <button 
                      onClick={() => handleRemove(item.productId)}
                      disabled={removingId === item.productId}
                      className="text-muted-foreground hover:text-destructive transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      {removingId === item.productId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Remove</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-96">
            <div className="bg-card border border-white/5 rounded-2xl p-8 sticky top-24">
              <h3 className="font-serif text-xl text-white mb-6">Pick-up Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items selected</span>
                  <span className="text-white font-medium">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Value</span>
                  <span className="text-white font-medium">{formatPrice(totalEstimate)}</span>
                </div>
                <div className="flex justify-between text-sm pt-4 border-t border-white/5">
                  <span className="text-muted-foreground">Upfront Payment</span>
                  <span className="text-primary font-medium">{formatPrice(0)}</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
                <p className="text-xs text-primary/80 leading-relaxed text-center">
                  Review the items you've selected for in-store pickup. No upfront payment required. Only pay at the store when you try on and collect.
                </p>
              </div>

              <Button 
                className="w-full h-14 text-sm tracking-widest uppercase"
                onClick={handleReservePickup}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Reserving...</>
                ) : (
                  <><span className="mr-1">Reserve Pickup</span><ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="font-serif text-2xl text-white mb-3">Reservation Confirmed!</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Your order has been confirmed successfully! You can collect your items from the **Merchant Store**.
            </p>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Order ID / Code</span>
              <span className="font-mono text-xl font-bold text-white tracking-wider">{confirmedOrder.orderNumber}</span>
            </div>
            
            <Button 
              className="w-full h-12 text-sm tracking-widest uppercase"
              onClick={() => {
                setConfirmedOrder(null);
                setLocation('/account');
              }}
            >
              Go to My Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
