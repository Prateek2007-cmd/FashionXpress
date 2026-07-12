import React, { useState } from 'react';
import { useListBookings, useUpdateBookingStatus } from '@workspace/api-client-react';
import { Loader2, ChevronDown, ChevronUp, MapPin, Phone, Mail, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function AdminBookingsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: bookings, isLoading, refetch } = useListBookings(
    statusFilter ? { status: statusFilter as any } : undefined
  );
  const updateStatus = useUpdateBookingStatus();

  const handleUpdateStatus = (id: number, status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected') => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Booking marked as ${status}` });
        refetch();
      }
    });
  };

  const statusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'confirmed': return 'bg-blue-500/10 text-blue-500';
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'cancelled': case 'rejected': return 'bg-red-500/10 text-red-500';
      default: return 'bg-white/10 text-white';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif text-white mb-1">Bookings</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Manage all visits and direct bookings</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground border border-white/5 rounded-xl bg-card/20">
            No bookings found.
          </div>
        ) : (
          bookings.map((b) => {
            const isExpanded = expandedId === b.id;
            return (
              <div key={b.id} className="bg-card border border-white/5 rounded-xl overflow-hidden">
                {/* Main row */}
                <div 
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-[120px]">
                    <div className="font-mono text-primary text-sm">{b.bookingCode}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{b.name}</div>
                    <div className="text-muted-foreground text-xs">{b.phone}</div>
                  </div>
                  <div className="hidden md:block text-sm">
                    <div className="text-white">{b.preferredDate}</div>
                    <div className="text-muted-foreground text-xs">{b.preferredTime}</div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-widest ${statusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(b.id, 'confirmed')} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors">APPROVE</button>
                        <button onClick={() => handleUpdateStatus(b.id, 'rejected')} className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded hover:bg-destructive/90 transition-colors">REJECT</button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => handleUpdateStatus(b.id, 'completed')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors">COMPLETE</button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-6 py-5 bg-white/[0.01]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Customer Details */}
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Customer Details</h4>
                        <div className="flex items-start gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-white">{b.phone}</div>
                            <a 
                              href={`https://wa.me/91${b.phone.replace(/\D/g, '').slice(-10)}?text=Hello ${b.name}, this is Fashion Xpress regarding your booking ${b.bookingCode}.`}
                              target="_blank" rel="noreferrer"
                              className="text-green-400 text-xs hover:underline"
                            >
                              WhatsApp →
                            </a>
                          </div>
                        </div>
                        {b.email && b.email !== 'not-provided@fashion-xpress.com' && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-white">{b.email}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-white">{b.addressText || 'No address provided'}</span>
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Preferences</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {b.gender && b.gender !== 'not_specified' && (
                            <div>
                              <div className="text-muted-foreground text-xs">Gender</div>
                              <div className="text-white capitalize">{b.gender}</div>
                            </div>
                          )}
                          {b.preferredFit && (
                            <div>
                              <div className="text-muted-foreground text-xs">Fit</div>
                              <div className="text-white capitalize">{b.preferredFit}</div>
                            </div>
                          )}
                          {b.topSize && (
                            <div>
                              <div className="text-muted-foreground text-xs">Top Size</div>
                              <div className="text-white">{b.topSize}</div>
                            </div>
                          )}
                          {b.bottomSize && (
                            <div>
                              <div className="text-muted-foreground text-xs">Bottom Size</div>
                              <div className="text-white">{b.bottomSize}</div>
                            </div>
                          )}
                        </div>
                        {b.notes && (
                          <div>
                            <div className="text-muted-foreground text-xs">Notes</div>
                            <div className="text-white text-sm">{b.notes}</div>
                          </div>
                        )}
                        {(b as any).preferredColors?.length > 0 && (
                          <div>
                            <div className="text-muted-foreground text-xs">Preferred Colors</div>
                            <div className="text-white text-sm">{(b as any).preferredColors.join(', ')}</div>
                          </div>
                        )}
                        {(b as any).preferredBrands?.length > 0 && (
                          <div>
                            <div className="text-muted-foreground text-xs">Preferred Brands</div>
                            <div className="text-white text-sm">{(b as any).preferredBrands.join(', ')}</div>
                          </div>
                        )}
                      </div>

                      {/* Products to bring */}
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-1">
                          <Package className="w-3 h-3" /> Items to Bring
                        </h4>
                        {b.products && b.products.length > 0 ? (
                          <div className="space-y-2">
                            {b.products.map((p: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                {p.product?.images?.[0] && (
                                  <div className="w-10 h-12 rounded overflow-hidden bg-black/50 flex-shrink-0">
                                    <img src={p.product.images[0]} alt="" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-white text-sm truncate">{p.product?.name || `Product #${p.productId}`}</div>
                                  <div className="text-muted-foreground text-xs">
                                    {p.product?.brandName && <span>{p.product.brandName} • </span>}
                                    ₹{p.product?.sellingPrice || '—'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic py-4 text-center border border-dashed border-white/10 rounded-lg">
                            No specific products selected.
                            <br />
                            <span className="text-xs">Customer wants a general consultation.</span>
                          </div>
                        )}
                      </div>
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
