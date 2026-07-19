import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useListWishlist, useListHomeVisitCart } from '@workspace/api-client-react';
import { User, LogOut, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';

export function CustomerNavbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: wishlist } = useListWishlist({ query: { enabled: !!user } as any });
  const { data: cartItems } = useListHomeVisitCart({ query: { enabled: !!user } as any });

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Coming Soon', href: '/book-visit' },
    { label: 'Store Pickup', href: '/products' },
    { label: 'Partner With Us', href: '/partner' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="TFX" className="h-14 w-auto object-contain" style={{ filter: 'invert(1) grayscale(1)', mixBlendMode: 'screen' }} />
          <span className="font-serif font-bold text-lg md:text-xl tracking-widest uppercase text-white hover:text-primary transition-colors">THE FASHION XPRESS</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`text-sm tracking-widest uppercase font-medium transition-colors ${location === link.href ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/wishlist" className="p-2 hover:text-primary transition-colors relative">
                <Heart className="w-5 h-5 text-white" />
                {wishlist && wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-black font-bold text-[10px] flex items-center justify-center rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link href="/home-visit-cart" className="p-2 hover:text-primary transition-colors relative">
                <ShoppingBag className="w-5 h-5 text-white" />
                {cartItems && cartItems.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-black font-bold text-[10px] flex items-center justify-center rounded-full">
                    {cartItems.length}
                  </span>
                )}
              </Link>
              <Link href="/account" className="p-2 hover:text-primary transition-colors">
                <User className="w-5 h-5 text-white" />
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider">Admin</Button>
                </Link>
              )}
              {user.role === 'merchant' && (
                <Link href="/merchant">
                  <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider">Merchant</Button>
                </Link>
              )}
              {user.role === 'executive' && (
                <Link href="/executive">
                  <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider">Executive</Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={logout} title="Sign Out">
                <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive" />
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="uppercase tracking-widest text-xs">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm tracking-widest uppercase font-medium block" onClick={() => setIsMobileMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="flex gap-6 mt-4 pt-4 border-t border-border">
              <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="relative">
                <Heart className="w-5 h-5" />
                {wishlist && wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-black font-bold text-[9px] flex items-center justify-center rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link href="/home-visit-cart" onClick={() => setIsMobileMenuOpen(false)} className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartItems && cartItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-black font-bold text-[9px] flex items-center justify-center rounded-full">
                    {cartItems.length}
                  </span>
                )}
              </Link>
              <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}><User className="w-5 h-5" /></Link>
              <button onClick={logout}><LogOut className="w-5 h-5 text-destructive" /></button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="mt-4">
              <Button className="w-full">SIGN IN</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

