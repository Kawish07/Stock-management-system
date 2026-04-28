'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Moon, Sun, LogOut, User, Settings, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { MobileSidebar } from './MobileSidebar';
import { ConnectionTest } from '@/components/shared/ConnectionTest';

// Derive the current section title from the pathname
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/items': 'Items',
  '/categories': 'Categories',
  '/warehouses': 'Warehouses',
  '/stock-entries': 'Stock Entries',
  '/reports/stock-balance': 'Stock Balance',
  '/reports/stock-ledger': 'Stock Ledger',
};

function getPageTitle(pathname: string): string {
  // Exact match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Prefix match (e.g. /items/new, /stock-entries/SE-0001)
  const match = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length) // longest first
    .find((key) => pathname.startsWith(key + '/'));
  return match ? PAGE_TITLES[match] : 'StockFlow';
}

// Fake notification count — replace with real hook when ready
const NOTIFICATION_COUNT = 3;

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState('');

  const pageTitle = getPageTitle(pathname);

  // Ctrl+K / Cmd+K focuses the search input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
        setSearchValue('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? 'U';

  return (
    <header className="h-16 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-4 gap-3">
      {/* ── Left: mobile hamburger + page title ─────────────────── */}
      <MobileSidebar />

      <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 hidden sm:block">
        {pageTitle}
      </h2>

      <div className="flex-1" />

      {/* ── Right: search + controls ─────────────────────────────── */}

      {/* Global search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        <Input
          ref={searchRef}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search…"
          className="pl-8 pr-14 h-8 w-52 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:w-64 transition-all duration-200"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 px-1 font-mono text-[9px] font-medium text-zinc-500 dark:text-zinc-400">
          ⌘K
        </kbd>
      </div>

      {/* Connection status */}
      <ConnectionTest />

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <Bell className="h-4 w-4" />
        {NOTIFICATION_COUNT > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
            {NOTIFICATION_COUNT > 9 ? '9+' : NOTIFICATION_COUNT}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-indigo-500/40 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_image} alt={user?.full_name} />
                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                  {user?.full_name ?? 'User'}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
