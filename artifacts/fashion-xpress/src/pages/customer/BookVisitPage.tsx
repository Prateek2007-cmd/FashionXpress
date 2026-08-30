import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'wouter';
import {
  Loader2, CheckCircle2, MapPin, Phone, User, Sparkles,
  Clock, Star, Shield, ArrowRight, Home, ShoppingBag,
  Zap, Award, ChevronRight, MessageCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePincode } from '@/context/PincodeContext';
import { useLocation } from 'wouter';

const RENDER_API = 'https://fashionxpress.onrender.com';

const FEATURES = [
  {
    icon: Clock,
    title: "45-Min Arrival",
    desc: "Our Fashion Executive arrives at your door within 45–60 minutes of booking.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: ShoppingBag,
    title: "Try Before You Pay",
    desc: "Browse and try on curated pieces at home. Pay only for what you love.",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    icon: Star,
    title: "Expert Styling",
    desc: "Personal fashion consultation from our trained style executives.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Shield,
    title: "Zero Risk",
    desc: "No booking fee. No upfront payment. Cancel anytime without hassle.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

const STEPS_INFO = [
  { n: "01", title: "Book Visit", desc: "Fill your name, phone & address below" },
  { n: "02", title: "Executive Arrives", desc: "Our stylist reaches you with a curated collection" },
  { n: "03", title: "Try & Choose", desc: "Browse, try, mix & match at your comfort" },
  { n: "04", title: "Pay for Keeps", desc: "Only pay for pieces you decide to keep" },
];

export function BookVisitPage() {
  const { isAuthenticated, token, user } = useAuth();
  const { selectedPincode, selectedPincodeInfo, availablePincodes, setPincode: setGlobalPincode } = usePincode();
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  // Form state — plain React state, no react-hook-form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pincode, setPincode] = useState((user as any)?.pincode || selectedPincode || '');
  const [addressText, setAddressText] = useState((user as any)?.address || '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; pincode?: string; addressText?: string }>({});

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
      if ((user as any)?.pincode) setPincode((user as any).pincode);
      if ((user as any)?.address) setAddressText((user as any).address);
    } else if (selectedPincode) {
      setPincode(prev => prev || selectedPincode);
    }
  }, [user, selectedPincode]);

  const activeMatchedPincode = availablePincodes.find(
    (p) => p.pincode === pincode.trim() && p.isActive !== false
  );
  const isPincodeEntered = pincode.trim().length === 6;
  const isServiceable = Boolean(activeMatchedPincode);

  useEffect(() => {
    let timer: NodeJS.Timeout | number | undefined;
    if (successCode) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { if (timer) clearInterval(timer); setLocation('/products'); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer as number); };
  }, [successCode, setLocation]);

  const validateStep1 = (): boolean => {
    const errs: { name?: string; phone?: string } = {};
    if (!name || name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) errs.phone = 'Phone number must be exactly 10 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Next = () => {
    if (validateStep1()) setStep(2);
  };

  const handleConfirmBooking = async () => {
    const errs: { pincode?: string; addressText?: string } = {};

    if (!pincode || pincode.trim().length !== 6) {
      errs.pincode = 'Please enter a valid 6-digit delivery pincode';
    } else if (!isServiceable) {
      errs.pincode = `Pincode ${pincode} is not currently serviceable. Coming soon!`;
      toast({
        title: `Coming Soon to ${pincode}!`,
        description: "We do not service this location yet. Please select a serviceable area.",
        variant: "destructive",
      });
      setErrors(errs);
      return;
    }

    if (!addressText || addressText.trim().length < 3) {
      errs.addressText = 'Please enter your complete address (House/Street/Area)';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    setIsSubmitting(true);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const guestCart = (() => {
      try { return JSON.parse(localStorage.getItem('guest_cart') || '[]'); }
      catch { return []; }
    })();
    const products = guestCart
      .map((item: any) => ({
        productId: Number(item.productId || item.id),
        quantity: Number(item.quantity || 1),
        size: item.size || ''
      }))
      .filter((item: any) => !isNaN(item.productId) && item.productId > 0);

    const fullAddress = `${addressText.trim()}, Pincode: ${pincode.trim()}${activeMatchedPincode ? ` (${activeMatchedPincode.area}, ${activeMatchedPincode.city})` : ''}`;

    const payload = {
      name: name.trim() || user?.name || 'Guest Customer',
      phone: cleanPhone || user?.phone || '9999999999',
      addressText: fullAddress,
      email: user?.email || 'not-provided@fashion-xpress.com',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: 'As soon as possible',
      gender: 'not_specified',
      preferredFit: '',
      preferredBrands: [],
      preferredColors: [],
      topSize: '', bottomSize: '', notes: '',
      products
    };

    // Always use the Render backend — never relative /api paths on Vercel
    let endpoint = isAuthenticated && token
      ? `${RENDER_API}/api/bookings`
      : `${RENDER_API}/api/bookings/guest`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isAuthenticated && token) headers['Authorization'] = `Bearer ${token}`;

    try {
      let res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      // If auth token expired, fallback to guest
      if (res.status === 401 && isAuthenticated) {
        endpoint = `${RENDER_API}/api/bookings/guest`;
        delete headers['Authorization'];
        res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const text = await res.text();
      if (!res.ok) {
        let errMsg = `Server error (${res.status})`;
        try {
          const parsed = JSON.parse(text);
          errMsg = parsed.error || parsed.message || errMsg;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      const result = JSON.parse(text);
      const code = result.bookingCode || result.id?.toString() || 'CONFIRMED';
      setSuccessCode(code);
      window.scrollTo(0, 0);
      toast({ title: '✅ Booking Confirmed!', description: `Reference: ${code}` });
      localStorage.removeItem('guest_cart');
    } catch (err: any) {
      toast({
        title: 'Booking failed',
        description: err.message || 'Could not complete booking. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── SUCCESS SCREEN ───────────────────────────────────────────────────────────
  if (successCode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-lg w-full text-center relative z-10">
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>

          <h2 className="text-4xl font-serif text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-8 text-lg">Your personal Fashion Executive is on the way. Get ready for a premium at-home styling experience.</p>

          <div className="bg-card/60 backdrop-blur-xl border border-green-500/20 rounded-2xl py-6 px-6 mb-6">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] font-bold mb-3">Booking Reference ID</p>
            <p className="text-3xl font-mono text-green-400 tracking-[0.2em] font-bold">{successCode}</p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-primary font-semibold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              Redirecting to Collection in {countdown}s…
            </div>
          </div>

          <div className="bg-card/30 border border-border rounded-2xl p-5 mb-6 text-left space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3">What happens next</p>
            {[
              { icon: Clock, text: "Executive arrives within 45–60 minutes", color: "text-amber-400" },
              { icon: ShoppingBag, text: "They bring curated pieces based on your preferences", color: "text-primary" },
              { icon: Star, text: "Try on at home, keep only what you love", color: "text-purple-400" },
            ].map(({ icon: Icon, text, color }, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-foreground/80">{text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <a
              href={`https://wa.me/916304847223?text=Hi%2C+I+just+booked+a+Home+Visit+with+The+Fashion+Xpress.+Reference+ID%3A+${successCode}`}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 h-12 bg-green-600 hover:bg-green-700 text-foreground rounded-xl font-semibold text-sm transition-all shadow-lg"
            >
              <MessageCircle className="w-4 h-4" /> Confirm via WhatsApp
            </a>
            <Button
              className="w-full h-12 font-semibold text-sm"
              onClick={() => { setSuccessCode(null); setStep(1); setLocation('/products'); }}
            >
              <ShoppingBag className="w-4 h-4 mr-2" /> Pick Products to Try
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN PAGE ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-card/80 to-transparent border-b border-border py-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left - Hero Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-[0.2em] font-bold">
                <Zap className="w-3.5 h-3.5" />
                Now Active in Select Pincodes
              </div>

              <div>
                <h1 className="text-5xl md:text-6xl font-serif font-black text-foreground leading-[1.05] mb-5">
                  Fashion Delivered
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
                    To Your Door.
                  </span>
                </h1>
                <p className="text-lg text-foreground/70 leading-relaxed max-w-lg">
                  Skip the malls. A personal Fashion Executive visits your home with a curated collection — you try, you choose, you pay only for what you love.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Clock, label: "45-Min Arrival" },
                  { icon: Shield, label: "Zero Risk" },
                  { icon: Star, label: "Curated Styles" },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-foreground/[0.03] border border-border rounded-xl text-xs text-foreground/80 font-semibold uppercase tracking-wider">
                    <Icon className="w-3.5 h-3.5 text-primary" /> {label}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {['A', 'B', 'C', 'D'].map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-purple-500/40 border-2 border-background flex items-center justify-center text-[10px] font-bold text-foreground">{l}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}</div>
                  <p className="text-xs text-muted-foreground"><span className="text-foreground font-semibold">2,400+</span> happy customers this month</p>
                </div>
              </div>
            </div>

            {/* Right — Booking Form Card */}
            <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />

              {/* Step pills */}
              <div className="flex items-center gap-3 mb-8">
                {[{ n: 1, label: "Your Details" }, { n: 2, label: "Your Address" }].map(({ n, label }) => (
                  <React.Fragment key={n}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${step === n ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-foreground/5 text-muted-foreground'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === n ? 'bg-white/20 text-primary-foreground' : 'bg-white/10 text-muted-foreground'}`}>{n}</span>
                      {label}
                    </div>
                    {n < 2 && <div className="flex-1 h-px bg-white/10" />}
                  </React.Fragment>
                ))}
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif text-foreground mb-1">Who are we visiting?</h3>
                    <p className="text-xs text-muted-foreground">We'll use these details to coordinate your visit.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> Full Name
                      </label>
                      <Input
                        id="booking-name"
                        value={name}
                        onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                        placeholder="Enter your full name"
                        className={`h-12 bg-foreground/5 border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 rounded-xl ${errors.name ? 'border-destructive' : ''}`}
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                      </label>
                      <Input
                        id="booking-phone"
                        value={phone}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(digits);
                          setErrors(prev => ({ ...prev, phone: undefined }));
                        }}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        inputMode="numeric"
                        className={`h-12 bg-foreground/5 border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 rounded-xl ${errors.phone ? 'border-destructive' : ''}`}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleStep1Next}
                    size="lg"
                    className="w-full h-14 text-sm tracking-[0.15em] uppercase font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                  >
                    Continue to Address
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <p className="text-[10px] text-muted-foreground/60 text-center tracking-wide">
                    By booking, you agree to our free-visit terms. No charge until you buy.
                  </p>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif text-foreground mb-1">Where should we come?</h3>
                    <p className="text-xs text-muted-foreground">Verify your delivery pincode and share your address for navigation.</p>
                  </div>

                  {/* Delivery Pincode Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> Delivery Pincode *
                      </label>
                      {((user as any)?.pincode || selectedPincode) && (
                        <span className="text-[11px] text-primary/90 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-primary" /> Saved location
                        </span>
                      )}
                    </div>
                    <Input
                      id="booking-pincode"
                      value={pincode}
                      maxLength={6}
                      inputMode="numeric"
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setPincode(val);
                        setErrors(prev => ({ ...prev, pincode: undefined }));
                        if (val.length === 6) {
                          setGlobalPincode(val);
                        }
                      }}
                      placeholder="Enter 6-digit delivery pincode (e.g. 504001)"
                      className={`h-12 bg-foreground/5 border-border font-mono tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 rounded-xl ${errors.pincode ? 'border-destructive' : ''}`}
                    />
                    {errors.pincode && <p className="text-xs text-destructive">{errors.pincode}</p>}
                  </div>

                  {/* Serviceability Live Status Banner */}
                  {isPincodeEntered && !isServiceable && (
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-200 text-sm">Coming Soon to {pincode}!</p>
                          <p className="text-xs text-amber-300/90 mt-0.5 leading-relaxed">
                            We currently do not service this pincode yet. Our Fashion Executive home visit concierge is expanding rapidly to your area.
                          </p>
                        </div>
                      </div>

                      {availablePincodes.length > 0 && (
                        <div className="pt-2.5 border-t border-amber-500/20">
                          <p className="text-[11px] text-amber-200/90 font-bold mb-1.5 uppercase tracking-wider">
                            Choose from currently serviceable areas:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {availablePincodes.slice(0, 5).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setPincode(p.pincode);
                                  setGlobalPincode(p.pincode);
                                  setErrors(prev => ({ ...prev, pincode: undefined }));
                                }}
                                className="text-xs bg-amber-500/20 hover:bg-amber-500/35 text-amber-100 font-semibold px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all flex items-center gap-1"
                              >
                                <span className="font-mono">{p.pincode}</span>
                                <span className="opacity-70">({p.area})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isPincodeEntered && isServiceable && (
                    <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-200 text-sm block">
                          ✓ Delivery Service Available in {activeMatchedPincode?.area}, {activeMatchedPincode?.city}!
                        </span>
                        <span className="text-emerald-300/80 leading-relaxed block mt-0.5">
                          A dedicated Fashion Executive will arrive with your curated fashion choices in 45–60 mins.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Full Address Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-primary" /> House / Street / Flat / Landmark *
                      </label>
                      {(user as any)?.address && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Auto-filled from profile
                        </span>
                      )}
                    </div>
                    <Input
                      id="booking-address"
                      value={addressText}
                      onChange={e => { setAddressText(e.target.value); setErrors(prev => ({ ...prev, addressText: undefined })); }}
                      placeholder="e.g. Flat 401, Sapphire Heights, Near Clock Tower"
                      className={`h-12 bg-foreground/5 border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 rounded-xl ${errors.addressText ? 'border-destructive' : ''}`}
                    />
                    {errors.addressText && <p className="text-xs text-destructive">{errors.addressText}</p>}
                  </div>

                  <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground/70 leading-relaxed">
                      <span className="text-foreground font-semibold">Our Promise:</span> A Fashion Executive will reach your location within <span className="text-primary font-bold">45–60 minutes</span> of booking confirmation.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-14 rounded-xl border-border text-xs uppercase tracking-widest font-bold"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting || (isPincodeEntered && !isServiceable)}
                      onClick={handleConfirmBooking}
                      className={`flex-[2] h-14 text-sm tracking-[0.15em] uppercase font-bold rounded-xl shadow-lg transition-all ${
                        isPincodeEntered && !isServiceable
                          ? 'bg-amber-600/50 cursor-not-allowed opacity-60 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/30'
                      }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</span>
                      ) : isPincodeEntered && !isServiceable ? (
                        <span>Coming Soon to {pincode}</span>
                      ) : (
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Confirm Booking</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── FEATURE HIGHLIGHTS ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs uppercase tracking-[0.25em] font-bold mb-3">Why Home Visit?</p>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">Shopping, Reimagined</h2>
            <div className="w-12 h-px bg-primary mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <div key={i} className="bg-card/30 border border-border rounded-2xl p-6 hover:border-border hover:-translate-y-1 transition-all duration-300 shadow-xl group">
                <div className={`w-12 h-12 rounded-2xl ${bg} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-foreground font-serif text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 bg-card/20 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs uppercase tracking-[0.25em] font-bold mb-3">The Process</p>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">How It Works</h2>
            <div className="w-12 h-px bg-primary mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS_INFO.map(({ n, title, desc }, i) => (
              <div key={i} className="relative flex flex-col items-center md:items-start text-center md:text-left">
                {i < STEPS_INFO.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-12px)] w-full h-px border-t border-dashed border-border z-0" />
                )}
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-5 shadow-xl">
                  <span className="text-2xl font-serif font-black text-primary">{n}</span>
                </div>
                <h4 className="text-foreground font-semibold text-base mb-1">{title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MERCHANT PARTNER CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-purple-500/5 border border-primary/20 rounded-3xl p-10 md:p-16 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-[0.2em] font-bold mb-6">
                  <Award className="w-3.5 h-3.5" />
                  For Fashion Brands & Merchants
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
                  List Your Brand on <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">The Fashion Xpress</span>
                </h2>
                <p className="text-foreground/70 text-base leading-relaxed mb-6">
                  Partner with us to reach thousands of premium customers through our unique home-visit model. Your products, delivered by our executives, tried on at the customer's doorstep.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Home, text: "Zero Inventory Risk" },
                    { icon: Zap, text: "Direct Revenue Share" },
                    { icon: Star, text: "Premium Brand Placement" },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-foreground/[0.04] border border-border rounded-xl text-xs text-foreground/80 font-semibold">
                      <Icon className="w-3.5 h-3.5 text-primary" /> {text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <Link href="/partner">
                  <Button size="lg" className="w-full md:w-56 h-14 text-sm tracking-widest uppercase font-bold rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                    Partner With Us
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">Brands review in 2–3 business days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
