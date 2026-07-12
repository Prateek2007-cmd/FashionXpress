import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';

export function CustomerNavbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Collections', href: '/products' },
    { label: 'Book Visit', href: '/book-visit' },
    { label: 'Direct Booking', href: '/book-visit' },
    { label: 'About Us', href: '/about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="font-serif font-bold text-primary-foreground text-lg leading-none">TFX</span>
          </div>
          <span className="font-serif font-bold text-xl tracking-widest uppercase">THE FASHION XPRESS</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`text-sm tracking-widest uppercase font-medium transition-colors hover:text-primary ${location === link.href ? 'text-primary' : 'text-muted-foreground'}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/wishlist" className="text-muted-foreground hover:text-primary transition-colors">
                <Heart className="w-5 h-5" />
              </Link>
              <Link href="/home-visit-cart" className="text-muted-foreground hover:text-primary transition-colors">
                <ShoppingBag className="w-5 h-5" />
              </Link>
              <Link href="/account" className="text-muted-foreground hover:text-primary transition-colors">
                <User className="w-5 h-5" />
              </Link>
              <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
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
              <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)}><Heart className="w-5 h-5" /></Link>
              <Link href="/home-visit-cart" onClick={() => setIsMobileMenuOpen(false)}><ShoppingBag className="w-5 h-5" /></Link>
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
