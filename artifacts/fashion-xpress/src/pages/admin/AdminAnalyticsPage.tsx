import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  Loader2, TrendingUp, ShoppingBag, Package, Users, Star, Palette,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─── Palette ───────────────────────────────────────────────────────────────
const COLORS = ['#a855f7', '#ec4899', '#f97316', '#facc15', '#22d3ee', '#4ade80', '#fb7185', '#818cf8'];

// ─── Custom Tooltip ────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/80 backdrop-blur border border-white/10 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-medium" style={{ color: p.color || p.fill }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-card/30 border border-white/10 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center border ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
      <span className="w-1 h-5 bg-primary rounded-full inline-block" />
      {title}
    </h2>
  );
}

// ─── Horizontal bar (top-N list) ───────────────────────────────────────────
function HorizBar({ name, count, max, color }: { name: string; count: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-muted-foreground truncate text-right">{name}</div>
      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${(count / max) * 100}%`, background: color }} />
      </div>
      <div className="w-8 text-xs text-right text-white/60">{count}</div>
    </div>
  );
}

// ─── Status badge colours ──────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: '#f97316',
  confirmed: '#22d3ee',
  executive_assigned: '#a855f7',
  in_progress: '#facc15',
  completed: '#4ade80',
  cancelled: '#f43f5e',
  rejected: '#94a3b8',
};

export function AdminAnalyticsPage() {
  const { token } = useAuth();

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://fashionxpress.onrender.com";

  const { data: summary, isLoading: sl } = useQuery<any>({
    queryKey: ['/api/admin/dashboard/summary'],
    queryFn: async () => {
      console.log("API_BASE:", API_BASE);
      console.log("Request URL:", `${API_BASE}/api/admin/dashboard/summary`);
      const res = await fetch(`${API_BASE}/api/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: analytics, isLoading: al } = useQuery<any>({
    queryKey: ['/api/admin/dashboard/analytics'],
    queryFn: async () => {
      console.log("API_BASE:", API_BASE);
      console.log("Request URL:", `${API_BASE}/api/admin/dashboard/analytics`);
      const res = await fetch(`${API_BASE}/api/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: brandRevenue, isLoading: bl } = useQuery<any[]>({
    queryKey: ['/api/admin/dashboard/brand-revenue'],
    queryFn: async () => {
      console.log("API_BASE:", API_BASE);
      console.log("Request URL:", `${API_BASE}/api/admin/dashboard/brand-revenue`);
      const res = await fetch(`${API_BASE}/api/admin/dashboard/brand-revenue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const isLoading = sl || al || bl;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const revenueData = (analytics?.revenueByDay ?? []).map((r: any) => ({
    ...r,
    date: (() => { try { return format(parseISO(r.date), 'MMM d'); } catch { return r.date; } })(),
  }));

  const statusData = (analytics?.bookingsByStatus ?? []).map((s: any) => ({
    name: s.name.replace(/_/g, ' '),
    value: s.count,
    fill: STATUS_COLORS[s.name] ?? '#a855f7',
  }));

  const maxSelected = analytics?.mostSelectedProducts?.[0]?.count ?? 1;
  const maxSold = analytics?.mostSoldProducts?.[0]?.count ?? 1;
  const maxColor = analytics?.popularColors?.[0]?.count ?? 1;
  const maxSize = analytics?.popularSizes?.[0]?.count ?? 1;

  return (
    <div className="p-8 max-w-7xl mx-auto text-white space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif mb-2">Analytics</h1>
        <p className="text-muted-foreground">A full overview of your business performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="Total Revenue" value={`₹${(summary?.totalRevenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="bg-green-500/10 border-green-500/30 text-green-500" />
        <KpiCard icon={ShoppingBag} label="Total Bookings" value={String(summary?.todaysBookings ?? 0)} color="bg-blue-500/10 border-blue-500/30 text-blue-500" />
        <KpiCard icon={Users} label="Customers" value={String(summary?.totalCustomers ?? 0)} color="bg-primary/10 border-primary/30 text-primary" />
        <KpiCard icon={Package} label="Products" value={String(summary?.totalProducts ?? 0)} color="bg-amber-500/10 border-amber-500/30 text-amber-500" />
        <KpiCard icon={Star} label="Conversion Rate" value={`${((summary?.conversionRate ?? 0) * 100).toFixed(1)}%`} color="bg-pink-500/10 border-pink-500/30 text-pink-500" />
        <KpiCard icon={TrendingUp} label="Avg Bill" value={`₹${(summary?.averageBill ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="bg-cyan-500/10 border-cyan-500/30 text-cyan-500" />
        <KpiCard icon={Package} label="Low Stock Items" value={String(summary?.lowStockCount ?? 0)} color="bg-red-500/10 border-red-500/30 text-red-500" />
        <KpiCard icon={Users} label="Executives" value={String(summary?.totalExecutives ?? 0)} color="bg-violet-500/10 border-violet-500/30 text-violet-500" />
      </div>

      {/* Revenue Over Time */}
      <div className="bg-card/30 border border-white/10 rounded-xl p-6">
        <SectionHeader title="Revenue Over Time" />
        {revenueData.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">No revenue data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#a855f7" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bookings by Status + Brand Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Pie */}
        <div className="bg-card/30 border border-white/10 rounded-xl p-6">
          <SectionHeader title="Bookings by Status" />
          {statusData.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No booking data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Brand Revenue Bar */}
        <div className="bg-card/30 border border-white/10 rounded-xl p-6">
          <SectionHeader title="Brand Revenue (₹)" />
          {!brandRevenue?.length ? (
            <div className="py-10 text-center text-muted-foreground">No brand sales yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={brandRevenue} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <YAxis type="category" dataKey="brandName" tick={{ fill: '#d1d5db', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {(brandRevenue ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products + Popular Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Selected */}
        <div className="bg-card/30 border border-white/10 rounded-xl p-6">
          <SectionHeader title="Most Added to Bookings" />
          {!analytics?.mostSelectedProducts?.length ? (
            <div className="py-6 text-center text-muted-foreground">No data yet.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {analytics.mostSelectedProducts.map((p: any, i: number) => (
                <HorizBar key={i} name={p.name} count={p.count} max={maxSelected} color={COLORS[i % COLORS.length]} />
              ))}
            </div>
          )}
        </div>

        {/* Most Sold */}
        <div className="bg-card/30 border border-white/10 rounded-xl p-6">
          <SectionHeader title="Most Sold Products" />
          {!analytics?.mostSoldProducts?.length ? (
            <div className="py-6 text-center text-muted-foreground">No sales yet.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {analytics.mostSoldProducts.map((p: any, i: number) => (
                <HorizBar key={i} name={p.name} count={p.count} max={maxSold} color={COLORS[i % COLORS.length]} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Colors + Sizes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card/30 border border-white/10 rounded-xl p-6">
          <SectionHeader title="Popular Colors" />
          {!analytics?.popularColors?.length ? (
            <div className="py-6 text-center text-muted-foreground">No color data yet.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {analytics.popularColors.map((c: any, i: number) => (
                <HorizBar key={i} name={c.name ?? '—'} count={c.count} max={maxColor} color={COLORS[i % COLORS.length]} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-card/30 border border-white/10 rounded-xl p-6">
          <SectionHeader title="Popular Sizes" />
          {!analytics?.popularSizes?.length ? (
            <div className="py-6 text-center text-muted-foreground">No size data yet.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {analytics.popularSizes.map((s: any, i: number) => (
                <HorizBar key={i} name={s.name ?? '—'} count={s.count} max={maxSize} color={COLORS[i % COLORS.length]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
