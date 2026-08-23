import React from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
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
          setErrorMsg('Incorrect email or password. Please try again.');
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
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif text-white mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your The Fashion Xpress account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-card p-8 rounded-2xl border border-white/5 shadow-2xl">

          {/* ── Inline error banner ── */}
          {errorMsg && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Email</label>
            <Input
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
              onChange={() => setErrorMsg(null)}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/80">Password</label>
              <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                onChange={() => setErrorMsg(null)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "SIGNING IN..." : "SIGN IN"}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            Don't have an account? <Link href="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
