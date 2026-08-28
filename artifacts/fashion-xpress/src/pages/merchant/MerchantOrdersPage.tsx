import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { 
  ClipboardList, User, Mail, Phone, ShoppingBag, Loader2,
  Calendar, MapPin, Package, RefreshCw, ChevronDown, ChevronUp,
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const RENDER_API = 'https://fashionxpress.onrender.com';

interface MyProduct {
  id: number;
  productId: number;
  status: string;
  priceAtSale: string | null;
  product: {
    id: number;
    name: string;
    images: string[];
    sellingPrice: string;
  } | null;
}

interface MerchantBooking {
  id: number;
  bookingCode: string;
  status: string;
  name: string;
  phone: string;
  email: string;
  addressText: string;
  preferredDate: string;
  preferredTime: string;
  createdAt: string;
  myProducts: MyProduct[];
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'pending': return { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: AlertCircle, label: 'Pending' };
    case 'confirmed': return { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: CheckCircle, label: 'Confirmed' };
    case 'executive_assigned': return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: User, label: 'Exec Assigned' };
    case 'in_progress': return { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock, label: 'In Progress' };
    case 'completed': return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle, label: 'Completed' };
    case 'cancelled': return { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Cancelled' };
    case 'rejected': return { bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: XCircle, label: 'Rejected' };
    default: return { bg: 'bg-white/10 text-white border-white/10', icon: Clock, label: status };
  }
}

function getProductStatusBadge(status: string) {
  switch (status) {
    case 'sold': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    case 'reserved': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    case 'returned': return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
    default: return 'bg-white/5 text-white/50 border-white/10';
  }
}

export function MerchantOrdersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<MerchantBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${RENDER_API}/api/merchants/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: 'Failed to load bookings', description: err.message, variant: 'destructive' });
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const metrics = {
    total: bookings.length,
    active: bookings.filter(b => ['pending', 'confirmed', 'executive_assigned', 'in_progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    sold: bookings.reduce((s, b) => s + b.myProducts.filter(p => p.status === 'sold').length, 0),
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Customer Bookings</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Home visits that include your products in the trial bag
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-primary/50 text-white rounded-xl text-sm font-medium transition-colors bg-white/5 hover:bg-primary/10"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: metrics.total, color: 'text-purple-400', bg: 'bg-purple-500/10', Icon: ClipboardList },
          { label: 'Active Visits', value: metrics.active, color: 'text-cyan-400', bg: 'bg-cyan-500/10', Icon: Calendar },
          { label: 'Completed', value: metrics.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: CheckCircle },
          { label: 'Items Sold', value: metrics.sold, color: 'text-amber-400', bg: 'bg-amber-500/10', Icon: ShoppingBag },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-white">{value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-24 border border-white/5 border-dashed rounded-2xl bg-card/10">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-white font-medium mb-1">No bookings yet</p>
          <p className="text-muted-foreground text-sm">
            When customers include your products in their home visit, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const cfg = getStatusConfig(b.status);
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === b.id;
            const soldCount = b.myProducts.filter(p => p.status === 'sold').length;
            const totalValue = b.myProducts
              .filter(p => p.status === 'sold' && p.priceAtSale)
              .reduce((s, p) => s + parseFloat(p.priceAtSale!), 0);

            return (
              <div
                key={b.id}
                className={`bg-card border rounded-2xl overflow-hidden transition-all shadow-lg ${isExpanded ? 'border-primary/20' : 'border-white/5 hover:border-white/10'}`}
              >
                {/* Header row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 cursor-pointer hover:bg-white/[0.01] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {b.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        {b.name}
                        <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{b.bookingCode}</span>
                      </div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3" /> {b.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-white flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {b.preferredDate}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {b.myProducts.length} product{b.myProducts.length !== 1 ? 's' : ''} · {soldCount} sold
                        {soldCount > 0 && <span className="text-emerald-400 ml-1">· {formatPrice(totalValue)}</span>}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cfg.bg} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </span>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white/[0.01]">

                    {/* Customer info */}
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary" /> Customer Details
                      </h4>
                      <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-white font-mono">{b.phone}</span>
                        </div>
                        {b.email && b.email !== 'not-provided@fashion-xpress.com' && (
                          <div className="flex items-center gap-2.5">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-white">{b.email}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-white leading-relaxed">{b.addressText || 'No address provided'}</span>
                        </div>
                        <div className="flex items-center gap-2.5 pt-2 border-t border-white/5">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-white text-xs">{b.preferredDate} · {b.preferredTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* My products in this booking */}
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-primary" /> Your Products in This Visit ({b.myProducts.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {b.myProducts.map((mp) => (
                          <div key={mp.id} className="flex items-center gap-3 p-3 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                            {mp.product?.images?.[0] ? (
                              <img src={mp.product.images[0]} alt="" className="w-10 h-12 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-12 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">{mp.product?.name || `Product #${mp.productId}`}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getProductStatusBadge(mp.status)}`}>
                                  {mp.status}
                                </span>
                                {mp.status === 'sold' && mp.priceAtSale && (
                                  <span className="text-emerald-400 text-xs font-bold">{formatPrice(parseFloat(mp.priceAtSale))}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-white text-xs font-mono font-bold">
                                ₹{mp.product?.sellingPrice || '—'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
