import React from 'react';
import { Link } from 'wouter';
import {
  Clock, Shield, Star, ShoppingBag, Sparkles,
  CheckCircle2, ArrowRight, UserCheck, HeartHandshake, Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Explore & Book Online',
      desc: 'Browse our curated collection of luxury sarees, festive attire, and designer wear. Schedule your free Home Visit with your preferred date, location, and style preferences in under 60 seconds.',
      icon: ShoppingBag,
    },
    {
      step: '02',
      title: 'Stylist Preparation & Confirmation',
      desc: 'Our certified Fashion Executive contacts you to personalize the selection, ensuring exact sizes, color palettes, and complementary options are packed directly from our merchant boutiques.',
      icon: UserCheck,
    },
    {
      step: '03',
      title: 'Doorstep Arrival in 45–60 Mins',
      desc: 'Your dedicated Executive arrives promptly at your doorstep equipped with a full portable wardrobe rack, mirror setups, and sizing accessories for a private fitting session.',
      icon: Truck,
    },
    {
      step: '04',
      title: 'Private Home Trial & Consultation',
      desc: 'Try on all garments in the absolute comfort and privacy of your home. Mix and match with your own jewelry, consult with family members, and receive expert styling advice.',
      icon: Star,
    },
    {
      step: '05',
      title: 'Pay Only for What You Love',
      desc: 'No mandatory purchases or upfront fees. Keep only the pieces that fit and flatter you perfectly. Pay on the spot via UPI, Card, or Cash. We take back the rest hassle-free.',
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-card/80 to-transparent border-b border-white/5 py-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-[0.2em] font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            The Luxury Experience
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground mb-4">
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">Works</span>
          </h1>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Experience the future of boutique shopping—where the entire showroom visits your home with zero pressure and zero upfront cost.
          </p>
        </div>
      </section>

      {/* Detailed Steps */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="space-y-12">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative flex flex-col md:flex-row items-start gap-8 bg-card/40 border border-white/5 rounded-3xl p-8 md:p-10 hover:border-primary/20 transition-all duration-300 shadow-xl group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-black transition-colors">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      STEP {item.step}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Box */}
        <div className="mt-16 text-center bg-gradient-to-br from-primary/10 via-card to-purple-500/5 border border-primary/20 rounded-3xl p-10 md:p-14 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">Ready to Experience Personal Doorstep Shopping?</h2>
          <p className="text-foreground/70 text-base max-w-lg mx-auto mb-8">
            Book your consultation now. Our Fashion Executive will arrive with curated pieces within 45–60 minutes.
          </p>
          <Link href="/book-visit">
            <Button size="lg" className="h-14 px-10 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-primary/20">
              Schedule Your Visit <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
