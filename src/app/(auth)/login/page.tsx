'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Package2, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email or username'),
  password: z.string().min(1, 'Please enter your password'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('message') === 'session_expired';
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginForm) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      router.push(redirectTo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.toLowerCase().includes('too many') ||
        msg.toLowerCase().includes('locked') ||
        msg.toLowerCase().includes('attempts')
      ) {
        setErrorMessage('Too many attempts. Please wait before trying again.');
      } else if (
        msg.toLowerCase().includes('cannot connect') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('internet')
      ) {
        setErrorMessage('Cannot connect to server. Check your internet connection.');
      } else if (
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('password') ||
        msg.toLowerCase().includes('credentials') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('account')
      ) {
        setErrorMessage('Invalid email or password. Please try again.');
      } else {
        setErrorMessage(msg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Package2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'StockFlow'}
          </h1>
          <p className="text-sm text-muted-foreground">Stock Management System</p>
        </div>

        <Card className="shadow-sm">
          {sessionExpired && (
            <div className="mx-4 mt-4 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Your session has expired. Please login again.</span>
            </div>
          )}
          <CardHeader className="pb-4 text-center">
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email or Username</Label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder="admin@example.com or Administrator"
                  disabled={isSubmitting}
                  {...register('email')}
                  className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    {...register('password')}
                    className={cn(
                      'pr-10',
                      errors.password && 'border-destructive focus-visible:ring-destructive'
                    )}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
