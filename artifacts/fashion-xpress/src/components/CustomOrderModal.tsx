import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';

export function CustomOrderModal({ product, onClose }: { product: any, onClose: () => void }) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    color: product.color,
    size: product.sizes[0] || 'M',
    shippingAddress: '',
    specialRequirements: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const API_BASE =
      import.meta.env.VITE_API_URL ||
      "https://fashionxpress.onrender.com";

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity: 1, ...formData })
      });
      
      const order = await res.json();
      const message = `Hello Fashion Xpress,\n\nI would like to place a custom order.\n\nOrder Number: ${order.orderNumber || 'Pending'}\nProduct: ${product.name} (SKU: ${product.sku})\nColor: ${formData.color}\nSize: ${formData.size}\nTotal Amount: ₹${order.totalAmount || product.sellingPrice}\n\nShipping Address: ${formData.shippingAddress}\nSpecial Requirements: ${formData.specialRequirements}\n\nPlease let me know how to proceed with the payment.`;
      const waUrl = `https://wa.me/916304847223?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      onClose();
    } catch (err) {
      // Even if the API fails, still open WhatsApp with basic info
      const message = `Hello Fashion Xpress,\n\nI would like to place a custom order.\n\nProduct: ${product.name}\nColor: ${formData.color}\nSize: ${formData.size}\nPrice: ₹${product.sellingPrice}\n\nShipping Address: ${formData.shippingAddress}\nSpecial Requirements: ${formData.specialRequirements}`;
      const waUrl = `https://wa.me/916304847223?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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

            <Button type="submit" className="w-full h-12 mt-4" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Order on WhatsApp"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
