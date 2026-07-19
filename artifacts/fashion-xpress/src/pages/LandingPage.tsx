import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Truck, Shield, Ruler } from 'lucide-react';
import heroBg from '@assets/generated_images/hero.jpg';

export function LandingPage() {
  const [visitorCount, setVisitorCount] = React.useState(() => {
    const saved = localStorage.getItem('visitor_count');
    if (saved) return parseInt(saved, 10);
    // Start with a premium base number of visitors
    return Math.floor(15340 + Math.random() * 100);
  });
  const [lastUpdated, setLastUpdated] = React.useState('');

  React.useEffect(() => {
    localStorage.setItem('visitor_count', visitorCount.toString());
    
    const updateTime = () => {
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();

    const interval = setInterval(() => {
      setVisitorCount(prev => {
        const next = prev + Math.floor(Math.random() * 2) + 1; // Realtime simulated traffic increments
        localStorage.setItem('visitor_count', next.toString());
        return next;
      });
      updateTime();
    }, 5000);

    return () => clearInterval(interval);
  }, [visitorCount]);

  return (
    <div className="flex flex-col">
      {/* Top Banner Marquee */}
      <div className="bg-primary/20 text-primary py-2 text-xs tracking-widest font-semibold uppercase border-b border-primary/30 overflow-hidden relative flex whitespace-nowrap">
        <div className="animate-[marquee_20s_linear_infinite]">
          <span className="text-red-500 font-bold">PRICE DROP: 30-60% OFF SALE IS ON LIVE</span> &nbsp;&nbsp;&bull;&nbsp;&nbsp; COMING SOON: XPRESS SERVICES AT YOUR FASHION STORE. AT YOUR DOOR. &nbsp;&nbsp;&bull;&nbsp;&nbsp; <span className="text-red-500 font-bold">PRICE DROP: 30-60% OFF SALE IS ON LIVE</span> &nbsp;&nbsp;&bull;&nbsp;&nbsp; COMING SOON: XPRESS SERVICES AT YOUR FASHION STORE. AT YOUR DOOR.
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Luxury living room with fashion rack" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-4 leading-tight">
              The Store <br/><span className="text-primary italic">Comes To You.</span>
            </h1>
            <div className="mb-8 font-serif text-2xl md:text-3xl text-amber-400 font-black tracking-widest uppercase animate-pulse">
              ★ HOME VISIT SERVICE HAS NOT YET STARTED — COMING SOON ★
            </div>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 font-light">
              Enjoy luxury shopping from the comfort of your home. Browse our collection, choose your favorite pieces, and our Fashion Executive will bring them directly to you.
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <Link href="/book-visit" className="w-full sm:w-[480px]">
                <Button size="lg" className="w-full text-base h-16 tracking-widest uppercase font-semibold text-white bg-card/80 hover:bg-card border border-amber-500/40 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3">
                  <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded text-xs font-bold border border-amber-500/30">COMING SOON</span>
                  <span>Home Visit Service</span>
                </Button>
              </Link>
              <div className="text-sm text-muted-foreground font-medium tracking-wide bg-card/40 border border-white/10 rounded-lg px-6 py-2">
                ✨ <strong>Note:</strong> Home Visit service will begin soon in select pin codes.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-card/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">How it Works</h2>
            <div className="w-16 h-[1px] bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Book a Visit",
                desc: "Choose a time slot and date that works for you. No logins or upfront payments required."
              },
              {
                step: "02",
                title: "Executive Calls You",
                desc: "Our Fashion Executive will reach out to confirm your style preferences, sizes, and schedule details."
              },
              {
                step: "03",
                title: "Store Pickup & Delivery",
                desc: "The Executive collects items from the store and visits your doorstep for a personalized fitting session."
              },
              {
                step: "04",
                title: "Try & Pay",
                desc: "Try all items in your own space. Only pay for the products you decide to keep. No obligations."
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-2xl bg-card border border-white/5 hover:border-primary/30 transition-colors"
              >
                <div className="text-6xl font-serif text-white/5 absolute top-4 right-6">{item.step}</div>
                <h3 className="text-xl font-serif text-white mb-4 mt-8">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Visitor Tracker Section */}
      <section className="py-12 border-t border-white/5 bg-gradient-to-b from-black/60 to-black/95">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-4 rounded-2xl bg-white/[0.02] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.04)] backdrop-blur-md relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
            {/* Soft glow effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"></div>
            
            <div className="flex items-center gap-3 z-10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
                Total Visitors Till Now: 
                <strong className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white font-mono text-lg ml-2">
                  {visitorCount.toLocaleString()}
                </strong>
              </span>
            </div>
            <span className="hidden sm:inline text-white/10 z-10">|</span>
            <span className="text-xs text-muted-foreground tracking-wider font-light z-10">
              Last updated at <span className="font-mono text-white/95 font-medium">{lastUpdated}</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
