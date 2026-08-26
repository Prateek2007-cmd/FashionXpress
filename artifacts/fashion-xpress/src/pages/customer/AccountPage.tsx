import React, { useState, useEffect } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User as UserIcon, Calendar, MapPin, Ruler, Package, Clock, Check, X as XIcon, Edit2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const RENDER_API = 'https://fashionxpress.onrender.com';

function useFetchWithAuth<T>(endpoint: string, token: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !endpoint) return;
    setIsLoading(true);
    fetch(`${RENDER_API}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [endpoint, token]);

  return { data, isLoading, error };
}

export function AccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'orders'>('profile');
  const { user, token, refreshUser } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading: loadingProfile } = useFetchWithAuth<any>('/api/customers/me', token);
  const { data: bookings, isLoading: loadingBookings } = useFetchWithAuth<any[]>('/api/bookings/me', token);
  const { data: orders, isLoading: loadingOrders } = useFetchWithAuth<any[]>('/api/orders/me', token);

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
    } else if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${RENDER_API}/api/customers/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: '✅ Profile updated successfully!' });
      setIsEditing(false);
      refreshUser();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profile?.name || user?.name || 'Customer';
  const displayEmail = profile?.email || user?.email || '';
  const displayPhone = profile?.phone || user?.phone || 'Not provided';

  if (loadingProfile) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-serif text-foreground mb-2">My Account</h1>
      <p className="text-muted-foreground mb-8">Welcome back, <span className="text-primary font-medium">{displayName}</span></p>

      <div className="flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-md text-sm tracking-widest uppercase transition-colors ${activeTab === 'profile' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
          >
            <div className="flex items-center gap-3"><UserIcon className="w-4 h-4" /> Profile & Sizing</div>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full text-left px-4 py-3 rounded-md text-sm tracking-widest uppercase transition-colors ${activeTab === 'bookings' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
          >
            <div className="flex items-center gap-3"><Calendar className="w-4 h-4" /> Visit History</div>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-3 rounded-md text-sm tracking-widest uppercase transition-colors ${activeTab === 'orders' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
          >
            <div className="flex items-center gap-3"><Package className="w-4 h-4" /> Custom Orders</div>
          </button>
        </aside>

        <main className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="bg-card border border-white/5 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-xl text-foreground">Personal Details</h3>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" className="text-xs tracking-widest uppercase gap-2" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs uppercase gap-2" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        <XIcon className="w-3.5 h-3.5" /> Cancel
                      </Button>
                      <Button size="sm" className="text-xs uppercase gap-2" onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Full Name</label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-background" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Email</label>
                      <div className="text-foreground text-sm py-2 text-muted-foreground">{displayEmail} <span className="text-xs">(not editable)</span></div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Phone</label>
                      <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="bg-background" placeholder="10-digit mobile number" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Full Name</label>
                      <div className="text-foreground text-lg">{displayName}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Email</label>
                      <div className="text-foreground text-lg">{displayEmail}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Phone</label>
                      <div className="text-foreground text-lg">{displayPhone}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-card border border-white/5 rounded-2xl p-8">
                <h3 className="font-serif text-xl text-foreground mb-4">Account Info</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-widest font-bold">{user?.role || 'Customer'}</span>
                  <span className="text-muted-foreground">Member since joining Fashion Xpress</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h3 className="font-serif text-xl text-foreground mb-6">Past & Upcoming Visits</h3>
              {loadingBookings ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : !bookings || bookings.length === 0 ? (
                <div className="text-center py-16 border border-white/5 rounded-xl bg-card/30">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You have no booking history yet.</p>
                  <p className="text-xs text-muted-foreground">Book a visit to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <div key={booking.id} className="bg-card border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <div>
                          <div className="text-primary font-mono tracking-widest text-sm mb-1">{booking.bookingCode}</div>
                          <div className="text-foreground font-medium">{formatDate(booking.preferredDate)} at {booking.preferredTime}</div>
                        </div>
                        <div className="inline-flex px-3 py-1 rounded bg-muted/50 border border-border text-xs tracking-widest uppercase text-foreground/80 self-start">
                          {(booking.status || '').replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-4 pt-4 border-t border-white/5">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{booking.addressText}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="font-serif text-xl text-foreground mb-6">Custom Orders</h3>
              {loadingOrders ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-16 border border-white/5 rounded-xl bg-card/30">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You have no custom orders.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order: any, idx: number) => (
                    <div key={order.id} className="bg-card border border-white/5 hover:border-primary/20 rounded-xl overflow-hidden shadow-lg transition-all">
                      <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="font-serif font-bold text-primary text-xs bg-primary/10 px-2.5 py-1 rounded">S.No: {idx + 1}</span>
                          <span className="font-mono font-bold text-foreground text-md">{order.orderNumber}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-foreground/90 text-sm">Total: {formatPrice(order.totalAmount)}</span>
                          {order.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-500/10 border border-green-500/20 text-xs text-green-500 font-medium">
                              <Check className="w-3.5 h-3.5" /> Ready for Pickup
                            </span>
                          ) : order.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium">
                              <XIcon className="w-3.5 h-3.5" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-500 font-medium">
                              <Clock className="w-3.5 h-3.5" /> Pending Approval
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-3">
                          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold block mb-2">Items</span>
                          <div className="space-y-3">
                            {order.items?.map((item: any) => (
                              <div key={item.id} className="flex gap-4 items-center bg-white/[0.01] p-3 rounded-lg border border-white/5">
                                <div className="w-12 h-16 bg-black/50 rounded overflow-hidden flex-shrink-0 border border-white/5">
                                  {item.product?.images?.[0] ? (
                                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-foreground text-sm font-medium truncate">{item.product?.name}</h4>
                                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                    <span>Size: <strong className="text-foreground">{item.size}</strong></span>
                                    <span>Color: <strong className="text-foreground">{item.color}</strong></span>
                                    <span>Qty: <strong className="text-foreground">{item.quantity}</strong></span>
                                  </div>
                                </div>
                                <div className="text-foreground text-sm font-medium">{formatPrice(parseFloat(item.priceAtSale))}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white/[0.01] p-4 rounded-lg border border-white/5 space-y-4">
                          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold block">Pickup Details</span>
                          <div className="text-sm text-foreground flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                            <span>{order.shippingAddress}</span>
                          </div>
                          {order.specialRequirements && (
                            <div className="pt-2 border-t border-white/5">
                              <div className="text-xs text-muted-foreground">Notes</div>
                              <div className="text-xs text-foreground italic">"{order.specialRequirements}"</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
