import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './print.css';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'StockFlow | Stock Management',
    template: '%s | StockFlow',
  },
  description:
    'StockFlow — a modern stock management frontend powered by ERPNext. Track inventory, manage warehouses, and generate reports.',
  keywords: ['stock management', 'inventory', 'ERPNext', 'warehouse', 'StockFlow'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                success: {
                  duration: 3000,
                  icon: '✅',
                  style: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', fontSize: '13px' },
                },
                error: {
                  duration: 5000,
                  icon: '❌',
                  style: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', fontSize: '13px' },
                },
                loading: {
                  style: { background: '#1a1a2e', color: '#fff', borderRadius: '8px', fontSize: '13px' },
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
