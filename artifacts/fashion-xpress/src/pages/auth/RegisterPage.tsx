import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, Sparkles, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const RENDER_API = 'https://fashionxpress.onrender.com';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existingUserEmail, setExistingUserEmail] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsRegistering(true);
    setErrorMsg(null);
    setExistingUserEmail(null);

    try {
      const res = await fetch(`${RENDER_API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();

      if (!res.ok) {
        const errorText = json?.error || json?.message || 'Registration failed';
        const isAlreadyMember = errorText.toLowerCase().includes('already exists') || res.status === 400 || res.status === 409;
        
        if (isAlreadyMember) {
          setErrorMsg("An account with this email address or mobile number already exists.");
          setExistingUserEmail(data.email);
          toast({
            title: "Account Already Exists",
            description: "You are already registered! Please sign in with your password.",
          });
        } else {
          setErrorMsg(errorText);
          toast({
            title: "Registration failed",
            description: errorText,
            variant: "destructive"
          });
        }
        return;
      }

      login(json.token, json.user);
      toast({ title: "🎉 Welcome to The Fashion Xpress", description: "Your account has been created successfully." });
      setLocation('/');
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during registration.");
      toast({
        title: "Registration failed",
        description: err.message || "An error occurred during registration.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 bg-card border border-border p-2 px-4 rounded-2xl shadow-xl">
            <img src="/logo.jpg" alt="TFX Logo" className="w-10 h-10 object-contain rounded-lg" />
            <span className="font-brand font-bold text-base uppercase tracking-[0.18em] text-foreground">
              The Fashion Xpress
            </span>
          </div>
          <h1 className="text-3xl font-serif text-foreground font-black tracking-tight pt-2">Join the Elite</h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Create your account to experience personal at-home fashion concierge shopping.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-6">

          {/* Perks pill */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-foreground block">Free Membership Benefits</span>
              <span className="text-muted-foreground">Try curated designer collections at home before paying.</span>
            </div>
          </div>

          {/* Existing User Alert Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-bold text-amber-200 text-sm">Already a Member?</p>
                  <p className="text-amber-300/90 mt-0.5 leading-relaxed">{errorMsg}</p>
                </div>
              </div>

              {existingUserEmail && (
                <div className="pt-2 border-t border-amber-500/20">
                  <Link href="/login">
                    <Button 
                      type="button"
                      size="sm"
                      className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider text-xs gap-2 rounded-xl shadow-lg shadow-amber-900/20"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Sign In to Your Account Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Full Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Rahul Sharma"
                {...register('name')}
                className={`h-12 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 ${errors.name ? 'border-destructive' : ''}`}
                onChange={() => setErrorMsg(null)}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className={`h-12 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 ${errors.email ? 'border-destructive' : ''}`}
                onChange={() => setErrorMsg(null)}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
              </label>
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                {...register('phone')}
                inputMode="numeric"
                maxLength={10}
                onKeyDown={(e) => {
                  const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                  if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key)) e.preventDefault();
                }}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  e.target.value = digits;
                  register('phone').onChange(e);
                  setErrorMsg(null);
                }}
                className={`h-12 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 ${errors.phone ? 'border-destructive' : ''}`}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" /> Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password (min 6 chars)"
                  {...register('password')}
                  className={`h-12 pr-10 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 ${errors.password ? 'border-destructive' : ''}`}
                  onChange={() => setErrorMsg(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-13 font-bold tracking-[0.15em] uppercase text-xs rounded-xl shadow-xl shadow-primary/20 transition-all mt-2"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account…
                </span>
              ) : "Create Account"}
            </Button>

            {/* Sign In link */}
            <div className="text-center pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-bold">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Your data is protected under 256-bit encryption</span>
        </div>

      </div>
    </div>
  );
}
