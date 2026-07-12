import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Truck, Shield, Ruler } from 'lucide-react';
import heroBg from '@assets/generated_images/hero.jpg';
import collectionMen from '@assets/generated_images/collection_men.jpg';
import collectionWomen from '@assets/generated_images/collection_women.jpg';
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

      {/* COLLECTIONS */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/products?category=men" className="group relative h-[600px] overflow-hidden rounded-2xl block">
              <img src={collectionMen} alt="Men's Collection" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
                <h3 className="text-4xl font-serif text-white mb-2">Men's Collection</h3>
                <div className="flex items-center text-primary gap-2 font-medium tracking-widest uppercase text-sm">
                  View Pieces <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
            <div className="grid grid-rows-2 gap-8 h-[600px]">
              <Link href="/products?category=women" className="group relative overflow-hidden rounded-2xl block">
                <img src={collectionWomen} alt="Women's Collection" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                  <h3 className="text-3xl font-serif text-white mb-2">Women's Collection</h3>
                  <div className="flex items-center text-primary gap-2 font-medium tracking-widest uppercase text-sm">
                    View Pieces <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </Link>
              <div className="relative overflow-hidden rounded-2xl bg-card border border-white/5 p-8 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-white mb-4">Curated Just For You</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Our expert stylists handpick recommendations based on your unique profile and measurements.
                </p>
                <Link href="/register">
                  <Button variant="outline" className="tracking-widest uppercase text-xs">Create Profile</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERT CONSULTATION */}
      <section className="py-24 bg-card/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 relative rounded-2xl overflow-hidden h-[500px]"
          >
            <img src={consultation} alt="Fashion Consultation" className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-4 border-primary/20 rounded-2xl m-4 pointer-events-none"></div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Impeccable Taste.<br/>Personal Attention.</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              When you book a Home Visit, you're not just getting clothes delivered. You're receiving a dedicated Fashion Executive trained in styling and fit, ready to help you discover your perfect look in your own space.
            </p>
            <ul className="space-y-6">
              {[
                { icon: Truck, text: "White-glove delivery to your doorstep" },
                { icon: Ruler, text: "Professional fit and sizing advice" },
                { icon: Shield, text: "No-pressure environment. Keep only what you love." }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white">{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link href="/about">
                <Button variant="link" className="px-0 text-white hover:text-primary">Meet Our Executives <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
