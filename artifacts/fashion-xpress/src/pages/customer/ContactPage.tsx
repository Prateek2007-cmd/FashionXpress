import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export function ContactPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      toast({ title: "Incomplete fields", description: "Please fill in your name, phone number, and message.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast({ title: "Message Sent!", description: "Our concierge team will reach out to you shortly." });
    }, 800);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-card/80 to-transparent border-b border-white/5 py-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-[0.2em] font-bold mb-6">
            <Mail className="w-3.5 h-3.5" />
            Concierge & Support
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-white mb-4">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">Touch</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Whether you need personal styling advice, assistance with your Home Visit, or partnership inquiries, our team is here for you.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Info Column */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif text-white mb-3">Reach Our Styling Concierge</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connect with our dedicated luxury customer relations team for instantaneous assistance or custom garment requests.
              </p>
            </div>

            <div className="space-y-4">
              <a
                href="https://wa.me/916304847223"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Instant Support</div>
                  <div className="text-white font-medium text-base">+91 63048 47223 (WhatsApp Concierge)</div>
                </div>
              </a>

              <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Direct Call Support</div>
                  <div className="text-white font-medium text-base">+91 63048 47223 (Mon–Sun, 9am–9pm)</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email Enquiries</div>
                  <div className="text-white font-medium text-base">concierge@fashionxpress.com</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Flagship Experience Center</div>
                  <div className="text-white font-medium text-base">6-7 Ground Floor, Bhutapur, Adilabad, Telangana 504001</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {submitted ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto text-green-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif text-white">Thank You!</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Your message has been received. Our concierge executive will contact you shortly.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-4 rounded-xl">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-xl font-serif text-white mb-1">Send a Message</h3>
                  <p className="text-xs text-muted-foreground">Fill in your request below and we will get back to you promptly.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Your Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone Number</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="10-digit number"
                      maxLength={10}
                      inputMode="numeric"
                      className="h-12 bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email Address</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="h-12 bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Subject / Purpose</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Special Wedding Fitting / Order Enquiry"
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Your Message</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your enquiry, preferred timing, or special wardrobe preferences..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 font-bold tracking-widest uppercase text-xs rounded-xl shadow-lg shadow-primary/20"
                >
                  {loading ? 'Sending Message…' : 'Submit Enquiry →'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
