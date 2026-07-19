import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const bookingSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  addressText: z.string().min(10, "Please provide your full address"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookVisitPage() {
  const { isAuthenticated, token, user } = useAuth();
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [step, setStep] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, trigger } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: '',
      phone: '',
      addressText: ''
    }
  });

  const handleStep1Next = async () => {
    const valid = await trigger(['name', 'phone']);
    if (valid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);

    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const products = guestCart.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size
    }));

    const payload = {
      name: data.name || user?.name || 'Guest Customer',
      phone: data.phone || user?.phone || '9999999999',
      addressText: data.addressText,
      email: user?.email || 'not-provided@fashion-xpress.com',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: 'As soon as possible',
      gender: 'not_specified',
      preferredFit: '',
      preferredBrands: [],
      preferredColors: [],
      topSize: '',
      bottomSize: '',
      notes: '',
      products
    };

    const API_BASE =
      import.meta.env.VITE_API_URL || "";

    // Use guest endpoint if not authenticated, otherwise use authenticated endpoint
    const endpoint = isAuthenticated ? `${API_BASE}/api/bookings` : `${API_BASE}/api/bookings/guest`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (isAuthenticated && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log('[BookVisitPage] Sending booking request...');
      console.log("API_BASE:", API_BASE);
      console.log("Request URL:", endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('[BookVisitPage] Response status:', response.status);
      console.log('[BookVisitPage] Response body:', responseText);

      if (!response.ok) {
        throw new Error(responseText || `Server error: ${response.status}`);
      }

      const result = JSON.parse(responseText);
      console.log('[BookVisitPage] Booking created:', result);
      setSuccessCode(result.bookingCode || result.id?.toString() || 'CONFIRMED');
      window.scrollTo(0, 0);
      toast({ title: "✅ Booking Confirmed!", description: `Your booking reference: ${result.bookingCode}` });

      // Clear guest cart on successful booking
      localStorage.removeItem('guest_cart');

    } catch (err: any) {
      console.error('[BookVisitPage] Booking error:', err);
      toast({ 
        title: "Booking failed", 
        description: err.message || 'Could not complete your booking. Please try again.', 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN - Show after booking is confirmed
  if (successCode) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-card p-10 rounded-2xl border border-white/5">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-2">🎉 Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-6">Your Fashion Executive will see you soon.</p>
          
          <div className="bg-black/50 border border-green-500/20 rounded-lg py-5 px-4 mb-8">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your Unique Order ID</p>
            <p className="text-2xl font-mono text-green-400 tracking-widest font-bold">{successCode}</p>
          </div>

          <div className="space-y-3">
            <a 
              href={`https://wa.me/916304847223?text=Hi, I just booked a Home Visit. Reference: ${successCode}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center h-12 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm transition-colors"
            >
              Continue on WhatsApp
            </a>
            
            <Button variant="outline" className="w-full" onClick={() => { setSuccessCode(null); setStep(2); }}>
              Book Another Visit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center min-h-[70vh] relative">
      {/* Premium glow element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 space-y-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs uppercase tracking-widest font-semibold animate-pulse mx-auto">
          ⚠️ Service Has Not Yet Started ⚠️
        </div>
        
        <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight text-white leading-none">
          HOME VISIT SERVICE IS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 font-bold">COMING SOON</span>
        </h1>
        
        <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto">
          Our Home Visit service has not yet launched. We are preparing to bring a luxury personal fashion consultation and custom fitting experience straight to your doorstep. Stay tuned!
        </p>

        <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <div className="px-6 py-4 bg-white/[0.02] border border-white/5 rounded-xl text-muted-foreground text-sm max-w-md shadow-2xl backdrop-blur-md">
            <span className="font-semibold text-white">Our Promise:</span> A professional Fashion Executive will visit your location within 45-60 minutes of your requested schedule to assist you.
          </div>
        </div>
      </div>
    </div>
  );
}
