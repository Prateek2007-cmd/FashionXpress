import React from 'react';
import { Link, useLocation, Redirect } from 'wouter';
import { LayoutDashboard, Calendar, Users, Package, Settings, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (user && user.role !== 'admin') return <div className="min-h-screen bg-black text-white flex items-center justify-center text-xl font-serif">Unauthorized access</div>;

  const links = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Categories', href: '/admin/categories', icon: Package },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Executives', href: '/admin/executives', icon: UserCheck },
    { label: 'Analytics', href: '/admin/analytics', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-card/30 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TFX Logo" className="h-8 w-auto object-contain" style={{ filter: 'invert(1) grayscale(1)', mixBlendMode: 'screen' }} />
            <span className="font-serif font-bold text-sm tracking-widest uppercase text-primary">ADMIN</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={logout}
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
