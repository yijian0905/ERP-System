import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center">
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
            <h1 className="text-5xl font-bold text-white tracking-tight">
              ERP System
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-xl text-slate-400 text-center max-w-2xl">
            Enterprise Resource Planning System with multi-tenant support,
            predictive analytics, and AI-powered assistance.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-5xl">
            <FeatureCard
              tier="L1"
              title="Standard"
              description="Core inventory, invoicing, and basic reports"
              features={['Inventory Management', 'Customer Management', 'Basic Reports', 'Invoicing']}
            />
            <FeatureCard
              tier="L2"
              title="Professional"
              description="Advanced analytics with predictive AI"
              features={['All L1 Features', 'Predictive Analytics', 'Demand Forecasting', 'Advanced Reports']}
              highlighted
            />
            <FeatureCard
              tier="L3"
              title="Enterprise"
              description="Full AI suite with chat assistant"
              features={['All L2 Features', 'AI Chat Assistant', 'Schema Isolation', 'Custom Integrations']}
            />
          </div>

          {/* CTA */}
          <div className="flex space-x-4 mt-8">
            <Button
              size="lg"
              onClick={() => navigate({ to: '/login' })}
            >
              Sign In
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  tier: string;
  title: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

function FeatureCard({ tier, title, description, features, highlighted }: FeatureCardProps) {
  return (
    <div
      className={`relative rounded-2xl p-6 ${highlighted
          ? 'bg-primary/10 border-2 border-primary'
          : 'bg-slate-800/50 border border-slate-700'
        }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
          Most Popular
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">{tier}</span>
        </div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
        <ul className="space-y-2 pt-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2 text-slate-300">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
