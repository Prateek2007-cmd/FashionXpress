import React from 'react';
import { Link, useLocation, Redirect } from 'wouter';
import { Calendar, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (user && user.role !== 'executive') return <div className="min-h-screen bg-black text-white flex items-center justify-center text-xl font-serif">Unauthorized access</div>;

  const links = [
    { label: 'Today\'s Visits', href: '/executive', icon: Calendar },
    { label: 'Completed', href: '/executive/completed', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen flex bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-card/30 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TFX Logo" className="h-8 w-auto object-contain" style={{ mixBlendMode: 'screen' }} />
            <span className="font-serif font-bold text-sm tracking-widest uppercase text-primary">EXECUTIVE</span>
          </div>
        </div>

        <div className="p-6 pb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Welcome,</p>
          <p className="text-white font-medium">{user?.name}</p>
        </div>

        <nav className="flex-1 py-4 px-4 space-y-2">
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
