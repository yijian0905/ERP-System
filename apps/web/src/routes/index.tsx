/**
 * @file Root Route - Application Entry Point
 * @description Redirects directly to login page
 *
 * Per license-system-guide.md:
 * - No license key input page needed
 * - Users go directly to login
 * - Authorization validation happens at login time via backend
 */

import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RootRedirect,
});

function RootRedirect() {
  // Directly redirect to login page
  // Authorization is validated during login, not before
  return <Navigate to="/login" />;
}
