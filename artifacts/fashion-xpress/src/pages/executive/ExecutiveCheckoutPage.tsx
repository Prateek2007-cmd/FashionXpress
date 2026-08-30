import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, CheckCircle2, RotateCcw, CreditCard, QrCode, Banknote,
  Sparkles, MessageCircle, ArrowLeft, Package, User, Phone, Check,
  AlertCircle, Receipt, ExternalLink, Share2, Star
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/api-config';

interface ProductItem {
  id: number; // booking_product_id
  productId: number;
  name: string;
  sku: string;
  sellingPrice: number;
  brandName: string;
  image: string | null;
  status: 'pending' | 'sold' | 'returned';
}

interface VisitLead {
  id: number;
  customerName: string;
  phone: string;
  addressText: string;
  pincode: string | null;
  status: string;
  products: any[];
}

export function ExecutiveCheckoutPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Read bookingId from URL query
  const queryParams = new URLSearchParams(window.location.search);
  const initialBookingId = queryParams.get('bookingId') ? Number(queryParams.get('bookingId')) : null;

  const [leads, setLeads] = useState<VisitLead[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(initialBookingId);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'card'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<{
    invoiceNumber: string;
    total: number;
    paymentMethod: string;
    soldItems: ProductItem[];
  } | null>(null);

  const API_BASE = getApiBaseUrl();

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/executives/me/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load leads');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setLeads(list);

      if (list.length > 0) {
        const current = selectedBookingId ? list.find(l => l.id === selectedBookingId) : list[0];
        if (current) {
          setSelectedBookingId(current.id);
          setupItems(current);
        }
      }
    } catch (err: any) {
      toast({ title: 'Failed to load leads', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const setupItems = (lead: VisitLead) => {
    const formatted: ProductItem[] = lead.products.map((bp: any) => ({
      id: bp.id,
      productId: bp.productId,
      name: bp.product?.name || 'Garment Piece',
      sku: bp.product?.sku || '',
      sellingPrice: bp.priceAtSale || bp.product?.sellingPrice || 0,
      brandName: bp.product?.brandName || 'Devi Fashion',
      image: bp.product?.images?.[0] || null,
      status: bp.status === 'sold' ? 'sold' : 'pending',
    }));
    setItems(formatted);
  };

  useEffect(() => {
    if (token) fetchLeads();
  }, [token]);

  const handleSelectBooking = (bId: number) => {
    setSelectedBookingId(bId);
    setCompletedInvoice(null);
    const lead = leads.find(l => l.id === bId);
    if (lead) setupItems(lead);
  };

  const toggleItemStatus = (itemId: number) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id === itemId) {
          const nextStatus = it.status === 'sold' ? 'returned' : 'sold';
          return { ...it, status: nextStatus };
        }
        return it;
      })
    );
  };

  const markAllSold = () => {
    setItems(prev => prev.map(it => ({ ...it, status: 'sold' })));
  };

  const currentLead = leads.find(l => l.id === selectedBookingId);
  const soldItems = items.filter(it => it.status === 'sold');
  const returnedItems = items.filter(it => it.status !== 'sold');
  const totalPayable = soldItems.reduce((s, it) => s + it.sellingPrice, 0);

  const handleCompleteCheckout = async () => {
    if (!selectedBookingId) return;
    setIsProcessing(true);

    const payload = {
      paymentMethod,
      items: items.map(it => ({
        id: it.id,
        status: it.status === 'sold' ? 'sold' : 'returned',
        priceAtSale: it.sellingPrice,
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/api/executives/me/visits/${selectedBookingId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Checkout processing failed');
      const data = await res.json();

      setCompletedInvoice({
        invoiceNumber: data.invoiceNumber,
        total: totalPayable,
        paymentMethod,
        soldItems,
      });

      toast({
        title: '🎉 Payment & Visit Completed!',
        description: `Collected ${formatPrice(totalPayable)} via ${paymentMethod.toUpperCase()}`,
      });
    } catch (err: any) {
      toast({ title: 'Checkout Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate WhatsApp formatted message
  const getWhatsAppMessage = () => {
    if (!currentLead || !completedInvoice) return '';
    const soldList = completedInvoice.soldItems
      .map((it, idx) => `${idx + 1}. *${it.name}* (${it.brandName}) — ${formatPrice(it.sellingPrice)}`)
      .join('\n');

    return (
      `✨ *THE FASHION XPRESS — DOORSTEP TRIAL RECEIPT* ✨\n\n` +
      `Dear *${currentLead.customerName}*,\n` +
      `Thank you for shopping with The Fashion Xpress Home Visit Service!\n\n` +
      `🧾 *Invoice Number:* ${completedInvoice.invoiceNumber}\n` +
      `🔖 *Booking ID:* #VISIT-${currentLead.id}\n\n` +
      `🛍️ *Purchased Pieces:*\n${soldList}\n\n` +
      `💳 *Total Paid:* *${formatPrice(completedInvoice.total)}* (${completedInvoice.paymentMethod.toUpperCase()})\n` +
      `✅ *Payment Status:* Verified & Received\n\n` +
      `⭐ *How was your styling session with ${user?.name || 'our Executive'}?*\n` +
      `We’d love your feedback! Reply here or visit us again anytime at https://thefashionxpress.com.\n\n` +
      `_The Fashion Xpress — The Store Comes To You._`
    );
  };

  const openWhatsApp = () => {
    if (!currentLead) return;
    const cleanPhone = currentLead.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/executive')}
            className="text-muted-foreground hover:text-foreground gap-1 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> Leads
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-foreground">On-Visit Doorstep Checkout</h1>
            <p className="text-muted-foreground text-xs">
              Select garments kept by customer, compute bill, and collect payment.
            </p>
          </div>
        </div>

        {/* Lead Picker */}
        {leads.length > 1 && !completedInvoice && (
          <select
            value={selectedBookingId || ''}
            onChange={(e) => handleSelectBooking(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.customerName} (#{l.id})
              </option>
            ))}
          </select>
        )}
      </div>

      {completedInvoice ? (
        /* ✅ Completed Invoice & WhatsApp Dispatch View */
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center max-w-lg mx-auto space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-primary font-bold block mb-1">
              {completedInvoice.invoiceNumber}
            </span>
            <h2 className="text-2xl font-serif font-bold text-foreground">Payment Received</h2>
            <div className="text-3xl font-mono font-extrabold text-foreground mt-2">
              {formatPrice(completedInvoice.total)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paid via <strong className="uppercase text-foreground">{completedInvoice.paymentMethod}</strong> by {currentLead?.customerName}
            </p>
          </div>

          <div className="bg-background border border-border rounded-xl p-4 text-left space-y-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block">
              Purchased Garments ({completedInvoice.soldItems.length})
            </span>
            {completedInvoice.soldItems.map((it, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-foreground">{it.name}</span>
                <span className="font-mono font-bold text-foreground">{formatPrice(it.sellingPrice)}</span>
              </div>
            ))}
          </div>

          {/* 📲 1-Click WhatsApp Invoice Dispatch */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={openWhatsApp}
              className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-bold tracking-wider uppercase text-xs rounded-xl shadow-lg shadow-green-600/20 gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Send Digital Invoice on WhatsApp
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setCompletedInvoice(null);
                fetchLeads();
              }}
              className="w-full h-10 text-xs"
            >
              Back to Assigned Leads
            </Button>
          </div>
        </div>
      ) : currentLead ? (
        /* 🛍️ Active Checkout & Selection Screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Garment Selector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Trial Suitcase Items</h2>
                <p className="text-[11px] text-muted-foreground">Toggle items customer decided to buy.</p>
              </div>
              <Button size="sm" variant="outline" onClick={markAllSold} className="text-xs h-8">
                Select All Kept
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const isSold = item.status === 'sold';
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemStatus(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSold
                        ? 'bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-md'
                        : 'bg-card border-border hover:border-border/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                          isSold ? 'bg-emerald-500 border-emerald-500 text-black font-bold' : 'border-muted-foreground'
                        }`}
                      >
                        {isSold && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="w-12 h-14 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.brandName} · {item.sku}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-bold text-foreground">{formatPrice(item.sellingPrice)}</div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isSold ? 'text-emerald-400' : 'text-muted-foreground'
                        }`}
                      >
                        {isSold ? '✓ Purchased' : '↩ Return'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Billing & Payment Modes */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xl sticky top-6">

              {/* Customer summary */}
              <div className="pb-3 border-b border-border">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block">
                  Customer & Location
                </span>
                <div className="font-bold text-foreground text-base mt-0.5">{currentLead.customerName}</div>
                <div className="text-xs text-muted-foreground font-mono">{currentLead.phone}</div>
                <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{currentLead.addressText}</div>
              </div>

              {/* Bill Summary */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block">
                  Bill Summary
                </span>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Items Selected to Keep:</span>
                  <span className="font-bold text-foreground">{soldItems.length} pcs</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Items for Collection Return:</span>
                  <span className="font-bold text-foreground">{returnedItems.length} pcs</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fitting & Home Visit Fee:</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <span className="text-sm font-bold text-foreground uppercase tracking-wider">Total Payable:</span>
                  <span className="text-2xl font-mono font-extrabold text-primary">{formatPrice(totalPayable)}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block">
                  Payment Mode
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs">UPI QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Card / POS</span>
                  </button>
                </div>
              </div>

              {/* Dynamic UPI QR Code Preview */}
              {paymentMethod === 'upi' && totalPayable > 0 && (
                <div className="p-4 rounded-xl bg-background border border-border text-center space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block">
                    Scan with any UPI App (GPay / PhonePe / Paytm)
                  </span>
                  <div className="inline-block p-2 bg-white rounded-xl shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        `upi://pay?pa=thefashionxpress@okaxis&pn=TheFashionXpress&am=${totalPayable}&cu=INR`
                      )}`}
                      alt="UPI QR Code"
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    UPI ID: <strong>thefashionxpress@okaxis</strong>
                  </p>
                </div>
              )}

              {/* Complete & Submit Button */}
              <Button
                onClick={handleCompleteCheckout}
                disabled={isProcessing || totalPayable === 0}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest uppercase text-xs rounded-xl shadow-lg shadow-primary/20 gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Complete & Collect {formatPrice(totalPayable)}
                  </>
                )}
              </Button>

            </div>
          </div>

        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          No active visits available for checkout.
        </div>
      )}

    </div>
  );
}
