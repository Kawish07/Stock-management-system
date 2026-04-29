'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  Layers,
  LogOut,
  FileText,
  Users2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type NavChild = { label: string; href: string };
type NavItem =
  | { label: string; href: string; icon: React.ElementType; children?: undefined }
  | { label: string; href?: undefined; icon: React.ElementType; children: NavChild[] };

type NavSection = {
  heading?: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'INVENTORY',
    items: [
      { label: 'Items', href: '/items', icon: Package },
      { label: 'Categories', href: '/categories', icon: FolderTree },
      { label: 'Warehouses', href: '/warehouses', icon: Warehouse },
      { label: 'Stock Entry', href: '/stock-entries', icon: ArrowLeftRight },
    ],
  },
  {
    heading: 'SALES',
    items: [
      { label: 'Customers', href: '/customers', icon: Users2 },
      { label: 'Invoices', href: '/invoices', icon: FileText },
    ],
  },
  {
    heading: 'REPORTS',
    items: [
      {
        label: 'Reports',
        icon: BarChart3,
        children: [
          { label: 'Stock Balance', href: '/reports/stock-balance' },
          { label: 'Stock Ledger', href: '/reports/stock-ledger' },
          { label: 'Sales Report', href: '/reports/sales' },
        ],
      },
    ],
  },
  {
    heading: 'SETTINGS',
    items: [{ label: 'Users', href: '/users', icon: Users }],
  },
];

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Auto-open Reports group if on a reports page
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    pathname.startsWith('/reports') ? ['Reports'] : []
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? 'U';

  return (
    <aside className="w-64 h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
          <Layers className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            StockFlow
          </span>
          <p className="text-[10px] leading-none text-zinc-400 dark:text-zinc-500 mt-0.5">
            ERPNext Integration
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-3">
        {navSections.map((section, sectionIdx) => (
          <div key={section.heading ?? `section-${sectionIdx}`} className="space-y-0.5">
            {section.heading && (
              <p className="px-3 pt-1 pb-1 text-[10px] tracking-widest text-zinc-400 dark:text-zinc-500 font-semibold">
                {section.heading}
              </p>
            )}

            {section.items.map((item) => {
          /* ── Hide Users link for non-System Managers ── */
          if (item.href === '/users') {
            const isSystemManager = user?.roles?.some((r) => r.role === 'System Manager');
            const isAdministrator =
              user?.name === 'Administrator' ||
              user?.email === 'Administrator' ||
              user?.full_name === 'Administrator';
            if (!isSystemManager && !isAdministrator) return null;
          }

          /* ── Group / accordion ── */
          if (item.children) {
            const isOpen = openGroups.includes(item.label);
            const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isGroupActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="ml-4 pl-3 mt-0.5 space-y-0.5 border-l border-zinc-200 dark:border-zinc-700">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavClick}
                          className={cn(
                            'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                            childActive
                              ? 'bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-900/50 dark:text-indigo-400'
                              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          /* ── Regular link ── */
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-900/50 dark:text-indigo-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
          </div>
        ))}
      </nav>

      {/* ── User info + Logout ──────────────────────────────────── */}
      <div className="border-t border-zinc-200 dark:border-zinc-800">
        {user && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.user_image} alt={user.full_name} />
              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
