'use client';

import { useState, useEffect } from 'react';
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
  Bot,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  List,
  FileCheck,
} from 'lucide-react';

interface SubItem {
  title: string;
  href: string;
  icon?: any;
  minRole?: AdminRole;
}

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
  /** Minimum role required to see this item. Defaults to VIEWER. */
  minRole?: AdminRole;
  subItems?: SubItem[];
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard',       href: '/admin',                icon: LayoutDashboard },
  { title: 'Jobs',             href: '/admin/jobs',           icon: Briefcase },
  { title: 'Bulletins',        href: '/admin/bulletins',      icon: Megaphone },
  {
    title: 'Scrapers',
    href: '/admin/scrapers',
    icon: Bot,
    subItems: [
      { title: 'Target Sources',    href: '/admin/scrapers',        icon: List },
      { title: 'Add Target Source', href: '/admin/scrapers/create', icon: PlusCircle },
      { title: 'Imported Drafts',   href: '/admin/jobs',            icon: FileCheck },
    ],
  },
  { title: 'Job Categories',   href: '/admin/job-categories', icon: Briefcase },
  { title: 'Organizations',    href: '/admin/organizations',  icon: Building2 },
  { title: 'Redirect Links',   href: '/admin/redirect-links', icon: Link2 },
  { title: 'FAQ',              href: '/admin/faqs',           icon: HelpCircle },
  { title: 'Queries',          href: '/admin/queries',        icon: Mail },
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
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  // Auto-expand menu if current path matches item or its subItems
  useEffect(() => {
    const newOpenState: Record<string, boolean> = { ...openSubMenus };
    sidebarItems.forEach((item) => {
      if (item.subItems) {
        const isChildActive = item.subItems.some((sub) => pathname === sub.href && sub.href !== '/admin/jobs');
        const isParentActive = pathname === item.href || pathname.startsWith(item.href + '/');
        if (isChildActive || isParentActive) {
          newOpenState[item.href] = true;
        }
      }
    });
    setOpenSubMenus(newOpenState);
  }, [pathname]);

  const toggleSubMenu = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isDashboard = item.href === '/admin';
          const isParentActive = pathname === item.href || (!isDashboard && pathname.startsWith(item.href + '/'));
          const hasSub = Boolean(item.subItems && item.subItems.length > 0);
          const isOpen = openSubMenus[item.href];

          return (
            <div key={item.href} className="space-y-1">
              <div className="flex items-center justify-between group">
                <Link
                  href={item.href}
                  onClick={() => {
                    if (hasSub && !isOpen) {
                      setOpenSubMenus((prev) => ({ ...prev, [item.href]: true }));
                    }
                  }}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                    isParentActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0 text-blue-400 group-hover:text-white transition-colors" />
                  <span>{item.title}</span>
                </Link>
                {hasSub && (
                  <button
                    type="button"
                    onClick={(e) => toggleSubMenu(item.href, e)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                    aria-label={`Toggle ${item.title} sub-menu`}
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Sub-Items */}
              {hasSub && isOpen && (
                <div className="pl-9 space-y-1 border-l-2 border-blue-500/40 ml-5 my-1">
                  {item.subItems
                    ?.filter((sub) => !sub.minRole || hasPermission([sub.minRole]))
                    .map((sub) => {
                      const isSubActive = pathname === sub.href;
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                            isSubActive
                              ? 'bg-blue-900/60 text-blue-300 font-semibold'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                          )}
                        >
                          {SubIcon && <SubIcon className="w-3.5 h-3.5" />}
                          <span>{sub.title}</span>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
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