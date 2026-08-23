import React from 'react';
import { ShieldCheck, FileText, Lock } from 'lucide-react';

interface LegalPageProps {
  type?: 'privacy' | 'terms';
}

export function LegalPage({ type = 'terms' }: LegalPageProps) {
  const isPrivacy = type === 'privacy';

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-card/80 to-transparent border-b border-white/5 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-[0.2em] font-bold mb-4">
            {isPrivacy ? <Lock className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            Legal & Compliance
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-2">
            {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
          </h1>
          <p className="text-muted-foreground text-sm">Last updated: August 2026</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 prose prose-invert max-w-none text-muted-foreground text-sm leading-relaxed space-y-8">
        {isPrivacy ? (
          <>
            <div className="bg-card/40 border border-white/5 rounded-2xl p-8 space-y-4">
              <h2 className="text-xl font-serif text-white">1. Information We Collect</h2>
              <p>
                We collect personal information that you provide when registering, booking a Home Visit, or purchasing products. This includes your full name, phone number, physical delivery address, sizing preferences, and order history.
              </p>
            </div>

            <div className="bg-card/40 border border-white/5 rounded-2xl p-8 space-y-4">
              <h2 className="text-xl font-serif text-white">2. How We Use Your Data</h2>
              <p>
                Your contact details are strictly utilized to coordinate your doorstep styling appointments, dispatch certified Fashion Executives, verify orders via OTP, and facilitate seamless on-spot transactions.
              </p>
            </div>

            <div className="bg-card/40 border border-white/5 rounded-2xl p-8 space-y-4">
              <h2 className="text-xl font-serif text-white">3. Doorstep Privacy & Safety</h2>
              <p>
                Your home address and contact details are disclosed solely to the assigned and background-verified Fashion Executive for the duration of the visit. We never sell or rent your personal information to third parties.
              </p>
            </div>

            <div className="bg-card/40 border border-white/5 rounded-2xl p-8 space-y-4">
              <h2 className="text-xl font-serif text-white">4. Payment Security</h2>
              <p>
                All on-spot digital payments (UPI / Credit Card / Debit Card) are processed through encrypted, RBI-compliant payment gateway interfaces. No card credentials or banking pins are stored on our servers.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-card/40 border border-white/5 rounded-2xl p-8 space-y-4">
              <h2 className="text-xl font-serif text-white">1. Home Visit & Trial Policy</h2>
              <p>
                The Fashion Xpress provides free doorstep consultation and trial sessions. Booking an appointment carries zero obligation to purchase. However, customers are requested to ensure reasonable care of garments during home fitting sessions.
              </p>
            </div>

            <div className="bg-card/40 border border-white/5 rounded-2xl p-8 space-y-4">
              <h2 className="text-xl font-serif text-white">2. Product Authenticity & Pricing</h2>
              <p>
                All items showcased on The Fashion Xpress are 100% genuine and sourced directly from partner boutiques and master craftspeople. Prices displayed online match on-spot invoice prices with applicable taxes included.
              </p>
            </div>

            <div className="bg-card/40 border border-white/5 rounded-2xl p-8 space-y-4">
              <h2 className="text-xl font-serif text-white">3. On-Spot Try & Selection Policy</h2>
              <p>
                Customers are encouraged to try all garments during the home visit. You only pay for items you choose to keep before the executive departs. Unselected pieces are taken back immediately at no cost.
              </p>
            </div>

            <div className="bg-card/40 border border-white/5 rounded-2xl p-8 space-y-4">
              <h2 className="text-xl font-serif text-white">4. Service Availability</h2>
              <p>
                Doorstep styling visits are subject to executive availability and service radius in designated pin codes. Our promise is arrival within 45–60 minutes of the confirmed time slot.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
