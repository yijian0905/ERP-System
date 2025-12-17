import { createFileRoute, redirect } from '@tanstack/react-router';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: () => {
    // Check if user is authenticated
    const { isAuthenticated, user } = useAuthStore.getState();

    // Dev mode bypass - allow access if using dev bypass user
    if (import.meta.env.DEV && user?.id === 'dev-user-1') {
      return;
    }

    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      });
    }
  },
  component: DashboardLayout,
});

