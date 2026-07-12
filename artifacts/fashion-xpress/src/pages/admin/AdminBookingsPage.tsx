import React, { useState } from 'react';
import { useListBookings, useUpdateBookingStatus } from '@workspace/api-client-react';
import { Loader2, Search, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

export function AdminBookingsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
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

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No bookings found.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/5 bg-white/[0.02]">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Code</th>
                <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Customer</th>
                <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Date & Time</th>
                <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Status</th>
                <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((b) => (
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
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-widest
                      ${b.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : ''}
                      ${b.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' : ''}
                      ${b.status === 'completed' ? 'bg-green-500/10 text-green-500' : ''}
                      ${['cancelled', 'rejected'].includes(b.status) ? 'bg-red-500/10 text-red-500' : ''}
                    `}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(b.id, 'confirmed')} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors">APPROVE</button>
                        <button onClick={() => handleUpdateStatus(b.id, 'rejected')} className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded hover:bg-destructive/90 transition-colors">REJECT</button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => handleUpdateStatus(b.id, 'completed')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors">MARK COMPLETED</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
