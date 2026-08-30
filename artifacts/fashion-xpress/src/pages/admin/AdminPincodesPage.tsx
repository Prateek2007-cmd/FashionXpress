import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, ToggleLeft, ToggleRight, Search, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API = 'https://fashionxpress.onrender.com';

interface Pincode {
  id: number;
  pincode: string;
  area: string;
  city: string;
  state: string;
  isActive: boolean;
}

export function AdminPincodesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ pincode: '', area: '', city: '', state: 'Telangana' });
  const [saving, setSaving] = useState(false);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/pincodes/all`, { headers: authHeaders });
      const data = await res.json();
      setPincodes(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Failed to load pincodes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPincodes(); }, []);

  const handleAdd = async () => {
    if (!form.pincode || form.pincode.length !== 6 || !/^\d+$/.test(form.pincode)) {
      toast({ title: 'Enter a valid 6-digit pincode', variant: 'destructive' }); return;
    }
    if (!form.area || !form.city) {
      toast({ title: 'Area and city are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/pincodes`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: 'Pincode added!', description: `${form.pincode} - ${form.area}` });
      setAddOpen(false);
      setForm({ pincode: '', area: '', city: '', state: 'Telangana' });
      fetchPincodes();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleToggle = async (p: Pincode) => {
    try {
      await fetch(`${API}/api/pincodes/${p.id}`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify({ isActive: !p.isActive }),
      });
      toast({ title: `${p.pincode} ${!p.isActive ? 'enabled' : 'disabled'}` });
      fetchPincodes();
    } catch { toast({ title: 'Failed to update', variant: 'destructive' }); }
  };

  const handleDelete = async (p: Pincode) => {
    if (!confirm(`Delete pincode ${p.pincode} - ${p.area}? This will stop products from appearing in this area.`)) return;
    try {
      await fetch(`${API}/api/pincodes/${p.id}`, { method: 'DELETE', headers: authHeaders });
      toast({ title: 'Pincode deleted' });
      fetchPincodes();
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const filtered = pincodes.filter((p) =>
    p.pincode.includes(search) ||
    p.area.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const active = pincodes.filter((p) => p.isActive).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            Pincode Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Control which areas can be served. Customers can only see products from merchants in their pincode.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Pincode
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Areas', value: pincodes.length, color: 'text-foreground' },
          { label: 'Active', value: active, color: 'text-emerald-500' },
          { label: 'Inactive', value: pincodes.length - active, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search pincode, area or city..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {pincodes.length === 0 ? (
            <div>
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No pincodes yet</p>
              <p className="text-sm">Add your first service area to start</p>
            </div>
          ) : 'No pincodes match your search'}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-widest">Pincode</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-widest">Area</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-widest">City / State</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-widest">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                  <td className="px-4 py-3 font-mono font-bold text-primary">{p.pincode}</td>
                  <td className="px-4 py-3 font-medium">{p.area}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.city}, {p.state}</td>
                  <td className="px-4 py-3 text-center">
                    {p.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-xs font-semibold">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(p)}
                        className={`gap-1.5 text-xs ${p.isActive ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                      >
                        {p.isActive ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        {p.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(p)}
                        className="gap-1.5 text-xs text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Add Service Area
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 block">Pincode *</label>
              <Input
                placeholder="e.g. 504001"
                maxLength={6}
                inputMode="numeric"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                className="font-mono tracking-widest"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 block">Area Name *</label>
              <Input placeholder="e.g. Adilabad Main Market" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 block">City *</label>
              <Input placeholder="e.g. Adilabad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 block">State</label>
              <Input placeholder="e.g. Telangana" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <Button onClick={handleAdd} disabled={saving} className="w-full mt-2 gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Pincode
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
