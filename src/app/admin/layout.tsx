'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '../components/AdminSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page is public (no sidebar, no auth guard)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // All other /admin routes require authentication and show the role-aware sidebar
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
