import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Truck, Shield, Ruler } from 'lucide-react';
import heroBg from '@assets/generated_images/hero.jpg';

import consultation from '@assets/generated_images/consultation.jpg';

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
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
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/50 bg-primary/10 text-primary text-sm font-medium tracking-wide uppercase backdrop-blur-sm">
              Coming Soon: Xpress Stitching Services at your door step
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
              The Store <br/><span className="text-primary italic">Comes To You.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 font-light">
              Experience the pinnacle of luxury shopping. Browse our curated catalog, select your pieces, and our Fashion Executive will bring the boutique experience directly to your home.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 tracking-widest uppercase">
                  Explore Collection
                </Button>
              </Link>
              <Link href="/book-visit">
                <Button variant="glass" size="lg" className="w-full sm:w-auto text-base h-14 px-8 tracking-widest uppercase">
                  Book a Visit
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-card/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">The Experience</h2>
            <div className="w-16 h-[1px] bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Curate Your Selection",
                desc: "Browse our exclusive catalog and add pieces to your Home Visit Cart. No payment required upfront."
              },
              {
                step: "02",
                title: "Book Your Visit",
                desc: "Schedule a time that suits you. Provide your preferences, and our stylists will bring additional recommendations."
              },
              {
                step: "03",
                title: "Try & Keep",
                desc: "Try the garments in your own mirrors, with your own lighting. Only pay for the pieces you fall in love with."
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative p-8 rounded-2xl bg-card border border-white/5 hover:border-primary/30 transition-colors"
              >
                <div className="text-6xl font-serif text-white/5 absolute top-4 right-6">{item.step}</div>
                <h3 className="text-xl font-serif text-white mb-4 mt-8">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>





    </div>
  );
}
