import React from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, Sparkles, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegisterCustomer } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

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
  const registerMutation = useRegisterCustomer();
  const [showPassword, setShowPassword] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user);
        toast({ title: "🎉 Welcome to The Fashion Xpress", description: "Your account has been created successfully." });
        setLocation('/');
      },
      onError: (err: any) => {
        toast({
          title: "Registration failed",
          description: err.response?.data?.message || err.data?.message || err.message || "An error occurred during registration.",
          variant: "destructive"
        });
      }
    });
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
            <img src="/logo.png" alt="TFX Logo" className="w-10 h-10 object-contain rounded-lg" />
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
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating Account…" : "Create Account"}
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
