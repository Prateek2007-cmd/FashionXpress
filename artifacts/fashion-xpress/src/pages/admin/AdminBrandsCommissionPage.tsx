import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, Edit2, Save, X, Trophy, TrendingUp, Package,
  Percent, Award, Star, Crown, Medal
} from 'lucide-react';
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

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${RENDER_API}/api/admin/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBrands(data);
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
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-serif text-white mb-1">Brand Leaderboard & Commissions</h1>
        <p className="text-muted-foreground text-sm tracking-widest uppercase">
          Revenue rankings and per-brand commission rates
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-white">{brands.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Brands</div>
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
          All Brands — Commission Editor
        </h2>

        <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Brand</div>
            <div className="col-span-2 text-right">Products</div>
            <div className="col-span-2 text-right">GMV</div>
            <div className="col-span-2 text-right">Commission</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {brands.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No brands yet. Add products with brand names to see them here.</p>
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
                  <div className="col-span-3">
                    <div className="font-medium text-white">{brand.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{brand.slug}</div>
                  </div>

                  {/* Products */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-white font-mono">{brand.productCount}</span>
                  </div>

                  {/* Revenue */}
                  <div className="col-span-2 text-right">
                    <div className="text-sm text-white font-mono">{formatPrice(brand.revenue)}</div>
                    <div className="text-[10px] text-emerald-400">+{formatPrice(commission)} comm.</div>
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
                          className="w-20 h-8 text-sm text-right bg-black/40 border-primary/40"
                          autoFocus
                        />
                        <span className="text-muted-foreground text-sm">%</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <Percent className="w-3 h-3 text-primary" />
                        <span className="text-primary font-bold text-sm">{brand.commissionRate}%</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs gap-1"
                          onClick={() => saveCommission(brand.id, brand.name)}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={cancelEdit}
                          disabled={isSaving}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs gap-1 border-white/10 hover:border-primary/40"
                        onClick={() => startEdit(brand)}
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit %
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Star className="w-3 h-3" />
          Commission is calculated on GMV (selling price × stock). Sorted by revenue.
        </p>
      </div>
    </div>
  );
}
