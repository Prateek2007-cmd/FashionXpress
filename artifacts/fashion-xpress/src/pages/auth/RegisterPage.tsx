import React from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegisterCustomer } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegisterCustomer();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user);
        toast({ title: "Welcome to The Fashion Xpress", description: "Your account has been created." });
        setLocation('/');
      },
      onError: (err: any) => {
        toast({
          title: "Registration failed",
          description: err.response?.data?.message || "An error occurred during registration.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif text-white mb-2">Join the Elite</h1>
          <p className="text-muted-foreground">Create your The Fashion Xpress profile</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-card p-8 rounded-2xl border border-white/5 shadow-2xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Full Name</label>
            <Input
              type="text"
              placeholder="e.g. Rahul Sharma"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

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
            <label className="text-sm font-medium text-white/80">Phone Number</label>
            <Input
              type="tel"
              placeholder="Enter 10-digit number"
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
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Password</label>
            <Input
              type="password"
              placeholder="Create a strong password"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
