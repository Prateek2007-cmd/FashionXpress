import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Store, ShoppingBag } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

export function PartnerWithUsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    productsSold: ''
  });

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://fashionxpress.onrender.com";

  const { data: content } = useQuery({
    queryKey: ['/api/content/partner_page'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/content/partner_page`);
      if (!res.ok) return null;
      return res.json();
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`${API_BASE}/api/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to submit');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Partnership Request Sent!",
        description: "Thank you for your interest. Our team will contact you shortly.",
      });
      setFormData({ shopName: '', productsSold: '' });
    },
    onError: () => {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left side: Image and Text */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div>
            <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium tracking-wide mb-6">
              Grow Your Business
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
              {content?.title || (
                <>Partner With <br /><span className="text-primary">The Fashion Xpress</span></>
              )}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {content?.description || "Join our exclusive network of premium boutiques and fashion retailers. Reach more customers through our concierge home-visit service and expand your brand's presence."}
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10 group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <img 
              src={content?.imageUrl || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop"} 
              alt="Premium Shopping Experience" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center border border-primary/30">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div className="text-white">
                <div className="font-semibold">Premium Retail</div>
                <div className="text-sm text-white/70">Elevate your reach</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-card/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="mb-8 text-center">
              <Store className="w-10 h-10 text-primary mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl font-serif text-white mb-2">Shop Details</h2>
              <p className="text-muted-foreground">Tell us about your boutique to get started.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 uppercase tracking-widest text-xs">
                  Name of Shop
                </label>
                <Input 
                  required
                  placeholder="e.g. Elegance Boutique"
                  className="bg-black/40 border-white/10 focus:border-primary/50 text-white h-12"
                  value={formData.shopName}
                  onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 uppercase tracking-widest text-xs">
                  What Do You Sell?
                </label>
                <Textarea 
                  required
                  placeholder="e.g. Premium women's dresses, designer ethnic wear, and luxury accessories..."
                  className="bg-black/40 border-white/10 focus:border-primary/50 text-white min-h-[120px] resize-none"
                  value={formData.productsSold}
                  onChange={(e) => setFormData({...formData, productsSold: e.target.value})}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 tracking-widest uppercase text-sm mt-4"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
