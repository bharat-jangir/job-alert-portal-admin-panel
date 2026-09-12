'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';

const sidebarItems = [
  { title: 'Dashboard',       href: '/admin',                icon: LayoutDashboard },
  { title: 'Jobs',             href: '/admin/jobs',           icon: Briefcase },
  { title: 'Bulletins',        href: '/admin/bulletins',      icon: Megaphone },
  { title: 'Job Categories',   href: '/admin/job-categories', icon: Briefcase },
  { title: 'Organizations',    href: '/admin/organizations',  icon: Building2 },
  { title: 'Redirect Links',   href: '/admin/redirect-links', icon: Link2 },
  { title: 'FAQ',              href: '/admin/faqs',           icon: HelpCircle },
  { title: 'Queries',          href: '/admin/queries',        icon: Mail },
  { title: 'Users',            href: '/admin/users',          icon: Users },
  { title: 'Settings',         href: '/admin/settings',       icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      <nav className="space-y-1">
        {sidebarItems.map((item) => {
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
    </div>
  );
} 