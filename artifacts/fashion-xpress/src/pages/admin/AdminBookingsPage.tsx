import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, ChevronDown, ChevronUp, MapPin, Phone, Mail, Package,
  Calendar, Check, AlertCircle, Layers, X, Send, User, Clock, Award,
  RefreshCw, UserCheck, ArrowRightLeft, Sparkles, CheckCircle2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getApiBaseUrl } from '@/lib/api-config';

interface Executive {
  id: number;
  userId: number;
  name: string;
  phone: string;
  email: string;
  rating: number;
  activeBookings: number;
}

export function AdminBookingsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Transfer Lead modal state
  const [transferModalBooking, setTransferModalBooking] = useState<any | null>(null);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<number | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const API_BASE = getApiBaseUrl();

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const url = statusFilter
        ? `${API_BASE}/api/bookings?status=${statusFilter}`
        : `${API_BASE}/api/bookings`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: 'Failed to load bookings', description: err.message, variant: 'destructive' });
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter, API_BASE]);

  const fetchExecutives = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/executives`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExecutives(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch executives list:', err);
    }
  }, [token, API_BASE]);

  useEffect(() => {
    fetchBookings();
    fetchExecutives();
  }, [fetchBookings, fetchExecutives]);

  const handleUpdateStatus = async (id: number, status: string) => {
    if (!token) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: `✅ Booking ${status}` });
      fetchBookings();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignExecutive = async () => {
    if (!transferModalBooking || !selectedExecutiveId || !token) return;
    setIsTransferring(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${transferModalBooking.id}/assign-executive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ executiveId: selectedExecutiveId }),
      });

      if (!res.ok) throw new Error('Failed to assign executive');
      const assignedExec = executives.find(e => e.id === selectedExecutiveId);

      toast({
        title: '🎉 Lead Transferred Successfully!',
        description: `Assigned booking #${transferModalBooking.id} to ${assignedExec?.name || 'Executive'}.`,
      });

      setTransferModalBooking(null);
      setSelectedExecutiveId(null);
      fetchBookings();
      fetchExecutives();
    } catch (err: any) {
      toast({ title: 'Assignment Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsTransferring(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'pending': return { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Pending' };
      case 'confirmed': return { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', label: 'Confirmed' };
      case 'executive_assigned': return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Exec Assigned' };
      case 'en_route': return { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'En Route' };
      case 'arrived': return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Arrived' };
      case 'in_progress': return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'In Progress' };
      case 'completed': return { bg: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Completed' };
      case 'cancelled': return { bg: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Cancelled' };
      case 'rejected': return { bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Rejected' };
      default: return { bg: 'bg-white/10 text-white border-white/10', label: status };
    }
  };

  const metrics = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    assigned: bookings.filter(b => ['executive_assigned', 'en_route', 'arrived', 'in_progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header and Filter Block */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground mb-1">Leads & Home Visit Bookings</h1>
          <p className="text-muted-foreground text-xs sm:text-sm tracking-widest uppercase">
            Receive incoming leads and transfer them directly to Style Executives
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => { fetchBookings(); fetchExecutives(); }} className="h-9 gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Filter:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-4 py-2 text-xs uppercase tracking-wider text-foreground transition-all hover:bg-card/80 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="executive_assigned">Exec Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Booking Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">{metrics.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Leads</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">{metrics.pending}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Pending Action</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">{metrics.assigned}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">With Executives</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">{metrics.completed}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Completed & Paid</div>
          </div>
        </div>
      </div>

      {/* Bookings Queue */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Loading leads & visits...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground border border-border border-dashed rounded-2xl bg-card/10">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No bookings found{statusFilter ? ` with status "${statusFilter}"` : ''}.</p>
            <p className="text-xs mt-1 opacity-60">Customers who book a home visit will appear here.</p>
          </div>
        ) : (
          bookings.map((b) => {
            const isExpanded = expandedId === b.id;
            const statusCfg = getStatusConfig(b.status);
            const isUpdating = updatingId === b.id;
            const assignedExec = executives.find(e => e.id === b.executiveId);

            return (
              <div 
                key={b.id} 
                className={`bg-card border rounded-2xl overflow-hidden transition-all duration-300 shadow-md ${
                  isExpanded ? 'border-primary/40 ring-1 ring-primary/20 shadow-xl' : 'border-border hover:border-border/80'
                }`}
              >
                {/* Main Card Header Bar */}
                <div 
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase border border-primary/20">
                        {b.name ? b.name.substring(0, 2) : 'CU'}
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground font-semibold flex items-center gap-2">
                        {b.name || 'Guest Customer'} 
                        <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                          {b.bookingCode || `#VISIT-${b.id}`}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs font-medium mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {b.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 flex-wrap">
                    <div className="text-left sm:text-right">
                      <div className="text-foreground text-xs font-semibold flex items-center gap-1 sm:justify-end">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {b.preferredDate}
                      </div>
                      <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-0.5 flex items-center gap-1 sm:justify-end">
                        <Clock className="w-3 h-3 text-muted-foreground" /> {b.preferredTime}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </span>

                      {/* 👉 Transfer to Executive Button */}
                      {b.status !== 'completed' && b.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setTransferModalBooking(b);
                            setSelectedExecutiveId(b.executiveId || (executives[0]?.id || null));
                          }}
                          className={`h-8 px-3 text-xs gap-1.5 font-bold uppercase tracking-wider ${
                            b.executiveId
                              ? 'bg-purple-600/10 text-purple-400 border border-purple-500/30 hover:bg-purple-600/20'
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 animate-pulse'
                          }`}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          {b.executiveId ? (assignedExec ? assignedExec.name.split(' ')[0] : 'Re-assign') : 'Transfer Lead'}
                        </Button>
                      )}
                    </div>

                    {/* Chevron toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : b.id)}
                      className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details section */}
                {isExpanded && (
                  <div className="border-t border-border px-6 py-6 bg-muted/10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Customer Info Card */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary" /> Customer Info
                      </h4>
                      <div className="bg-card border border-border rounded-xl p-4 space-y-3.5 text-sm">
                        <div className="flex items-start gap-2.5">
                          <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-foreground font-mono">{b.phone}</div>
                            <a 
                              href={`https://wa.me/91${b.phone.replace(/\D/g, '').slice(-10)}?text=Hello ${b.name}, this is Fashion Xpress regarding your visit booking ${b.bookingCode || b.id}.`}
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-green-500 text-xs font-semibold hover:underline mt-1"
                            >
                              <Send className="w-3 h-3" /> Chat on WhatsApp
                            </a>
                          </div>
                        </div>
                        {b.email && b.email !== 'not-provided@fashion-xpress.com' && (
                          <div className="flex items-center gap-2.5">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground font-medium truncate">{b.email}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2.5 pt-2.5 border-t border-border">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-foreground leading-relaxed">{b.addressText || 'No address registered.'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Executive & Style Preferences */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-primary" /> Assigned Style Executive
                      </h4>

                      {assignedExec ? (
                        <div className="bg-card border border-purple-500/30 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Assigned Executive</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTransferModalBooking(b);
                                setSelectedExecutiveId(b.executiveId);
                              }}
                              className="h-7 text-[11px] gap-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Transfer
                            </Button>
                          </div>
                          <div className="font-bold text-foreground text-sm">{assignedExec.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{assignedExec.email} · {assignedExec.phone}</div>
                        </div>
                      ) : (
                        <div className="bg-card border border-dashed border-border rounded-xl p-4 text-center space-y-2">
                          <p className="text-xs text-muted-foreground">No executive assigned yet.</p>
                          <Button
                            size="sm"
                            onClick={() => {
                              setTransferModalBooking(b);
                              setSelectedExecutiveId(executives[0]?.id || null);
                            }}
                            className="text-xs bg-primary text-primary-foreground font-bold uppercase tracking-wider"
                          >
                            Assign to Executive
                          </Button>
                        </div>
                      )}

                      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Preferences</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Fit: <strong className="capitalize">{b.preferredFit || 'Regular'}</strong></div>
                          <div>Top Size: <strong>{b.topSize || '-'}</strong></div>
                        </div>
                        {b.notes && <p className="text-xs text-muted-foreground italic">"{b.notes}"</p>}
                      </div>
                    </div>

                    {/* Selected Products to Bring */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-primary" /> Trial Bag Items ({b.products?.length || 0})
                      </h4>
                      {b.products && b.products.length > 0 ? (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {b.products.map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
                              {p.product?.images?.[0] && (
                                <div className="w-9 h-11 rounded-lg overflow-hidden bg-background shrink-0 border border-border">
                                  <img src={p.product.images[0]} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-foreground text-xs font-semibold truncate">{p.product?.name || `Product #${p.productId}`}</div>
                                <div className="text-muted-foreground text-[10px] font-medium mt-0.5 flex items-center gap-1.5">
                                  {p.product?.brandName && <span className="text-primary">{p.product.brandName}</span>}
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    p.status === 'sold' ? 'bg-emerald-500/10 text-emerald-400' :
                                    p.status === 'returned' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-muted text-muted-foreground'
                                  }`}>{p.status}</span>
                                </div>
                              </div>
                              <div className="text-foreground font-mono text-xs font-bold">₹{p.product?.sellingPrice || '—'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic py-6 text-center border border-dashed border-border rounded-xl bg-card/20">
                          No products attached.
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 🔄 Transfer Lead Modal */}
      <Dialog open={!!transferModalBooking} onOpenChange={(open) => !open && setTransferModalBooking(null)}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-foreground font-serif">
              <ArrowRightLeft className="w-5 h-5 text-primary" /> Transfer Lead to Style Executive
            </DialogTitle>
          </DialogHeader>

          {transferModalBooking && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block">Customer Lead</span>
                <div className="text-sm font-bold text-foreground">{transferModalBooking.name}</div>
                <div className="text-xs text-muted-foreground">{transferModalBooking.addressText}</div>
                <div className="text-xs text-primary font-mono font-semibold">
                  Scheduled: {transferModalBooking.preferredDate} at {transferModalBooking.preferredTime}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground block">
                  Select Style Executive
                </label>

                {executives.length === 0 ? (
                  <p className="text-xs text-red-400">No executives registered. Please add an executive in the Executives menu first.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {executives.map((exec) => {
                      const isSelected = selectedExecutiveId === exec.id;
                      return (
                        <div
                          key={exec.id}
                          onClick={() => setSelectedExecutiveId(exec.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-primary ring-1 ring-primary/40'
                              : 'bg-card border-border hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground">{exec.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{exec.email}</div>
                            </div>
                          </div>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {exec.activeBookings} active leads
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTransferModalBooking(null)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignExecutive}
                  disabled={!selectedExecutiveId || isTransferring}
                  className="flex-1 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs gap-2"
                >
                  {isTransferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Assign & Transfer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
