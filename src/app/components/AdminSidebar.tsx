'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, AdminRole } from '@/lib/auth-context';
import {
  Briefcase,
  FileText,
  Users,
  Settings,
  LayoutDashboard,
  HelpCircle,
  Link2,
  Mail,
  Building2,
  Megaphone,
  LogOut,
  Shield,
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
  /** Minimum role required to see this item. Defaults to VIEWER. */
  minRole?: AdminRole;
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard',       href: '/admin',                icon: LayoutDashboard },
  { title: 'Jobs',             href: '/admin/jobs',           icon: Briefcase },
  { title: 'Bulletins',        href: '/admin/bulletins',      icon: Megaphone },
  { title: 'Job Categories',   href: '/admin/job-categories', icon: Briefcase, minRole: AdminRole.PUBLISHER },
  { title: 'Organizations',    href: '/admin/organizations',  icon: Building2, minRole: AdminRole.PUBLISHER },
  { title: 'Redirect Links',   href: '/admin/redirect-links', icon: Link2 },
  { title: 'FAQ',              href: '/admin/faqs',           icon: HelpCircle },
  { title: 'Queries',          href: '/admin/queries',        icon: Mail, minRole: AdminRole.EDITOR },
  { title: 'Users',            href: '/admin/users',          icon: Users, minRole: AdminRole.SUPER_ADMIN },
  { title: 'Settings',         href: '/admin/settings',       icon: Settings, minRole: AdminRole.SUPER_ADMIN },
];

const ROLE_LABELS: Record<AdminRole, string> = {
  [AdminRole.SUPER_ADMIN]: 'Super Admin',
  [AdminRole.PUBLISHER]: 'Publisher',
  [AdminRole.EDITOR]: 'Editor',
  [AdminRole.VIEWER]: 'Viewer',
};

const ROLE_COLORS: Record<AdminRole, string> = {
  [AdminRole.SUPER_ADMIN]: 'bg-red-500/20 text-red-300',
  [AdminRole.PUBLISHER]: 'bg-blue-500/20 text-blue-300',
  [AdminRole.EDITOR]: 'bg-green-500/20 text-green-300',
  [AdminRole.VIEWER]: 'bg-gray-500/20 text-gray-300',
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  // Filter sidebar items by user's role
  const visibleItems = sidebarItems.filter((item) => {
    if (!item.minRole) return true;
    return hasPermission([item.minRole]);
  });

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      {/* Brand */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const isDashboard = item.href === '/admin';
          const isActive = pathname === item.href || (!isDashboard && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      {user && (
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name || user.email}
              </p>
              <span
                className={cn(
                  'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase',
                  ROLE_COLORS[user.role] || 'bg-gray-500/20 text-gray-300',
                )}
              >
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}