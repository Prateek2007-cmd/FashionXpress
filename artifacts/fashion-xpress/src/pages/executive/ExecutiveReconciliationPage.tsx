import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Loader2, Banknote, QrCode, CreditCard, RotateCcw, Package,
  CheckCircle2, ShoppingBag, TrendingUp, Calendar, User, ArrowRight
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/api-config';

interface ReconciliationData {
  todayCash: number;
  todayUpi: number;
  todayCard: number;
  todayTotal: number;
  totalCompletedVisits: number;
  returnedProducts: Array<{
    id: number;
    bookingId: number;
    customerName: string;
    customerPhone: string;
    productName: string;
    sku: string;
    image: string | null;
    price: number;
    brandName: string;
    status: string;
  }>;
  soldProducts: Array<{
    id: number;
    bookingId: number;
    customerName: string;
    customerPhone: string;
    productName: string;
    sku: string;
    image: string | null;
    price: number;
    brandName: string;
    status: string;
  }>;
}

export function ExecutiveReconciliationPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<ReconciliationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'returns' | 'sold'>('returns');

  const API_BASE = getApiBaseUrl();

  const fetchReconciliation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/executives/me/reconciliation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load reconciliation data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast({ title: 'Failed to load reconciliation data', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReconciliation();
  }, [token]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Daily Cash & Returns Reconciliation</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            End-of-day summary: Cash in hand to deposit, digital collections, and trial garments to hand over.
          </p>
        </div>
        <Button onClick={fetchReconciliation} variant="outline" size="sm" className="text-xs">
          Refresh Data
        </Button>
      </div>

      {/* Financial Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Cash in Hand */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Cash in Hand</span>
            <Banknote className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
            {formatPrice(data.todayCash)}
          </div>
          <p className="text-[11px] text-muted-foreground">Physical cash to deposit at hub</p>
        </div>

        {/* UPI Payments */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-primary">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">UPI Received</span>
            <QrCode className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
            {formatPrice(data.todayUpi)}
          </div>
          <p className="text-[11px] text-muted-foreground">Settled directly to bank</p>
        </div>

        {/* Total GMV Sales */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-yellow-400">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Total Sales GMV</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
            {formatPrice(data.todayTotal)}
          </div>
          <p className="text-[11px] text-muted-foreground">Overall revenue generated</p>
        </div>

        {/* Completed Visits */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Completed Visits</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
            {data.totalCompletedVisits}
          </div>
          <p className="text-[11px] text-muted-foreground">Successful customer fittings</p>
        </div>

      </div>

      {/* Tabs: Return Collection Inventory vs Sold Garments */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold tracking-wide uppercase transition-colors relative ${
              activeTab === 'returns' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Collection Returns for Merchant Handover ({data.returnedProducts.length})</span>
            {activeTab === 'returns' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('sold')}
            className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold tracking-wide uppercase transition-colors relative ${
              activeTab === 'sold' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sold Pieces ({data.soldProducts.length})</span>
            {activeTab === 'sold' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'returns' ? (
          /* 📦 Returns Handover Table */
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Trial garments collected back from customer homes
              </span>
              <span className="text-xs font-bold text-amber-400">
                {data.returnedProducts.length} Pieces to Return
              </span>
            </div>

            {data.returnedProducts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No unpurchased returns logged. When a customer returns items from a visit, they appear here.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.returnedProducts.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{item.productName}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Merchant: <strong className="text-foreground">{item.brandName}</strong> · SKU: {item.sku}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Trial from Visit #{item.bookingId} ({item.customerName})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-foreground">{formatPrice(item.price)}</div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase mt-1">
                        ↩ Return Handover
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 🛍️ Sold Products Table */
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Garments sold & paid for during home visits
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {data.soldProducts.length} Pieces Sold
              </span>
            </div>

            {data.soldProducts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No items sold yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.soldProducts.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{item.productName}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Merchant: <strong className="text-foreground">{item.brandName}</strong> · SKU: {item.sku}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Purchased by {item.customerName} (#{item.bookingId})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-emerald-400">{formatPrice(item.price)}</div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase mt-1">
                        ✓ Sold & Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
