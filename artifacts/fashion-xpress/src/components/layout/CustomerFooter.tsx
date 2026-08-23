import React from 'react';
import { Link } from 'wouter';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export function CustomerFooter() {
  return (
    <footer className="bg-black border-t border-white/5 py-16 px-6 mt-20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="TFX" className="h-14 w-auto object-contain" style={{ filter: 'invert(1) grayscale(1)', mixBlendMode: 'screen' }} />
            <span className="font-serif font-bold text-lg md:text-xl tracking-widest uppercase text-white">THE FASHION XPRESS</span>
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            The store comes to you. Experience premium luxury fashion consultations in the comfort of your own home.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:text-primary hover:border-primary transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:text-primary hover:border-primary transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:text-primary hover:border-primary transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6 text-white">Explore</h4>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li><Link href="/products?category=men" className="hover:text-primary transition-colors">Men's Collection</Link></li>
            <li><Link href="/products?category=women" className="hover:text-primary transition-colors">Women's Collection</Link></li>
            <li><Link href="/products?category=accessories" className="hover:text-primary transition-colors">Accessories</Link></li>
            <li><Link href="/products" className="hover:text-primary transition-colors">New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6 text-white">Services</h4>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li><Link href="/book-visit" className="hover:text-primary transition-colors">Book a Home Visit</Link></li>
            <li><Link href="/how-it-works" className="hover:text-primary transition-colors">How it Works</Link></li>
            <li><Link href="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6 text-white">Contact</h4>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li>concierge@fashionxpress.com</li>
            <li>+91 98765 43210</li>
            <li>Level 42, Luxury Tower, UB City</li>
            <li>Bengaluru, Karnataka 560001</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} The Fashion Xpress. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
