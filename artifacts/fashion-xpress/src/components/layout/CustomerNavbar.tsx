import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User, LogOut, Heart, ShoppingBag, Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

const RENDER_API = 'https://fashionxpress.onrender.com';

export function CustomerNavbar() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const updateCounts = () => {
      try {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const guestWishlist = JSON.parse(localStorage.getItem('guest_wishlist') || '[]');

        if (user && token) {
          fetch(`${RENDER_API}/api/home-visit-cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => setCartCount(Array.isArray(data) ? data.length : guestCart.length))
            .catch(() => setCartCount(guestCart.length));

          fetch(`${RENDER_API}/api/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => setWishlistCount(Array.isArray(data) ? data.length : guestWishlist.length))
            .catch(() => setWishlistCount(guestWishlist.length));
        } else {
          setCartCount(guestCart.length);
          setWishlistCount(guestWishlist.length);
        }
      } catch {
        /* fallback */
      }
    };

    updateCounts();
    const interval = setInterval(updateCounts, 4000);
    return () => clearInterval(interval);
  }, [user, token, location]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Book Visit', href: '/book-visit' },
    { label: 'Collection', href: '/products' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Partner With Us', href: '/partner' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">

        {/* Logo + Brand Name */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group" aria-label="The Fashion Xpress Home">
          <img
            src="/logo.webp"
            alt=""
            aria-hidden="true"
            width="48"
            height="48"
            className="h-11 w-11 sm:h-12 sm:w-12 object-contain rounded-xl shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="leading-tight">
            <span className="font-brand text-xs sm:text-base font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-foreground block">
              The Fashion Xpress
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`text-sm tracking-widest uppercase font-medium transition-colors ${location === link.href ? 'text-primary font-bold' : 'text-muted-foreground hover:text-primary'}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark'
              ? <Sun className="w-5 h-5 text-amber-400" />
              : <Moon className="w-5 h-5 text-blue-500" />}
          </button>

          {/* Wishlist Icon */}
          <Link href="/wishlist" aria-label="View Wishlist" className="p-2 hover:text-primary transition-colors relative" title="Wishlist">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link href="/home-visit-cart" aria-label="View Home Visit Cart" className="p-2 hover:text-primary transition-colors relative" title="Cart">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link href="/account" aria-label="My Account" className="p-2 hover:text-primary transition-colors" title="My Account">
                <User className="w-5 h-5" />
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
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign Out" title="Sign Out">
                <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive" />
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="uppercase tracking-widest text-xs">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Header Action Icons (Always Visible) */}
        <div className="flex md:hidden items-center gap-1 sm:gap-2">

          {/* Mobile Wishlist Icon */}
          <Link href="/wishlist" aria-label="View Wishlist" className="p-2 text-foreground hover:text-primary transition-colors relative" title="Wishlist">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground font-bold text-[9px] flex items-center justify-center rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Mobile Cart Icon */}
          <Link href="/home-visit-cart" aria-label="View Home Visit Cart" className="p-2 text-foreground hover:text-primary transition-colors relative" title="Cart">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground font-bold text-[9px] flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg text-foreground hover:bg-foreground/5 transition-colors"
          >
            {theme === 'dark'
              ? <Sun className="w-5 h-5 text-amber-400" />
              : <Moon className="w-5 h-5 text-blue-500" />}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            className="text-foreground p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-5 flex flex-col gap-4 shadow-2xl">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`text-sm tracking-widest uppercase font-medium block ${location === link.href ? 'text-primary font-bold' : 'text-foreground'}`} onClick={() => setIsMobileMenuOpen(false)}>
              {link.label}
            </Link>
          ))}

          {/* Labeled Quick Links for Mobile Drawer */}
          <div className="pt-4 border-t border-border space-y-3">
            <Link href="/home-visit-cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between py-2 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Home Visit Cart
              </span>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  {cartCount} items
                </span>
              )}
            </Link>

            <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between py-2 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-red-500" />
                Wishlist
              </span>
              {wishlistCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  {wishlistCount} items
                </span>
              )}
            </Link>

            {user ? (
              <>
                <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 py-2 text-sm font-semibold text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  My Account
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 py-2 text-sm font-semibold text-primary">
                    <Sparkles className="w-4 h-4" /> Admin Portal
                  </Link>
                )}
                {user.role === 'merchant' && (
                  <Link href="/merchant" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 py-2 text-sm font-semibold text-primary">
                    <Sparkles className="w-4 h-4" /> Merchant Portal
                  </Link>
                )}
                {user.role === 'executive' && (
                  <Link href="/executive" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5 py-2 text-sm font-semibold text-primary">
                    <Sparkles className="w-4 h-4" /> Executive Portal
                  </Link>
                )}
                <button onClick={() => { setIsMobileMenuOpen(false); logout(); }} className="flex items-center gap-2.5 py-2 text-sm font-semibold text-destructive w-full text-left">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block pt-2">
                <Button className="w-full h-11 tracking-widest uppercase text-xs font-bold">Sign In to Account</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
