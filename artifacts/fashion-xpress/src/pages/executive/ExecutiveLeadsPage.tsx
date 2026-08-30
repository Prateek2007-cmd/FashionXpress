import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Loader2, Phone, MessageCircle, Navigation, MapPin, Calendar, Clock,
  Sparkles, CheckCircle2, ChevronRight, Package, User, Shirt, AlertCircle,
  Car, DoorOpen, PlayCircle, CreditCard
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/api-config';

interface LeadProduct {
  id: number;
  bookingId: number;
  productId: number;
  status: string;
  priceAtSale: number;
  product: {
    id: number;
    name: string;
    sku: string;
    sellingPrice: number;
    mrp: number;
    images: string[];
    brandName: string;
    categoryName: string;
  } | null;
}

interface Lead {
  id: number;
  customerName: string;
  phone: string;
  addressText: string;
  pincode: string | null;
  preferredDate: string;
  preferredTime: string;
  preferredFit: string | null;
  topSize: string | null;
  bottomSize: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  products: LeadProduct[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  executive_assigned: { label: 'Assigned', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
  en_route: { label: 'En Route', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  arrived: { label: 'Arrived at Doorstep', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
  in_progress: { label: 'Fitting in Progress', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
  completed: { label: 'Completed & Paid', bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400' },
};

export function ExecutiveLeadsPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const API_BASE = getApiBaseUrl();

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/executives/me/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load leads');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setLeads(list);
      if (list.length > 0 && !selectedLead) {
        setSelectedLead(list[0]);
      }
    } catch (err: any) {
      toast({ title: 'Failed to load assigned leads', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLeads();
  }, [token]);

  const updateStatus = async (leadId: number, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`${API_BASE}/api/executives/me/visits/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast({ title: `Status Updated`, description: `Visit status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}` });
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      toast({ title: 'Failed to update status', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeLeads = leads.filter(l => l.status !== 'completed' && l.status !== 'cancelled');
  const completedLeads = leads.filter(l => l.status === 'completed');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Assigned Customer Leads</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Manage your doorstep styling visits, customer context, and live visit status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
            {activeLeads.length} Active {activeLeads.length === 1 ? 'Visit' : 'Visits'}
          </span>
          <Button onClick={fetchLeads} variant="outline" size="sm" className="text-xs gap-1.5">
            Refresh
          </Button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold text-foreground mb-1">No Leads Assigned Yet</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            When an admin assigns a home visit booking to you, it will appear here with full customer details and trial bag products.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Leads List */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> Active Schedule ({leads.length})
            </h2>

            {leads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              const statusCfg = STATUS_CONFIG[lead.status] || { label: lead.status, bg: 'bg-muted', text: 'text-muted-foreground' };

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-card border-primary ring-1 ring-primary/40 shadow-lg'
                      : 'bg-card/40 border-border hover:bg-card hover:border-border/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                        {lead.customerName}
                        <span className="text-[10px] font-mono text-muted-foreground">#VISIT-{lead.id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-primary" /> {lead.preferredTime} · {lead.preferredDate}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground line-clamp-1 mb-3">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>{lead.addressText} {lead.pincode ? `(${lead.pincode})` : ''}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                    <span className="text-muted-foreground">
                      Suitcase: <strong className="text-foreground">{lead.products.length} Items</strong>
                    </span>
                    <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Lead <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Lead Detail & Status Control Panel */}
          <div className="lg:col-span-7">
            {selectedLead ? (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xl sticky top-6">

                {/* Lead Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        #LEAD-{selectedLead.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${STATUS_CONFIG[selectedLead.status]?.bg || ''} ${STATUS_CONFIG[selectedLead.status]?.text || ''}`}>
                        {STATUS_CONFIG[selectedLead.status]?.label || selectedLead.status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-foreground">{selectedLead.customerName}</h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Scheduled: {selectedLead.preferredDate} at {selectedLead.preferredTime}
                    </p>
                  </div>

                  {/* 1-Click Call, WhatsApp & Navigation Shortcuts */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(selectedLead.customerName)},%20I%20am%20your%20Fashion%20Executive%20from%20The%20Fashion%20Xpress.%20I%20am%20preparing%20your%20curated%20trial%20bag.`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs font-bold transition-colors"
                      title="Open WhatsApp Chat"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.addressText + ' ' + (selectedLead.pincode || ''))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-colors"
                      title="Navigate via Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Maps
                    </a>
                  </div>
                </div>

                {/* 🚗 One-Tap Visit Status Bar */}
                <div className="bg-background border border-border rounded-xl p-4 space-y-2.5">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block">
                    Update Visit Progress
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant={selectedLead.status === 'en_route' ? 'default' : 'outline'}
                      onClick={() => updateStatus(selectedLead.id, 'en_route')}
                      disabled={updatingId === selectedLead.id}
                      className="h-10 text-xs font-semibold gap-1.5"
                    >
                      <Car className="w-3.5 h-3.5 text-blue-400" /> En Route
                    </Button>

                    <Button
                      size="sm"
                      variant={selectedLead.status === 'arrived' ? 'default' : 'outline'}
                      onClick={() => updateStatus(selectedLead.id, 'arrived')}
                      disabled={updatingId === selectedLead.id}
                      className="h-10 text-xs font-semibold gap-1.5"
                    >
                      <DoorOpen className="w-3.5 h-3.5 text-amber-400" /> Arrived
                    </Button>

                    <Button
                      size="sm"
                      variant={selectedLead.status === 'in_progress' ? 'default' : 'outline'}
                      onClick={() => updateStatus(selectedLead.id, 'in_progress')}
                      disabled={updatingId === selectedLead.id}
                      className="h-10 text-xs font-semibold gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-emerald-400" /> Fitting
                    </Button>
                  </div>
                </div>

                {/* Customer Context & Fit Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block">
                      Delivery Address
                    </span>
                    <p className="text-xs text-foreground font-medium">{selectedLead.addressText}</p>
                    {selectedLead.pincode && (
                      <span className="text-[11px] text-primary font-mono font-bold block mt-1">
                        Pincode: {selectedLead.pincode}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block">
                      Customer Fit & Size Profile
                    </span>
                    <div className="text-xs text-foreground font-medium flex items-center gap-3">
                      <span>Top: <strong>{selectedLead.topSize || '-'}</strong></span>
                      <span>Bottom: <strong>{selectedLead.bottomSize || '-'}</strong></span>
                      <span>Fit: <strong className="capitalize">{selectedLead.preferredFit || '-'}</strong></span>
                    </div>
                    {selectedLead.notes && (
                      <p className="text-[11px] text-muted-foreground italic mt-1">"{selectedLead.notes}"</p>
                    )}
                  </div>
                </div>

                {/* Garments in Trial Bag */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-primary" /> Suitcase Garments ({selectedLead.products.length})
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedLead.products.map((bp) => {
                      const prod = bp.product;
                      return (
                        <div key={bp.id} className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 rounded-lg bg-card/80 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                              {prod?.images?.[0] ? (
                                <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-foreground">{prod?.name || 'Garment'}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{prod?.brandName} · {prod?.sku}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-foreground">{formatPrice(bp.priceAtSale || prod?.sellingPrice || 0)}</div>
                            <span className={`text-[10px] font-semibold uppercase ${bp.status === 'sold' ? 'text-green-400' : bp.status === 'returned' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                              {bp.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action: Proceed to Doorstep Checkout */}
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => setLocation(`/executive/checkout?bookingId=${selectedLead.id}`)}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest uppercase text-xs rounded-xl shadow-lg shadow-primary/20 gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Start Doorstep Fitting & Payment
                  </Button>
                </div>

              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
                Select a lead on the left to view customer context and visit controls.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
