import React from 'react';
import { CustomerNavbar } from './CustomerNavbar';
import { CustomerFooter } from './CustomerFooter';
import { MessageCircle } from 'lucide-react';

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <CustomerNavbar />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <CustomerFooter />

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/916304847223?text=Hello%20Fashion%20Xpress%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services." 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-110 transition-transform hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
