import React, { useState } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  HelpCircle, ChevronDown, Sparkles, Phone, MessageCircle,
  ShieldCheck, Clock, ShoppingBag, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: "Home Visit & Trials",
    question: "How does the Home Visit service work?",
    answer: "You simply schedule a visit with your contact and address details. A dedicated Fashion Executive will bring a curated collection directly to your home within 45–60 minutes. You can try on all items, style them, and only pay for the pieces you decide to keep."
  },
  {
    category: "Home Visit & Trials",
    question: "Is there any upfront fee or visit charge?",
    answer: "No, booking a Home Visit is completely free with zero upfront charges. There is no minimum purchase obligation—if you don't love any piece, our Executive will take everything back with no questions asked."
  },
  {
    category: "Home Visit & Trials",
    question: "How long can I try the garments during the visit?",
    answer: "Our Fashion Executives offer up to 45 minutes of consultation and fitting time per session, allowing you to comfortably try on pieces, match accessories, and consult with family."
  },
  {
    category: "Orders & Payments",
    question: "What payment methods are accepted?",
    answer: "You can pay on the spot via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, or Cash directly to the Executive once you choose the items you wish to purchase."
  },
  {
    category: "Orders & Payments",
    question: "Can I request specific sizes or color options in advance?",
    answer: "Yes! When placing your visit or browsing our Collection online, you can add specific pieces and sizes to your trial bag. Our executive will also carry adjacent sizes (e.g. M & L) to ensure the perfect fit."
  },
  {
    category: "Quality & Authenticity",
    question: "Are all products original and brand-certified?",
    answer: "100% yes. Every item featured on The Fashion Xpress comes directly from verified luxury boutiques, traditional handloom master weavers, and certified merchant partners with brand tags intact."
  },
  {
    category: "Safety & Security",
    question: "How are the Fashion Executives verified?",
    answer: "All Fashion Executives undergo comprehensive background checks, identity verification, and professional etiquette training to guarantee complete safety, privacy, and peace of mind during your home visit."
  }
];

export function FaqPage() {
  useSEO({
    title: 'FAQs — Home Fashion Visits in Adilabad | The Fashion Xpress',
    description: 'Got questions about home fashion trials in Adilabad? Find answers about bookings, payments, returns, and how The Fashion Xpress brings designer outfits to your door.',
    path: '/faq',
  });
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = ['All', 'Home Visit & Trials', 'Orders & Payments', 'Quality & Authenticity', 'Safety & Security'];

  const filteredFaqs = activeCategory === 'All'
    ? FAQS
    : FAQS.filter(f => f.category === activeCategory);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-card/80 to-transparent border-b border-white/5 py-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-[0.2em] font-bold mb-6">
            <HelpCircle className="w-3.5 h-3.5" />
            Support & Knowledge Base
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">Questions</span>
          </h1>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Everything you need to know about our personal home visits, try-before-you-buy service, and luxury fashion experience.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-card/50 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/15"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif text-lg text-foreground"
                >
                  <span className="font-semibold">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-muted-foreground text-sm leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick CTA Block */}
        <div className="mt-16 bg-gradient-to-br from-primary/10 via-card to-purple-500/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center shadow-xl">
          <h3 className="text-2xl font-serif text-foreground mb-2">Still have questions?</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Our luxury styling concierge is available 7 days a week to assist you with special requests.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://wa.me/916304847223"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 h-12 bg-green-600 hover:bg-green-700 text-foreground rounded-xl font-semibold text-sm transition-colors shadow-lg"
            >
              <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
            </a>
            <Link href="/book-visit">
              <Button size="lg" className="h-12 px-6 rounded-xl font-semibold text-sm">
                Book a Visit Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
