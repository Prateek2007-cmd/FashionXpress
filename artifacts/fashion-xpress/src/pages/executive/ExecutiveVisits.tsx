import React, { useState } from 'react';
import { useListMyVisits, useGetBooking, useGenerateBookingInvoice, useUpdateBookingProductStatus } from '@workspace/api-client-react';
import { Loader2, MapPin, Phone, MessageCircle, Navigation, CheckCircle2, XCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function ExecutiveVisits() {
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const { data: visits, isLoading } = useListMyVisits({ date: new Date().toISOString().split('T')[0] });

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex h-screen bg-black">
      {/* List sidebar */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-card/20 overflow-y-auto">
        <div className="p-6 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-10">
          <h2 className="text-lg font-serif text-white">Today's Schedule</h2>
          <p className="text-xs text-muted-foreground mt-1">{new Date().toDateString()}</p>
        </div>

        {!visits || visits.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No visits scheduled for today.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {visits.map(v => (
              <button 
                key={v.id}
                onClick={() => setSelectedVisitId(v.id)}
                className={`w-full text-left p-6 transition-colors hover:bg-white/[0.02] ${selectedVisitId === v.id ? 'bg-primary/5 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}
              >
                <div className="text-primary font-mono text-xs tracking-widest mb-2">{v.preferredTime}</div>
                <div className="text-white font-medium mb-1">{v.name}</div>
                <div className="text-muted-foreground text-xs flex items-start gap-2 line-clamp-2">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" /> {v.addressText}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Pane */}
      <div className="flex-1 overflow-y-auto bg-background">
        {selectedVisitId ? (
          <VisitDetail visitId={selectedVisitId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a visit to view details and process items.
          </div>
        )}
      </div>
    </div>
  );
}

function VisitDetail({ visitId }: { visitId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: visit, isLoading } = useGetBooking(visitId, { query: { enabled: !!visitId, queryKey: ['/bookings', visitId] } });
  
  const updateProduct = useUpdateBookingProductStatus();
  const generateInvoice = useGenerateBookingInvoice();

  const handleMarkStatus = (bookingProductId: number, status: 'sold' | 'returned', price: number) => {
    updateProduct.mutate({
      id: visitId,
      productId: bookingProductId,
      data: { status, priceAtSale: price }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/bookings', visitId] });
      }
    });
  };

  const handleCheckout = () => {
    // Collect payment logic could be a modal, for simplicity we generate cash invoice directly
    generateInvoice.mutate({
      id: visitId,
      data: { paymentMethod: 'cash' }
    }, {
      onSuccess: () => {
        toast({ title: 'Invoice Generated', description: 'Visit completed successfully.' });
        queryClient.invalidateQueries({ queryKey: ['/api/bookings', visitId] });
        queryClient.invalidateQueries({ queryKey: ['/api/executives/me/visits'] });
      }
    });
  };

  if (isLoading || !visit) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.addressText)}`;
  const waUrl = `https://wa.me/${visit.phone.replace(/\D/g,'')}?text=Hi ${visit.name}, I am your Fashion Executive from The Fashion Xpress.`;

  const allProcessed = visit.products.every(p => p.status === 'sold' || p.status === 'returned' || p.status === 'damaged');
  const soldTotal = visit.products.filter(p => p.status === 'sold').reduce((sum, p) => sum + (p.priceAtSale || p.product.sellingPrice), 0);

  return (
    <div className="max-w-3xl mx-auto p-8 pb-32">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-xs tracking-widest uppercase text-white/80 mb-4">
            {visit.status.replace('_', ' ')}
          </div>
          <h1 className="text-3xl font-serif text-white mb-2">{visit.name}</h1>
          <p className="text-muted-foreground">{visit.phone}</p>
        </div>

        <div className="flex gap-2">
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center text-white hover:border-primary transition-colors">
            <Navigation className="w-4 h-4 text-blue-400" />
          </a>
          <a href={`tel:${visit.phone}`} className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center text-white hover:border-primary transition-colors">
            <Phone className="w-4 h-4 text-emerald-400" />
          </a>
          <a href={waUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center text-white hover:border-primary transition-colors">
            <MessageCircle className="w-4 h-4 text-green-500" />
          </a>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-xl p-6 mb-8">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Customer Context</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-white/50 block mb-1">Fit</span> <span className="text-white capitalize">{visit.preferredFit || '-'}</span></div>
          <div><span className="text-white/50 block mb-1">Sizes</span> <span className="text-white">{visit.topSize || '-'} (T) / {visit.bottomSize || '-'} (B)</span></div>
          <div className="col-span-2 pt-2"><span className="text-white/50 block mb-1">Notes</span> <span className="text-white">{visit.notes || 'No special notes provided.'}</span></div>
        </div>
      </div>

      <h3 className="text-xl font-serif text-white mb-6">Selected Pieces ({visit.products.length})</h3>
      
      <div className="space-y-4 mb-8">
        {visit.products.map(bp => (
          <div key={bp.id} className="bg-card border border-white/5 rounded-xl p-4 flex gap-4">
            <div className="w-16 h-20 bg-black/50 rounded overflow-hidden flex-shrink-0">
              {bp.product.images[0] && <img src={bp.product.images[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="text-xs text-primary uppercase tracking-widest mb-1">{bp.product.brandName}</div>
              <div className="text-white text-sm mb-1">{bp.product.name}</div>
              <div className="text-muted-foreground text-xs">{formatPrice(bp.product.sellingPrice)}</div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-[120px]">
              {bp.status === 'reserved' ? (
                <>
                  <button 
                    onClick={() => handleMarkStatus(bp.id, 'sold', bp.product.sellingPrice)}
                    className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs uppercase tracking-widest rounded flex items-center justify-center transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Keep
                  </button>
                  <button 
                    onClick={() => handleMarkStatus(bp.id, 'returned', bp.product.sellingPrice)}
                    className="flex-1 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white text-xs uppercase tracking-widest rounded flex items-center justify-center transition-colors"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Return
                  </button>
                </>
              ) : (
                <div className={`h-full flex items-center justify-center text-xs tracking-widest uppercase rounded border ${bp.status === 'sold' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-white/10 text-muted-foreground bg-white/5'}`}>
                  {bp.status}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {visit.status !== 'completed' && (
        <div className="fixed bottom-0 right-0 left-80 p-6 bg-background/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Due</div>
            <div className="text-2xl font-serif text-white">{formatPrice(soldTotal)}</div>
          </div>
          
          <Button 
            size="lg" 
            className="px-10 h-14 uppercase tracking-widest text-sm"
            disabled={!allProcessed || generateInvoice.isPending}
            onClick={handleCheckout}
          >
            {generateInvoice.isPending ? 'Processing...' : 'Complete & Generate Invoice'}
          </Button>
        </div>
      )}
    </div>
  );
}
