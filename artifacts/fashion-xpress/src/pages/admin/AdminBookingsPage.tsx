import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, ChevronDown, ChevronUp, MapPin, Phone, Mail, Package,
  Calendar, Check, AlertCircle, Layers, X, Send, User, Clock, Award,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const RENDER_API = 'https://fashionxpress.onrender.com';

export function AdminBookingsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const url = statusFilter
        ? `${RENDER_API}/api/bookings?status=${statusFilter}`
        : `${RENDER_API}/api/bookings`;
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
  }, [token, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleUpdateStatus = async (id: number, status: string) => {
    if (!token) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`${RENDER_API}/api/bookings/${id}/status`, {
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

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'pending': return { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Pending' };
      case 'confirmed': return { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', label: 'Confirmed' };
      case 'executive_assigned': return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Exec Assigned' };
      case 'in_progress': return { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'In Progress' };
      case 'completed': return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Completed' };
      case 'cancelled': return { bg: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Cancelled' };
      case 'rejected': return { bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Rejected' };
      default: return { bg: 'bg-white/10 text-white border-white/10', label: status };
    }
  };

  const metrics = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header and Filter Block */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-serif text-white mb-1">Visits & Bookings</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Manage all customer home visits and bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={fetchBookings} className="h-9 border-white/10 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Filter:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-card/60 px-4 py-2 text-xs uppercase tracking-wider focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-white transition-all hover:bg-card"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="executive_assigned">Exec Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Booking Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-white">{metrics.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Visits</div>
          </div>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-white">{metrics.pending}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Pending Action</div>
          </div>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-white">{metrics.confirmed}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Confirmed</div>
          </div>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-white">{metrics.completed}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Completed</div>
          </div>
        </div>
      </div>

      {/* Bookings Queue */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Loading bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground border border-white/5 border-dashed rounded-2xl bg-card/10">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No bookings found{statusFilter ? ` with status "${statusFilter}"` : ''}.</p>
            <p className="text-xs mt-1 opacity-60">Customers who book a home visit will appear here.</p>
          </div>
        ) : (
          bookings.map((b) => {
            const isExpanded = expandedId === b.id;
            const statusCfg = getStatusConfig(b.status);
            const isUpdating = updatingId === b.id;
            return (
              <div 
                key={b.id} 
                className={`bg-card border rounded-2xl overflow-hidden transition-all duration-300 shadow-xl ${isExpanded ? 'border-primary/20 bg-card/90 shadow-2xl' : 'border-white/5 hover:border-white/10'}`}
              >
                {/* Main Card Header Bar */}
                <div 
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 cursor-pointer hover:bg-white/[0.01] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase border border-primary/20">
                        {b.name ? b.name.substring(0, 2) : 'CU'}
                      </div>
                    </div>
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        {b.name || 'Guest Customer'} 
                        <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-bold">{b.bookingCode}</span>
                      </div>
                      <div className="text-muted-foreground text-xs font-medium mt-0.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {b.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-left sm:text-right">
                      <div className="text-white text-xs font-semibold flex items-center gap-1 sm:justify-end"><Calendar className="w-3.5 h-3.5 text-primary" /> {b.preferredDate}</div>
                      <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-0.5 flex items-center gap-1 sm:justify-end"><Clock className="w-3 h-3 text-muted-foreground" /> {b.preferredTime}</div>
                    </div>
                    
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </span>
                      
                      {/* Action buttons */}
                      <div className="hidden md:flex items-center gap-2">
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <>
                            {b.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleUpdateStatus(b.id, 'confirmed')} 
                                  className="text-[10px] bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-lg hover:bg-primary/95 transition-colors uppercase tracking-wider shadow-md"
                                >Approve</button>
                                <button 
                                  onClick={() => handleUpdateStatus(b.id, 'rejected')} 
                                  className="text-[10px] bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-500/20 font-bold px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
                                >Reject</button>
                              </>
                            )}
                            {b.status === 'confirmed' && (
                              <button 
                                onClick={() => handleUpdateStatus(b.id, 'completed')} 
                                className="text-[10px] bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors uppercase tracking-wider shadow-md"
                              >Complete</button>
                            )}
                          </>
                        )}
                      </div>
                      
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details section */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-6 py-6 bg-white/[0.01] grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Customer Info Card */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary" /> Customer Info
                      </h4>
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-3.5 text-sm">
                        <div className="flex items-start gap-2.5">
                          <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-white font-mono">{b.phone}</div>
                            <a 
                              href={`https://wa.me/91${b.phone.replace(/\D/g, '').slice(-10)}?text=Hello ${b.name}, this is Fashion Xpress regarding your visit booking ${b.bookingCode}.`}
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-green-400 text-xs font-semibold hover:underline mt-1"
                            >
                              <Send className="w-3 h-3" /> Chat on WhatsApp
                            </a>
                          </div>
                        </div>
                        {b.email && b.email !== 'not-provided@fashion-xpress.com' && (
                          <div className="flex items-center gap-2.5">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-white font-medium truncate">{b.email}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2.5 pt-2.5 border-t border-white/5">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-white leading-relaxed">{b.addressText || 'No address registered.'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sizing & Style Preferences */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-primary" /> Style Preferences
                      </h4>
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {b.gender && b.gender !== 'not_specified' && (
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Gender</div>
                              <div className="text-white font-medium capitalize">{b.gender}</div>
                            </div>
                          )}
                          {b.preferredFit && (
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Preferred Fit</div>
                              <div className="text-white font-medium capitalize">{b.preferredFit}</div>
                            </div>
                          )}
                          {b.topSize && (
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Top Size</div>
                              <span className="inline-block bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded text-xs">{b.topSize}</span>
                            </div>
                          )}
                          {b.bottomSize && (
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Bottom Size</div>
                              <span className="inline-block bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded text-xs">{b.bottomSize}</span>
                            </div>
                          )}
                        </div>
                        {b.notes && (
                          <div className="pt-3 border-t border-white/5">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Customer Note</div>
                            <div className="text-white text-xs leading-relaxed italic">"{b.notes}"</div>
                          </div>
                        )}
                        {b.preferredColors?.length > 0 && (
                          <div className="pt-2">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Preferred Colors</div>
                            <div className="flex flex-wrap gap-1">
                              {b.preferredColors.map((c: string, idx: number) => (
                                <span key={idx} className="bg-white/5 border border-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded-full">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Products to Bring */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-primary" /> Trial Bag Items ({b.products?.length || 0})
                      </h4>
                      {b.products && b.products.length > 0 ? (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                          {b.products.map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                              {p.product?.images?.[0] && (
                                <div className="w-9 h-11 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/5">
                                  <img src={p.product.images[0]} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-xs font-semibold truncate">{p.product?.name || `Product #${p.productId}`}</div>
                                <div className="text-muted-foreground text-[10px] font-medium mt-0.5 flex items-center gap-1.5">
                                  {p.product?.brandName && <span className="text-primary">{p.product.brandName}</span>}
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    p.status === 'sold' ? 'bg-emerald-500/10 text-emerald-400' :
                                    p.status === 'reserved' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-white/5 text-white/40'
                                  }`}>{p.status}</span>
                                </div>
                              </div>
                              <div className="text-white font-mono text-xs font-bold">₹{p.product?.sellingPrice || '—'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic py-6 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.005]">
                          No products attached.
                          <br />
                          <span className="text-[10px] text-muted-foreground/60 block mt-1">Customer requested general doorstep consult.</span>
                        </div>
                      )}
                    </div>

                    {/* Mobile Quick Actions */}
                    <div className="md:hidden pt-4 border-t border-white/5 flex gap-2 w-full col-span-1">
                      {b.status === 'pending' && (
                        <>
                          <Button onClick={() => handleUpdateStatus(b.id, 'confirmed')} className="flex-1 bg-primary text-primary-foreground font-bold text-xs uppercase">Approve</Button>
                          <Button variant="destructive" onClick={() => handleUpdateStatus(b.id, 'rejected')} className="flex-1 text-xs uppercase font-bold">Reject</Button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <Button onClick={() => handleUpdateStatus(b.id, 'completed')} className="w-full bg-green-600 text-white font-bold text-xs uppercase">Complete Booking</Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
