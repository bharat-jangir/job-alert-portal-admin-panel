'use client';

import { AuthProvider } from '@/lib/auth-context';

/**
 * Client-side wrapper for AuthProvider.
 * Needed because the root layout is a Server Component but AuthProvider uses client-side hooks.
 */
export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
