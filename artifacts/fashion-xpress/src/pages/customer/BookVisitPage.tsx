import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  useCreateBooking, 
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';

const bookingSchema = z.object({
  name: z.string().min(2, "Required"),
  phone: z.string().regex(/^\d{10}$/, "Must be exactly 10 digits"),
  addressText: z.string().min(10, "Please provide full address"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookVisitPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  
  const createBooking = useCreateBooking();

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

  const onSubmit = (data: BookingFormValues) => {
    if (!isAuthenticated) {
      toast({ title: "Please log in first", description: "You need to be logged in to book a visit.", variant: "destructive" });
      return;
    }

    const payload = {
      ...data,
      email: 'not-provided@fashion-xpress.com',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: 'As soon as possible',
      gender: 'not_specified',
      preferredFit: '',
      preferredBrands: [],
      preferredColors: [],
      topSize: '',
      bottomSize: '',
      notes: ''
    };

    console.log('[BookVisitPage] Submitting booking payload:', JSON.stringify(payload));

    createBooking.mutate({ data: payload }, {
      onSuccess: (res) => {
        console.log('[BookVisitPage] Booking SUCCESS:', res);
        setSuccessCode(res.bookingCode);
        window.scrollTo(0,0);
      },
      onError: (err: any) => {
        console.error('[BookVisitPage] Booking FAILED:', err);
        const msg = err?.message || 'Could not complete your booking request.';
        toast({ title: "Booking failed", description: msg, variant: "destructive" });
      }
    });
  };

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  
  // Show login prompt instead of redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-card p-10 rounded-2xl border border-white/5">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-8">Please log in to your account to book a home visit.</p>
          <Link href="/login">
            <Button size="lg" className="w-full h-14 tracking-widest uppercase">
              Sign In to Continue
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            Don't have an account? <Link href="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    );
  }

  if (successCode) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-card p-10 rounded-2xl border border-white/5">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-2">Booking Confirmed</h2>
          <p className="text-muted-foreground mb-6">Your Fashion Executive will see you soon.</p>
          
          <div className="bg-black/50 border border-white/10 rounded-lg py-4 mb-8">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Booking Reference</p>
            <p className="text-2xl font-mono text-primary tracking-widest">{successCode}</p>
          </div>

          <a 
            href={`https://wa.me/1234567890?text=Hi, I just booked a Home Visit. Reference: ${successCode}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center h-12 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm transition-colors mb-4"
          >
            Continue on WhatsApp
          </a>
          
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/account'}>
            View in My Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-white mb-2">Schedule Your Visit</h1>
        <p className="text-muted-foreground mb-6">Select a time for your personal fashion consultation.</p>
        <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm">
          <span className="font-semibold">Our Promise:</span> Services delivered within 3-6 hours of your scheduled time.
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className={step === 2 ? 'hidden' : ''}>
            <h3 className="font-serif text-xl text-white border-b border-white/10 pb-4 mb-6">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-white/80">Full Name</label>
                <Input {...register('name')} className={errors.name ? 'border-destructive' : ''} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/80">Phone Number</label>
                <Input {...register('phone')} maxLength={10} className={errors.phone ? 'border-destructive' : ''} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="pt-8 mt-8 border-t border-white/10 flex justify-end">
              <Button 
                type="button" 
                onClick={handleStep1Next} 
                size="lg" 
                className="px-10 h-14 tracking-widest uppercase"
              >
                Book the service
              </Button>
            </div>
          </div>

          <div className={step === 1 ? 'hidden' : 'space-y-8'}>
            <div>
              <h3 className="font-serif text-xl text-white border-b border-white/10 pb-4 mb-6">Where should we come?</h3>
              <div className="space-y-2">
                <label className="text-sm text-white/80">Full Address</label>
                <Input {...register('addressText')} placeholder="House/Flat No, Street, Landmark, City, Pincode" className={errors.addressText ? 'border-destructive' : ''} />
                {errors.addressText && <p className="text-xs text-destructive">{errors.addressText.message}</p>}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg" className="px-10 h-14 tracking-widest uppercase">
                Back
              </Button>
              <Button type="submit" size="lg" className="px-10 h-14 tracking-widest uppercase" disabled={createBooking.isPending}>
                {createBooking.isPending ? "Confirming..." : "Confirm Booking"}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
