import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertCircle, Eye, EyeOff, ShieldCheck, Clock, Lock,
  ArrowRight, Sparkles, CheckCircle2, UserPlus, Check, KeyRound, X, Mail, PhoneCall, ArrowLeft, RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

const RENDER_API = 'https://fashionxpress.onrender.com';

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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password interactive 3-step modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [forgotInput, setForgotInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('4829');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      // Always use Render backend directly — avoids Vercel static host interception
      const res = await fetch(`${RENDER_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        const serverMsg = json?.error || json?.message || `Error ${res.status}`;
        if (res.status === 401 || res.status === 400) {
          setErrorMsg('Incorrect email/mobile number or password. Please check your credentials.');
        } else if (res.status === 404) {
          setErrorMsg('No account found with this email or mobile number. Please create an account first.');
        } else {
          setErrorMsg(serverMsg);
        }
        return;
      }
      if (rememberMe) {
        localStorage.setItem('remember_user', data.email);
      } else {
        localStorage.removeItem('remember_user');
      }
      login(json.token, json.user);
      if (json.user.role === 'admin') setLocation('/admin');
      else if (json.user.role === 'executive') setLocation('/executive');
      else if (json.user.role === 'merchant') setLocation('/merchant');
      else setLocation('/');
    } catch (err: any) {
      setErrorMsg('Could not connect to server. Please check your connection and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStep1SendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setResetError(null);
    setResetLoading(true);

    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);

    setTimeout(() => {
      setResetLoading(false);
      setResetStep(2);
    }, 600);
  };

  const handleStep2VerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim() !== generatedOtp) {
      setResetError(`Invalid OTP code. Use demo code: ${generatedOtp}`);
      return;
    }
    setResetError(null);
    setResetStep(3);
  };

  const handleStep3ResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetError(null);
    setResetLoading(true);

    try {
      const res = await fetch(`${RENDER_API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: forgotInput,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      login(data.token, data.user);
      setShowForgotModal(false);
      setLocation('/');
    } catch (err: any) {
      setResetError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setResetLoading(false);
    }
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
            <img src="/logo.jpg" alt="TFX" className="w-9 h-9 object-contain rounded-lg" />
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
                Sign in to access your bookings & wishlist.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Loading overlay hint */}
              {isLoggingIn && (
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setResetStep(1);
                      setForgotInput('');
                      setOtpInput('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setResetError(null);
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
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

              {/* Keep me signed in Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background'}`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs text-foreground/80 font-medium">Keep me signed in</span>
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 font-bold tracking-[0.15em] uppercase text-xs rounded-xl shadow-lg shadow-primary/20 transition-all relative overflow-hidden"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* ── FORGOT PASSWORD 3-STEP MODAL ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-foreground/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Error banner inside modal */}
            {resetError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {/* STEP 1: Enter Mobile / Email */}
            {resetStep === 1 && (
              <div className="space-y-5">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-1">Reset Your Password</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter your registered email address or mobile number to receive an instant verification OTP.
                  </p>
                </div>

                <form onSubmit={handleStep1SendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      Email or Mobile Number
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. 8147138195 or name@example.com"
                      value={forgotInput}
                      onChange={(e) => { setForgotInput(e.target.value); setResetError(null); }}
                      className="h-12 rounded-xl bg-background border-border"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 font-bold uppercase tracking-wider text-xs rounded-xl" disabled={resetLoading}>
                    {resetLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Sending OTP…
                      </span>
                    ) : "Get Verification OTP"}
                  </Button>
                </form>

                <div className="pt-4 border-t border-border space-y-2">
                  <div className="text-[11px] text-muted-foreground text-center">Need instant assistance?</div>
                  <div className="flex items-center justify-center gap-4 text-xs font-medium text-primary">
                    <a href="mailto:concierge@fashionxpress.in" className="flex items-center gap-1.5 hover:underline">
                      <Mail className="w-3.5 h-3.5" /> Concierge
                    </a>
                    <a href="tel:6304847223" className="flex items-center gap-1.5 hover:underline">
                      <PhoneCall className="w-3.5 h-3.5" /> Call 6304847223
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Enter 4-Digit OTP */}
            {resetStep === 2 && (
              <div className="space-y-5">
                <button onClick={() => setResetStep(1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Phone/Email
                </button>
                <div>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-1">Enter Verification Code</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter the 4-digit code sent to <strong className="text-foreground">{forgotInput}</strong>.
                  </p>
                </div>

                {/* Demo OTP Helper Pill */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                  <span className="text-foreground/80 font-medium">Demo OTP Code: <strong className="text-primary font-bold">{generatedOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => { setOtpInput(generatedOtp); setResetError(null); }}
                    className="text-[11px] font-bold uppercase tracking-wider text-primary underline"
                  >
                    1-Click Fill
                  </button>
                </div>

                <form onSubmit={handleStep2VerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      4-Digit OTP Code
                    </label>
                    <Input
                      type="text"
                      maxLength={4}
                      required
                      placeholder="e.g. 4829"
                      value={otpInput}
                      onChange={(e) => { setOtpInput(e.target.value); setResetError(null); }}
                      className="h-12 text-center font-bold tracking-[0.4em] text-lg rounded-xl bg-background border-border"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 font-bold uppercase tracking-wider text-xs rounded-xl">
                    Verify Code
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 3: Enter New Password */}
            {resetStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-serif font-bold text-foreground mb-1">Create New Password</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set a new password for <strong className="text-foreground">{forgotInput}</strong>.
                  </p>
                </div>

                <form onSubmit={handleStep3ResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      New Password
                    </label>
                    <Input
                      type="password"
                      required
                      placeholder="Enter new password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setResetError(null); }}
                      className="h-12 rounded-xl bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setResetError(null); }}
                      className="h-12 rounded-xl bg-background border-border"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 font-bold uppercase tracking-wider text-xs rounded-xl" disabled={resetLoading}>
                    {resetLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Updating Password…
                      </span>
                    ) : "Update Password & Sign In"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
