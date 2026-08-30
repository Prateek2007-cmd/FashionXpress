import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, Edit2, Save, X, Trophy, TrendingUp, Package,
  Percent, Award, Star, Crown, Medal, Plus, Trash2, Tag
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils';

const RENDER_API = 'https://fashionxpress.onrender.com';

interface BrandRow {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  commissionRate: number;
  revenue: number;
  productCount: number;
}

const RANK_CONFIG = [
  { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: '1st' },
  { icon: Trophy, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/30', label: '2nd' },
  { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-700/10 border-amber-700/30', label: '3rd' },
];

export function AdminBrandsCommissionPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  // Add Brand state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandRate, setNewBrandRate] = useState('12.00');
  const [isAdding, setIsAdding] = useState(false);

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${RENDER_API}/api/admin/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Failed to load brands', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBrands();
  }, [token]);

  const startEdit = (brand: BrandRow) => {
    setEditingId(brand.id);
    setEditValue(brand.commissionRate.toFixed(2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveCommission = async (brandId: number, brandName: string) => {
    const rate = parseFloat(editValue);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: 'Invalid rate', description: 'Enter a value between 0 and 100', variant: 'destructive' });
      return;
    }
    setSavingId(brandId);
    try {
      const res = await fetch(`${RENDER_API}/api/admin/brands/${brandId}/commission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ commissionRate: rate }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setBrands(prev => prev.map(b => b.id === brandId ? { ...b, commissionRate: rate } : b));
      toast({ title: `✅ ${brandName} commission updated to ${rate}%` });
      setEditingId(null);
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      toast({ title: 'Brand name is required', variant: 'destructive' });
      return;
    }
    const rate = parseFloat(newBrandRate || '10');
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: 'Commission rate must be between 0% and 100%', variant: 'destructive' });
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`${RENDER_API}/api/admin/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newBrandName.trim(), commissionRate: rate }),
      });
      if (!res.ok) throw new Error('Failed to add brand');
      toast({ title: '🎉 Brand Added!', description: `${newBrandName} added with ${rate}% commission.` });
      setIsAddOpen(false);
      setNewBrandName('');
      setNewBrandRate('12.00');
      fetchBrands();
    } catch (err: any) {
      toast({ title: 'Failed to add brand', description: err.message, variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBrand = async (brand: BrandRow) => {
    if (!confirm(`Are you sure you want to delete brand "${brand.name}"?`)) return;
    try {
      const res = await fetch(`${RENDER_API}/api/admin/brands/${brand.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: `🗑️ ${brand.name} deleted` });
      fetchBrands();
    } catch {
      toast({ title: 'Failed to delete brand', variant: 'destructive' });
    }
  };

  const totalRevenue = brands.reduce((s, b) => s + b.revenue, 0);
  const totalCommission = brands.reduce((s, b) => s + (b.revenue * b.commissionRate) / 100, 0);

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white mb-1">Brand Leaderboard & Commissions</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Revenue rankings and per-brand commission rates
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wider uppercase text-xs h-11 px-5 rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Partner Brand
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-white">{brands.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Partner Brands</div>
          </div>
        </div>

        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-serif font-bold text-white">{formatPrice(totalRevenue)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total GMV</div>
          </div>
        </div>

        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-serif font-bold text-white">{formatPrice(totalCommission)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Est. Commission</div>
          </div>
        </div>

        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-white">
              {brands.reduce((s, b) => s + b.productCount, 0)}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Products</div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {brands.length >= 3 && (
        <div>
          <h2 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full inline-block" />
            Top Performers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brands.slice(0, 3).map((brand, idx) => {
              const cfg = RANK_CONFIG[idx];
              const Icon = cfg.icon;
              const commission = (brand.revenue * brand.commissionRate) / 100;
              return (
                <div key={brand.id} className={`border rounded-2xl p-6 ${cfg.bg} relative overflow-hidden`}>
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-bold ${cfg.color} uppercase tracking-widest`}>{cfg.label}</span>
                  </div>
                  <Icon className={`w-8 h-8 ${cfg.color} mb-3`} />
                  <div className="text-white font-serif font-bold text-lg mb-1">{brand.name}</div>
                  <div className="text-2xl font-mono font-bold text-white mb-2">{formatPrice(brand.revenue)}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{brand.productCount} products</span>
                    <span className="text-emerald-400 font-bold">{brand.commissionRate}% → {formatPrice(commission)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Table */}
      <div>
        <h2 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full inline-block" />
          All Brands & Commission Rates
        </h2>

        <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-white/5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold bg-white/[0.02]">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Brand Name</div>
            <div className="col-span-2 text-right">Products</div>
            <div className="col-span-2 text-right">GMV</div>
            <div className="col-span-2 text-right">Commission Rate</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {brands.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No brands added yet. Click "Add Partner Brand" above to get started.</p>
            </div>
          ) : (
            brands.map((brand, idx) => {
              const isEditing = editingId === brand.id;
              const isSaving = savingId === brand.id;
              const commission = (brand.revenue * brand.commissionRate) / 100;
              const rankColor = idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground';

              return (
                <div
                  key={brand.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors ${isEditing ? 'bg-primary/5' : ''}`}
                >
                  {/* Rank */}
                  <div className={`col-span-1 font-mono font-bold text-sm ${rankColor}`}>
                    {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                  </div>

                  {/* Brand Name */}
                  <div className="col-span-4">
                    <div className="font-semibold text-white text-sm">{brand.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{brand.slug}</div>
                  </div>

                  {/* Products */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-white font-mono">{brand.productCount}</span>
                  </div>

                  {/* Revenue */}
                  <div className="col-span-2 text-right">
                    <div className="text-sm text-white font-mono font-bold">{formatPrice(brand.revenue)}</div>
                    <div className="text-[10px] text-emerald-400">+{formatPrice(commission)} est. comm.</div>
                  </div>

                  {/* Commission Rate */}
                  <div className="col-span-2 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-20 h-8 text-sm text-right bg-black/40 border-primary/40 rounded-lg font-mono font-bold text-primary"
                          autoFocus
                        />
                        <span className="text-muted-foreground text-sm">%</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(brand)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors group"
                        title="Click to edit commission rate"
                      >
                        <Percent className="w-3 h-3 text-primary" />
                        <span className="text-primary font-bold text-sm">{brand.commissionRate}%</span>
                        <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          className="h-8 px-2.5 text-xs gap-1"
                          onClick={() => saveCommission(brand.id, brand.name)}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-white"
                          onClick={cancelEdit}
                          disabled={isSaving}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg"
                          onClick={() => startEdit(brand)}
                          title="Edit Commission Rate"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          onClick={() => handleDeleteBrand(brand)}
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Brand Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-foreground font-serif">
              <Tag className="w-5 h-5 text-primary" /> Add New Partner Brand
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddBrand} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                Brand Name *
              </label>
              <Input
                placeholder="e.g. Devi Fashion, Kanchipuram Silks"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                Commission Rate (%) *
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="e.g. 12.00"
                value={newBrandRate}
                onChange={(e) => setNewBrandRate(e.target.value)}
                className="bg-background border-border font-mono text-foreground"
                required
              />
              <p className="text-[11px] text-muted-foreground">Platform commission percentage earned per sale.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="flex-1 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs gap-2"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Brand
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
