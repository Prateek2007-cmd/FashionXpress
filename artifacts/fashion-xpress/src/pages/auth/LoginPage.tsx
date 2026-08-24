import React from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertCircle, Eye, EyeOff, ShieldCheck, Clock, Lock,
  ArrowRight, Sparkles, CheckCircle2, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email address or mobile number'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const MEMBER_PERKS = [
  'Try curated designer outfits at home — free',
  'Personal Fashion Executive at your door',
  'Pay only for what you love, return the rest',
  'Early access to new arrivals & sales',
];

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: LoginFormValues) => {
    setErrorMsg(null);
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user);
        if (res.user.role === 'admin') setLocation('/admin');
        else if (res.user.role === 'executive') setLocation('/executive');
        else if (res.user.role === 'merchant') setLocation('/merchant');
        else setLocation('/');
      },
      onError: (err: any) => {
        const status = err?.status;
        const serverMsg = err?.data?.error || err?.data?.message || err?.message;
        if (status === 401 || status === 400) {
          setErrorMsg('Incorrect email/mobile number or password. Please check your credentials.');
        } else if (status === 404) {
          setErrorMsg('No account found with this email or mobile number. Please create an account first.');
        } else if (serverMsg) {
          setErrorMsg(serverMsg);
        } else {
          setErrorMsg('Something went wrong. Please try again later.');
        }
      }
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">

        {/* Brand badge centered */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 bg-card border border-border px-5 py-2.5 rounded-2xl shadow-xl">
            <img src="/logo.png" alt="TFX" className="w-9 h-9 object-contain rounded-lg" />
            <span className="font-brand font-bold text-sm uppercase tracking-[0.18em] text-foreground">
              The Fashion Xpress
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: Create Account Promo ── */}
          <div className="bg-gradient-to-br from-primary/10 via-card to-purple-500/5 border border-primary/20 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[11px] font-bold uppercase tracking-[0.2em] mb-5">
                  <Sparkles className="w-3.5 h-3.5" /> Free Membership
                </div>
                <h2 className="text-3xl font-serif font-black text-foreground leading-tight mb-3">
                  New to<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">
                    Fashion Xpress?
                  </span>
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Join thousands of members experiencing premium at-home fashion shopping. No cost to join.
                </p>
              </div>

              {/* Perks */}
              <ul className="space-y-3">
                {MEMBER_PERKS.map((perk, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground/80">{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Create Account CTA */}
            <div className="relative z-10 mt-8">
              <Link href="/register">
                <button className="group w-full flex items-center justify-between gap-3 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                  style={{ background: 'linear-gradient(135deg, hsl(45,90%,48%) 0%, hsl(36,100%,45%) 50%, hsl(45,90%,48%) 100%)' }}>
                  <span className="flex items-center gap-2 text-black">
                    <UserPlus className="w-5 h-5" />
                    Create Free Account
                  </span>
                  <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <p className="text-center text-[11px] text-muted-foreground mt-3">
                Free forever · No credit card required
              </p>
            </div>
          </div>

          {/* ── RIGHT: Sign In Form ── */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-2xl font-serif text-foreground font-black tracking-tight mb-1">
                Already a Member?
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to continue your experience.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Loading overlay hint */}
              {loginMutation.isPending && (
                <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary animate-pulse">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                  Verifying your credentials…
                </div>
              )}

              {/* Error banner */}
              {errorMsg && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <span>{errorMsg}</span>
                    {errorMsg.includes('create an account') && (
                      <Link href="/register" className="block mt-1.5 text-primary font-bold hover:underline">
                        → Create your account here
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Email / Mobile Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Email Address or Mobile Number
                </label>
                <Input
                  type="text"
                  placeholder="Enter email or 10-digit mobile number"
                  {...register('email')}
                  className={`h-12 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 ${errors.email ? 'border-destructive' : ''}`}
                  onChange={() => setErrorMsg(null)}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert("To reset your password, please contact:\nconcierge@fashionxpress.in\nor call 6304847223"); }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 font-bold tracking-[0.15em] uppercase text-xs rounded-xl shadow-lg shadow-primary/20 transition-all relative overflow-hidden"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing In…
                  </span>
                ) : "Sign In"}
              </Button>
            </form>

            {/* Security strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              {[
                { icon: ShieldCheck, label: "Encrypted" },
                { icon: Clock, label: "45-Min Visits" },
                { icon: Lock, label: "Zero Risk" }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 text-center">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
