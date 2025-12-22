import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createHashHistory } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { routeTree } from './routeTree.gen';

import './styles/globals.css';

// Detect if running in Electron with file:// protocol (production build)
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

// Create router with hash history for file:// protocol (Electron production)
// Use default browser history for development and web deployment
const router = createRouter({
  routeTree,
  history: isFileProtocol ? createHashHistory() : undefined,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Enable MSW mocking in development mode
 * Controlled by VITE_USE_MOCKS environment variable
 */
async function enableMocking(): Promise<void> {
  // Only enable in development when VITE_USE_MOCKS is true
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  // Start the MSW worker
  await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  });

  console.log('[MSW] Mock Service Worker enabled');
}

// Render the app after enabling mocking
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  enableMocking().then(() => {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>
    );
  });
}

