import React from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user);
        toast({ title: "Welcome back", description: "Successfully logged in." });
        
        // Route based on role
        if (res.user.role === 'admin') setLocation('/admin');
        else if (res.user.role === 'executive') setLocation('/executive');
        else setLocation('/');
      },
      onError: (err: any) => {
        toast({ 
          title: "Login failed", 
          description: err.response?.data?.message || "Please check your credentials and try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif text-white mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Fashion Xpress account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-8 rounded-2xl border border-white/5 shadow-2xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Email</label>
            <Input 
              type="email" 
              placeholder="Enter your email" 
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/80">Password</label>
              <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
            </div>
            <Input 
              type="password" 
              placeholder="Enter your password" 
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "SIGNING IN..." : "SIGN IN"}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Don't have an account? <Link href="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
