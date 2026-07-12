import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';
import { Loader2, X } from 'lucide-react';
import { Button } from './ui/button';

export function CustomOrderModal({ product, onClose }: { product: any, onClose: () => void }) {
  const [formData, setFormData] = useState({
    color: product.color,
    size: product.sizes[0] || 'M',
    shippingAddress: '',
    specialRequirements: ''
  });

  const createOrder = useMutation({
    mutationFn: (data: any) => customFetch({ url: '/api/orders', method: 'POST', data }),
    onSuccess: (order: any) => {
      // Redirect to WhatsApp with order details
      const message = `Hello Fashion Xpress,\n\nI would like to place a custom order.\n\nOrder Number: ${order.orderNumber}\nProduct: ${product.name} (SKU: ${product.sku})\nColor: ${formData.color}\nSize: ${formData.size}\nTotal Amount: ₹${order.totalAmount}\n\nShipping Address: ${formData.shippingAddress}\nSpecial Requirements: ${formData.specialRequirements}\n\nPlease let me know how to proceed with the payment.`;
      const waUrl = `https://wa.me/919999999999?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder.mutate({
      productId: product.id,
      quantity: 1,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/10 z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="p-8">
          <h2 className="font-serif text-2xl text-white mb-2">Direct Custom Order</h2>
          <p className="text-muted-foreground text-sm mb-6">Place an order for {product.name}. You'll be redirected to WhatsApp for payment and confirmation.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Color</label>
              <input 
                required 
                type="text" 
                className="w-full bg-background border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.color}
                onChange={e => setFormData({...formData, color: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Size</label>
              <select 
                required 
                className="w-full bg-background border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.size}
                onChange={e => setFormData({...formData, size: e.target.value})}
              >
                {product.sizes.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Shipping Address</label>
              <textarea 
                required
                rows={3}
                className="w-full bg-background border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.shippingAddress}
                onChange={e => setFormData({...formData, shippingAddress: e.target.value})}
                placeholder="Full delivery address"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Special Requirements (Optional)</label>
              <textarea 
                rows={2}
                className="w-full bg-background border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.specialRequirements}
                onChange={e => setFormData({...formData, specialRequirements: e.target.value})}
                placeholder="Custom measurements or specific requests"
              />
            </div>

            <Button type="submit" className="w-full h-12 mt-4" disabled={createOrder.isPending}>
              {createOrder.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Order on WhatsApp"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
