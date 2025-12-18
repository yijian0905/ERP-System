import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { post } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth';

import type { AuthUser } from '@/stores/auth';

// Search params type
interface LoginSearch {
    redirect?: string;
}

export const Route = createFileRoute('/login')({
    validateSearch: (search: Record<string, unknown>): LoginSearch => {
        return {
            redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
        };
    },
    component: LoginPage,
});

function LoginPage() {
    const navigate = useNavigate();
    const { redirect } = useSearch({ from: '/login' });
    const { isAuthenticated, setAuth } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate({ to: redirect || '/dashboard' });
        }
    }, [isAuthenticated, navigate, redirect]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);

            try {
                const response = await post<{
                    user: AuthUser;
                    accessToken: string;
                    refreshToken: string;
                }>('/auth/login', { email, password });

                if (response.success && response.data) {
                    const { user, accessToken, refreshToken } = response.data;
                    setAuth(user, accessToken, refreshToken);
                    navigate({ to: redirect || '/dashboard' });
                } else {
                    setError(response.error?.message || 'Login failed. Please try again.');
                }
            } catch {
                setError('Unable to connect to server. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        },
        [email, password, navigate, redirect, setAuth]
    );

    // Demo login shortcut
    const handleDemoLogin = useCallback(() => {
        setEmail('admin@demo-company.com');
        setPassword('Admin123!');
    }, []);

    // Dev mode bypass - auto login without API call
    const handleDevBypass = useCallback(() => {
        // Create mock user for dev mode
        const mockUser: AuthUser = {
            id: 'dev-user-1',
            email: 'dev@localhost',
            name: 'Developer',
            role: 'ADMIN',
            tenantId: 'dev-tenant',
            tenantName: 'Development Tenant',
            tier: 'L3',
            permissions: ['*'], // Full permissions
        };

        const mockAccessToken = 'dev-access-token';
        const mockRefreshToken = 'dev-refresh-token';

        setAuth(mockUser, mockAccessToken, mockRefreshToken);
        navigate({ to: redirect || '/dashboard' });
    }, [navigate, redirect, setAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="flex flex-col items-center mb-8">
                    <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mb-4">
                        <svg
                            className="h-10 w-10 text-primary-foreground"
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
                    <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="text-slate-400 mt-2">Sign in to your ERP System account</p>
                </div>

                {/* Login Form */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className={cn(
                                        'pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500',
                                        'focus:border-primary focus:ring-primary'
                                    )}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className={cn(
                                        'pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500',
                                        'focus:border-primary focus:ring-primary'
                                    )}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-600 bg-slate-900/50 text-primary focus:ring-primary"
                                />
                                <span className="text-slate-400">Remember me</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    {/* Demo Account */}
                    <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-sm text-slate-400 text-center mb-3">
                            Demo Account
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={handleDemoLogin}
                        >
                            Fill Demo Credentials
                        </Button>
                        <p className="text-xs text-slate-500 text-center mt-2">
                            admin@demo-company.com / Admin123!
                        </p>
                    </div>

                    {/* Dev Mode Bypass - Only show in development */}
                    {import.meta.env.DEV && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className="text-sm text-amber-400 text-center mb-3 flex items-center justify-center gap-2">
                                <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                Developer Mode
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-amber-600 text-amber-300 hover:bg-amber-900/20"
                                onClick={handleDevBypass}
                            >
                                🚀 Bypass Login (Dev Only)
                            </Button>
                            <p className="text-xs text-amber-500/60 text-center mt-2">
                                Instant login with full L3 permissions
                            </p>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}
