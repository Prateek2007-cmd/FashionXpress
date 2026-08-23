import React from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Eye, EyeOff, ShieldCheck, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: LoginFormValues) => {
    setErrorMsg(null);
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user);

        // Route based on role
        if (res.user.role === 'admin') setLocation('/admin');
        else if (res.user.role === 'executive') setLocation('/executive');
        else if (res.user.role === 'merchant') setLocation('/merchant');
        else setLocation('/');
      },
      onError: (err: any) => {
        const status = err?.status;
        const serverMsg =
          err?.data?.error ||
          err?.data?.message ||
          err?.message;

        if (status === 401 || status === 400) {
          setErrorMsg('Incorrect email or password. Please check your credentials.');
        } else if (status === 404) {
          setErrorMsg('No account found with this email address. Please register first.');
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

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 bg-card border border-border p-2 px-4 rounded-2xl shadow-xl">
            <img src="/logo.png" alt="TFX Logo" className="w-10 h-10 object-contain rounded-lg" />
            <span className="font-brand font-bold text-base uppercase tracking-[0.18em] text-foreground">
              The Fashion Xpress
            </span>
          </div>
          <h1 className="text-3xl font-serif text-foreground font-black tracking-tight pt-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Sign in to access your bookings, custom orders, wishlist, and exclusive member privileges.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-6">

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Inline error banner */}
            {errorMsg && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                Email Address
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Please contact concierge@fashionxpress.in or 6304847223 to reset your password."); }} className="text-xs text-primary hover:underline font-medium">
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary bg-background text-primary focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground font-medium">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-13 font-bold tracking-[0.15em] uppercase text-xs rounded-xl shadow-xl shadow-primary/20 transition-all mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing In…" : "Sign In to Account"}
            </Button>

            {/* Register Link */}
            <div className="text-center pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Don't have an account yet?{' '}
                <Link href="/register" className="text-primary hover:underline font-bold">
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security & Guarantee Strip */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: ShieldCheck, label: "256-Bit Encrypted", sub: "Secure Login" },
            { icon: Clock, label: "45-Min Arrival", sub: "Home Visits" },
            { icon: Lock, label: "Zero Risk", sub: "Try Before Pay" }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-card/60 border border-border rounded-2xl p-3 flex flex-col items-center">
                <Icon className="w-4 h-4 text-primary mb-1" />
                <span className="text-[11px] font-bold text-foreground leading-tight">{item.label}</span>
                <span className="text-[9px] text-muted-foreground">{item.sub}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
