import { createFileRoute, redirect } from '@tanstack/react-router';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/stores/auth';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: () => {
    // Check if user is authenticated
    const { isAuthenticated } = useAuthStore.getState();
    
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

