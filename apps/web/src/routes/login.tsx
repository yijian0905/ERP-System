import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { post } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { usePermissionsStore, ROLE_PERMISSIONS, getAllPermissions } from '@/stores/permissions';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setCurrentUserPermissions } = usePermissionsStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    console.log('[LOGIN] Starting login process...', { //debug log 
      email: data.email, //debug log
      hasPassword: !!data.password, //debug log
      rememberMe: data.rememberMe, //debug log
    }); //debug log

    setIsLoading(true);
    setError(null);

    try {
      console.log('[LOGIN] Sending login request to /auth/login'); //
      const response = await post<{
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          email: string;
          name: string;
          role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
          tenantId: string;
          tenantName: string;
          tier: 'L1' | 'L2' | 'L3';
          permissions: string[];
        };
      }>('/auth/login', data);

      console.log('[LOGIN] Received response:', { //debug log
        success: response.success, //debug log
        hasData: !!response.data, //debug log
        error: response.error, //debug log
      }); //debug log

      if (response.success && response.data) {
        const { accessToken, refreshToken, user } = response.data;
        console.log('[LOGIN] Login successful!', { //debug log
          userId: user.id, //debug log
          email: user.email, //debug log
          role: user.role, //debug log
          tier: user.tier, //debug log
          hasAccessToken: !!accessToken, //debug log
          hasRefreshToken: !!refreshToken, //debug log  
        }); //debug log

        setAuth(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            tier: user.tier,
          },
          accessToken,
          refreshToken
        );

        // Set user permissions based on role and server response
        // Use server permissions if provided, otherwise fall back to role-based defaults
        let userPermissions: string[];
        if (user.permissions && user.permissions.length > 0) {
          // Use permissions from server (already in dot notation)
          userPermissions = user.permissions;
          console.log('[LOGIN] Using server-provided permissions:', userPermissions.length, userPermissions);
        } else if (user.role === 'ADMIN') {
          // ADMIN gets all permissions
          userPermissions = getAllPermissions();
          console.log('[LOGIN] Using all permissions for ADMIN');
        } else if (ROLE_PERMISSIONS[user.role]) {
          // Use role-based defaults
          userPermissions = ROLE_PERMISSIONS[user.role];
          console.log('[LOGIN] Using role-based permissions for', user.role);
        } else {
          // Fallback to empty
          userPermissions = [];
          console.log('[LOGIN] No permissions found');
        }
        setCurrentUserPermissions(userPermissions);

        console.log('[LOGIN] Navigating to /dashboard'); //debug log
        navigate({ to: '/dashboard' });
      } else {
        /*setError(response.error?.message || 'Login failed');*/ //after delete debug log, bring back this line
        const errorMsg = response.error?.message || 'Login failed';
        console.error('[LOGIN] Login failed:', {
          error: response.error,
          errorMessage: errorMsg,
        });
        setError(errorMsg); //debug log
      }
    } catch (err) {
      console.error('[LOGIN] Exception during login:', { //debug log
        error: err, //debug log
        errorType: err instanceof Error ? err.constructor.name : typeof err, //debug log
        errorMessage: err instanceof Error ? err.message : String(err), //debug log
        errorStack: err instanceof Error ? err.stack : undefined, //debug log
      }); //debug log
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('[LOGIN] Login process completed'); //debug log
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
              <svg
                className="h-8 w-8 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <span className="text-3xl font-bold text-white">ERP System</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4">
            Enterprise Resource
            <br />
            <span className="text-primary">Planning System</span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-8 max-w-md">
            Streamline your business operations with our comprehensive ERP solution. 
            Manage inventory, orders, and customers all in one place.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur">
              Multi-tenant
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur">
              AI-Powered
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur">
              Real-time Analytics
            </span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <svg
                className="h-7 w-7 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold">ERP System</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@demo-company.com"
                className={cn(
                  'flex h-11 w-full rounded-lg border bg-background px-4 py-2 text-sm ring-offset-background',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  errors.email && 'border-destructive focus-visible:ring-destructive'
                )}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    'flex h-11 w-full rounded-lg border bg-background px-4 py-2 pr-10 text-sm ring-offset-background',
                    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    errors.password && 'border-destructive focus-visible:ring-destructive'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  {...register('rememberMe')}
                />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">Demo Credentials</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">L2 Admin:</span>{' '}
                admin@demo-company.com / password123
              </p>
              <p>
                <span className="font-medium text-foreground">L3 Enterprise:</span>{' '}
                admin@enterprise.test / password123
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-primary hover:underline">
              Start a free trial
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

