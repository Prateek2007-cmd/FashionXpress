import React, { useState } from 'react';
import { 
  useGetDashboardSummary, 
  useListBookings,
  useUpdateBookingStatus
} from '@workspace/api-client-react';
import { formatPrice } from '@/lib/utils';
import { Loader2, TrendingUp, Users, ShoppingBag, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function AdminDashboard() {
  const { toast } = useToast();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: recentBookings, isLoading: loadingBookings, refetch } = useListBookings({ status: 'pending' });
  const updateStatus = useUpdateBookingStatus();

  const handleApprove = (id: number) => {
    updateStatus.mutate({ id, data: { status: 'confirmed' } }, {
      onSuccess: () => {
        toast({ title: 'Booking Approved' });
        refetch();
      }
    });
  };

  if (loadingSummary) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif text-white mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Platform Overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Revenue</h3>
          </div>
          <div className="text-3xl font-serif text-white">{formatPrice(summary?.totalRevenue || 0)}</div>
        </div>

        <div className="bg-card border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Today's Visits</h3>
          </div>
          <div className="text-3xl font-serif text-white">{summary?.todaysBookings || 0}</div>
        </div>

        <div className="bg-card border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Customers</h3>
          </div>
          <div className="text-3xl font-serif text-white">{summary?.totalCustomers || 0}</div>
        </div>

        <div className="bg-card border border-white/5 rounded-xl p-6 relative">
          {(summary?.lowStockCount || 0) > 0 && (
            <div className="absolute top-4 right-4 flex items-center text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
              <AlertCircle className="w-3 h-3 mr-1" /> {summary?.lowStockCount} Low
            </div>
          )}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Products</h3>
          </div>
          <div className="text-3xl font-serif text-white">{summary?.totalProducts || 0}</div>
        </div>
      </div>

      {/* Action needed */}
      <div>
        <h2 className="text-xl font-serif text-white mb-6">Pending Approvals</h2>
        
        {loadingBookings ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !recentBookings || recentBookings.length === 0 ? (
          <div className="border border-white/5 border-dashed rounded-xl p-12 text-center bg-card/20">
            <p className="text-muted-foreground">No pending bookings require approval.</p>
          </div>
        ) : (
          <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Booking Ref</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Customer</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Date & Time</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Items</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-primary">{b.bookingCode}</td>
                    <td className="px-6 py-4">
                      <div className="text-white">{b.name}</div>
                      <div className="text-muted-foreground text-xs">{b.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{b.preferredDate}</div>
                      <div className="text-muted-foreground text-xs">{b.preferredTime}</div>
                    </td>
                    <td className="px-6 py-4 text-white">{b.products.length} pcs</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleApprove(b.id)}
                        disabled={updateStatus.isPending}
                        className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:bg-primary/90 transition-colors uppercase tracking-widest disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
