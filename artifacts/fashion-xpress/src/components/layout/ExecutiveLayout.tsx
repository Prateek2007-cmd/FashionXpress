import React from 'react';
import { Link, useLocation, Redirect } from 'wouter';
import {
  ClipboardList,
  CreditCard,
  RotateCcw,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated, isLoading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/login" />;
  if (user && user.role !== 'executive') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-xl font-serif">
        Unauthorized access
      </div>
    );
  }

  const links = [
    { label: 'Assigned Leads', href: '/executive', icon: ClipboardList },
    { label: 'On-Visit Checkout', href: '/executive/checkout', icon: CreditCard },
    { label: 'Cash & Returns', href: '/executive/reconciliation', icon: RotateCcw },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/60 backdrop-blur-md flex flex-col shrink-0">
        {/* Header Branding */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-border">
          <Link href="/executive" className="flex items-center gap-2.5">
            <img
              src="/logo.webp"
              alt="TFX Logo"
              className="h-9 w-auto object-contain rounded-lg"
            />
            <div>
              <span className="font-brand font-bold text-xs tracking-widest uppercase text-foreground block">
                The Fashion Xpress
              </span>
              <span className="text-[10px] text-primary font-mono tracking-widest uppercase font-bold">
                Style Executive
              </span>
            </div>
          </Link>
        </div>

        {/* Executive Profile Badge */}
        <div className="p-5 pb-3 bg-white/[0.02] border-b border-border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Active Executive</p>
          <p className="text-foreground font-semibold text-sm truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{user?.email}</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location === link.href ||
              (link.href === '/executive' && (location === '/executive' || location === '/executive/leads'));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-1.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" /> Switch to Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-500" /> Switch to Dark Mode
              </>
            )}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
