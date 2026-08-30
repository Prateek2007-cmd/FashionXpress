import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Star, Clock, Shield, Zap, Home,
  ShoppingBag, Sparkles, ChevronRight, MapPin,
  CheckCircle2, Flame, Award, Users
} from 'lucide-react';

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const PERKS = [
  { icon: Clock,     label: '45-Min Arrival',    sub: 'Executive at your door fast',    color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
  { icon: ShoppingBag, label: 'Try Before You Pay', sub: 'Only pay for what you keep',   color: 'text-primary',     bg: 'bg-primary/10 border-primary/20'     },
  { icon: Shield,    label: 'Zero Risk Booking',  sub: 'No upfront, cancel anytime',     color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { icon: Star,      label: 'Expert Styling',     sub: 'Trained fashion consultants',    color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/20'   },
];

const HOW_IT_WORKS = [
  { n: '01', icon: Home,        title: 'Book a Visit',          desc: 'Fill in your details — name, phone & address. No login or payment required upfront.' },
  { n: '02', icon: Users,       title: 'Executive Confirms',    desc: 'Our Fashion Executive calls to confirm your style preferences, sizes & schedule.' },
  { n: '03', icon: ShoppingBag, title: 'We Bring The Store',    desc: 'Executive picks curated pieces from our partner brands and arrives at your door.' },
  { n: '04', icon: CheckCircle2,title: 'Try & Pay For Keeps',   desc: 'Try everything at home. Pay only for what you love. Return the rest — no questions.' },
];

const STATS = [
  { value: '2,400+', label: 'Happy Customers' },
  { value: '45 Min', label: 'Avg. Arrival Time' },
  { value: '100%',   label: 'Try-Before-Pay' },
  { value: '50+',    label: 'Premium Brands' },
];

export function LandingPage() {

  return (
    <div className="flex flex-col overflow-x-hidden">

      {/* ── MARQUEE STRIP ── */}
      <div className="bg-primary/15 text-primary py-2.5 text-[11px] tracking-[0.2em] font-bold uppercase border-b border-primary/20 overflow-hidden relative flex whitespace-nowrap">
        <div className="animate-[marquee_25s_linear_infinite] flex items-center gap-8">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-8">
              <span className="flex items-center gap-2"><Flame className="w-3 h-3 text-red-400" /><span className="text-red-400">PRICE DROP: 30–60% OFF LIVE NOW</span></span>
              <span className="text-foreground/30">•</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3 h-3" />HOME VISIT SERVICE NOW ACTIVE IN SELECT PINCODES</span>
              <span className="text-foreground/30">•</span>
              <span className="flex items-center gap-2"><Star className="w-3 h-3 text-amber-400" />FASHION AT YOUR DOORSTEP — BOOK NOW, PAY LATER</span>
              <span className="text-foreground/30">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Background image — LCP element: WebP with JPG fallback, eager, high priority */}
        <div className="absolute inset-0 z-0">
          <picture>
            <source srcSet="/hero.webp" type="image/webp" />
            <img
              src="/hero.jpg"
              alt="Luxury home fashion"
              width="1024"
              height="1024"
              className="w-full h-full object-cover opacity-30"
              fetchPriority="high"
              loading="eager"
              decoding="sync"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/50 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>

        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">

          {/* Live badge */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-card/60 backdrop-blur-xl border border-primary/20 rounded-full shadow-xl shadow-primary/5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">Home Visit Service — Now Active</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.2 }} className="text-6xl md:text-8xl font-serif font-black text-foreground leading-[0.95] mb-6">
            The Store
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary animate-[shimmer_3s_ease_infinite] bg-[length:200%_auto]">
              Comes To You.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.35 }} className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Skip the mall. Our Fashion Executive visits your home with a curated selection —
            <span className="text-foreground/90 font-semibold"> try everything, pay only for what you love.</span>
          </motion.p>

          {/* CTA Group */}
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.45 }} className="flex flex-col items-center gap-4 mb-14">

            {/* Primary CTA */}
            <Link href="/book-visit" className="w-full sm:w-auto">
              <button className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-4 px-10 h-18 py-5 rounded-2xl overflow-hidden font-bold text-base tracking-wide transition-all duration-300 shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, hsl(45,90%,48%) 0%, hsl(36,100%,45%) 50%, hsl(45,90%,48%) 100%)' }}>
                {/* Shimmer sweep */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-3 text-black">
                  <span className="bg-black/15 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">ACTIVE</span>
                  <span className="text-lg font-black uppercase tracking-widest">Book Home Visit</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>

            {/* Secondary CTA — min 44px touch target */}
            <Link href="/products">
              <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium group min-h-[44px] px-4 rounded-xl hover:bg-foreground/5">
                <ShoppingBag className="w-4 h-4" />
                Browse the Collection
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>

            {/* Promise note */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-card/30 backdrop-blur-md border border-border rounded-xl text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span><strong className="text-foreground">Our Promise:</strong> Executive arrives within 45–60 minutes of booking</span>
            </div>
          </motion.div>

          {/* Social proof strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.6 }} className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex -space-x-2">
              {['R', 'A', 'P', 'S', 'M'].map((l, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 border-2 border-background flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg">{l}</div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex gap-0.5 mb-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}</div>
              <p className="text-xs text-muted-foreground"><span className="text-foreground font-bold">2,400+</span> happy customers this month</p>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="text-xs text-muted-foreground">
              <span className="text-foreground font-bold">50+</span> premium brands available
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-white/50" />
          <span className="text-[9px] tracking-[0.3em] text-foreground/50 uppercase">Scroll</span>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-8 border-y border-border bg-card/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-border">
            {STATS.map(({ value, label }, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 * i }} className="text-center px-4 py-2">
                <div className="text-2xl md:text-3xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300 mb-1">{value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERKS GRID ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }} className="text-primary text-xs uppercase tracking-[0.25em] font-bold mb-3">Why Fashion Xpress</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }} className="text-4xl md:text-5xl font-serif text-foreground mb-4">Luxury, At Your Doorstep</motion.h2>
            <div className="w-12 h-px bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERKS.map(({ icon: Icon, label, sub, color, bg }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`group relative p-7 rounded-3xl bg-card/30 border border-border hover:border-white/15 hover:-translate-y-2 transition-all duration-400 shadow-xl overflow-hidden cursor-default`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className={`w-14 h-14 rounded-2xl ${bg} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <h3 className="text-foreground font-serif text-lg font-bold mb-2">{label}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-card/15 border-y border-border relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }} className="text-primary text-xs uppercase tracking-[0.25em] font-bold mb-3">The Experience</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }} className="text-4xl md:text-5xl font-serif text-foreground mb-4">How It Works</motion.h2>
            <div className="w-12 h-px bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ n, icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                className="relative group"
              >
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(100%-8px)] w-full h-px border-t border-dashed border-border z-0" />
                )}

                <div className="relative z-10 p-7 rounded-3xl bg-card/40 border border-border hover:border-primary/20 transition-all duration-300 shadow-xl group-hover:shadow-primary/5 group-hover:shadow-2xl h-full">
                  {/* Step number watermark */}
                  <div className="absolute top-5 right-6 text-7xl font-serif font-black text-foreground/[0.04] leading-none select-none">{n}</div>

                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-foreground font-serif text-lg font-bold mb-3">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE, delay: 0.4 }} className="text-center mt-16">
            <Link href="/book-visit">
              <Button size="lg" className="h-14 px-10 text-sm tracking-[0.15em] uppercase font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-3 mx-auto">
                <Sparkles className="w-4 h-4" />
                Book My Home Visit
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
