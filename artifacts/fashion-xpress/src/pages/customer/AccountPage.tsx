import React, { useState } from 'react';
import { 
  useGetMyCustomerProfile, 
  useGetMyMeasurements, 
  useListMyBookings,
  customFetch
} from '@workspace/api-client-react';
import { useQuery } from '@tanstack/react-query';
import { formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User as UserIcon, Calendar, MapPin, Ruler, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'orders'>('profile');
  const { user } = useAuth();
  
  const { data: profile, isLoading: loadingProfile } = useGetMyCustomerProfile();
  const { data: measurements } = useGetMyMeasurements();
  const { data: bookings, isLoading: loadingBookings } = useListMyBookings();

  if (loadingProfile) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-serif text-white mb-8">My Account</h1>

      <div className="flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-md text-sm tracking-widest uppercase transition-colors ${activeTab === 'profile' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
          >
            <div className="flex items-center gap-3"><UserIcon className="w-4 h-4" /> Profile & Sizing</div>
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full text-left px-4 py-3 rounded-md text-sm tracking-widest uppercase transition-colors ${activeTab === 'bookings' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
          >
            <div className="flex items-center gap-3"><Calendar className="w-4 h-4" /> Visit History</div>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-3 rounded-md text-sm tracking-widest uppercase transition-colors ${activeTab === 'orders' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
          >
            <div className="flex items-center gap-3"><Package className="w-4 h-4" /> Custom Orders</div>
          </button>
        </aside>

        <main className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-10">
              <div className="bg-card border border-white/5 rounded-2xl p-8">
                <h3 className="font-serif text-xl text-white mb-6">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Full Name</label>
                    <div className="text-white text-lg">{profile?.name}</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Email</label>
                    <div className="text-white text-lg">{profile?.email}</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Phone</label>
                    <div className="text-white text-lg">{profile?.phone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-white/5 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-xl text-white">Measurements & Fit</h3>
                  <Button variant="outline" size="sm" className="text-xs tracking-widest uppercase">Edit</Button>
                </div>
                
                {measurements ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Top Size</label>
                      <div className="text-white text-lg">{measurements.topSize || '-'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Bottom Size</label>
                      <div className="text-white text-lg">{measurements.bottomSize || '-'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Height</label>
                      <div className="text-white text-lg">{measurements.heightCm ? `${measurements.heightCm} cm` : '-'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-1 block">Pref. Fit</label>
                      <div className="text-white text-lg capitalize">{measurements.preferredFit || '-'}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Add your measurements so our stylists can bring the perfect fit.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h3 className="font-serif text-xl text-white mb-6">Past & Upcoming Visits</h3>
              
              {loadingBookings ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : bookings?.length === 0 ? (
                <div className="text-center py-16 border border-white/5 rounded-xl bg-card/30">
                  <p className="text-muted-foreground mb-4">You have no booking history.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings?.map((booking) => (
                    <div key={booking.id} className="bg-card border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <div>
                          <div className="text-primary font-mono tracking-widest text-sm mb-1">{booking.bookingCode}</div>
                          <div className="text-white font-medium">{formatDate(booking.preferredDate)} at {booking.preferredTime}</div>
                        </div>
                        <div className="inline-flex px-3 py-1 rounded bg-white/5 border border-white/10 text-xs tracking-widest uppercase text-white/80 self-start">
                          {booking.status.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground mt-4 pt-4 border-t border-white/5">
                        <MapPin className="w-4 h-4 mr-2" />
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
              <h3 className="font-serif text-xl text-white mb-6">Custom Orders</h3>
              <OrdersList />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function OrdersList() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/orders/me'],
    queryFn: () => customFetch({ url: '/api/orders/me' }).then((res: any) => res.data)
  });

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!orders || orders.length === 0) return (
    <div className="text-center py-16 border border-white/5 rounded-xl bg-card/30">
      <p className="text-muted-foreground mb-4">You have no custom orders.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map((order: any) => (
        <div key={order.id} className="bg-card border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <div>
              <div className="text-primary font-mono tracking-widest text-sm mb-1">{order.orderNumber}</div>
              <div className="text-white font-medium">₹{order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="inline-flex px-3 py-1 rounded bg-white/5 border border-white/10 text-xs tracking-widest uppercase text-white/80 self-start">
              {order.status}
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-4 pt-4 border-t border-white/5 space-y-2">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.product?.name} ({item.color}, {item.size})</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
