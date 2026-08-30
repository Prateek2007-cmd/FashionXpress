import React, { useState } from 'react';
import { Link, useLocation, Redirect } from 'wouter';
import { LayoutDashboard, Calendar, Users, Package, Settings, LogOut, ClipboardList, Menu, X, Sun, Moon, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated, isLoading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (user && user.role !== 'admin') return <div className="min-h-screen bg-black text-white flex items-center justify-center text-xl font-serif">Unauthorized access</div>;

  const links = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Categories', href: '/admin/categories', icon: Package },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Merchants', href: '/admin/merchants', icon: Users },
    { label: 'Analytics', href: '/admin/analytics', icon: Settings },
    { label: 'Brands & Commission', href: '/admin/brands', icon: Trophy },
    { label: 'Partners', href: '/admin/partners', icon: Users },
    { label: 'Page Content', href: '/admin/content', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black relative">
      {/* Mobile Header */}
      <header className="h-16 border-b border-white/5 bg-card/50 flex items-center justify-between px-4 md:hidden z-40 w-full shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/logo.webp"
            alt="The Fashion Xpress"
            className="h-9 w-9 object-contain rounded-lg shrink-0"
          />
          <span className="font-brand text-xs text-white font-bold tracking-[0.15em] uppercase">The Fashion Xpress</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white hover:text-primary transition-colors focus:outline-none"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Backdrop overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 border-r border-white/5 bg-black/95 md:bg-card/30 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 md:static shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.webp"
              alt="The Fashion Xpress"
              className="h-11 w-11 object-contain rounded-xl shrink-0"
            />
            <span className="font-brand text-sm text-white font-bold tracking-[0.15em] uppercase leading-tight">
              The Fashion Xpress
            </span>
          </div>
          {/* Close button inside sidebar on mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-muted-foreground hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border shrink-0 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? (
              <><Sun className="w-4 h-4 text-amber-400" /> Switch to Light Mode</>
            ) : (
              <><Moon className="w-4 h-4 text-blue-500" /> Switch to Dark Mode</>
            )}
          </button>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              logout();
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
