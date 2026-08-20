import React, { useState } from 'react';
import { 
  useGetDashboardSummary, 
  useListBookings,
  useUpdateBookingStatus,
  useGetDashboardAnalytics
} from '@workspace/api-client-react';
import { formatPrice } from '@/lib/utils';
import { 
  Loader2, TrendingUp, Users, ShoppingBag, Calendar, AlertCircle, 
  Check, ArrowRight, ShieldCheck, Tag, PlusCircle, Sparkles, Award, Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',            // Gold
  confirmed: '#06b6d4',          // Cyan
  executive_assigned: '#a855f7', // Purple
  in_progress: '#f97316',        // Orange
  completed: '#10b981',          // Emerald
  cancelled: '#ef4444',          // Red
  rejected: '#6b7280',           // Gray
};

const formatStatusName = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-xs shadow-2xl">
      <p className="text-muted-foreground mb-1 font-mono uppercase tracking-wider">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold text-white">
          {p.name}: <span className="text-primary font-mono">{formatPrice(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const { toast } = useToast();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: recentBookings, isLoading: loadingBookings, refetch } = useListBookings({ status: 'pending' });
  const { data: analytics, isLoading: loadingAnalytics } = useGetDashboardAnalytics();
  const updateStatus = useUpdateBookingStatus();

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const { data: brandRevenue, isLoading: loadingBrandRevenue } = useQuery<{ brandName: string; quantitySold: number; revenue: number }[]>({
    queryKey: ['brand-revenue'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/admin/dashboard/brand-revenue`);
      if (!res.ok) throw new Error('Failed to fetch brand revenue');
      return res.json();
    }
  });

  const handleApprove = (id: number) => {
    updateStatus.mutate({ id, data: { status: 'confirmed' } }, {
      onSuccess: () => {
        toast({ title: 'Booking Approved Successfully' });
        refetch();
      }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loadingSummary || loadingAnalytics) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm tracking-wider uppercase">Loading Dashboard Console...</p>
      </div>
    );
  }

  // Format revenue history dates
  const chartData = (analytics?.revenueByDay || []).map((item: any) => {
    try {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIdx = parseInt(parts[1], 10) - 1;
        return {
          ...item,
          formattedDate: `${monthNames[monthIdx]} ${parts[2]}`
        };
      }
    } catch {}
    return { ...item, formattedDate: item.date };
  });

  // Format booking status data for Pie chart
  const pieData = (analytics?.bookingsByStatus || []).map((item: any) => ({
    name: formatStatusName(item.name),
    value: item.count,
    rawName: item.name
  }));

  const maxBrandRevenue = brandRevenue && brandRevenue.length > 0 
    ? Math.max(...brandRevenue.map(b => b.revenue)) 
    : 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      
      {/* Dynamic Welcome Hero Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-card to-card/40 border border-white/5 rounded-2xl p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-[100px] pointer-events-none"></div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs uppercase tracking-widest font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Console Active
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-white">{getGreeting()}, Administrator</h1>
          <p className="text-muted-foreground text-sm max-w-lg">Welcome back. The platform is running smoothly. All services and staff integrations are currently active.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/products">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs uppercase tracking-widest text-white transition-all font-semibold">
              <PlusCircle className="w-4 h-4 text-primary" /> Add Product
            </button>
          </Link>
          <Link href="/admin/bookings">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all shadow-lg">
              <Calendar className="w-4 h-4" /> Manage Visits
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/20 transition-all duration-300 shadow-xl">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl group-hover:bg-primary/10 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">+12.4%</span>
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Revenue</div>
          <div className="text-3xl font-serif text-white tracking-wide">{formatPrice(summary?.totalRevenue || 0)}</div>
        </div>

        {/* Today's Visits */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300 shadow-xl">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl group-hover:bg-blue-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Scheduled</span>
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Today's Visits</div>
          <div className="text-3xl font-serif text-white tracking-wide">{summary?.todaysBookings || 0} <span className="text-sm font-sans text-muted-foreground font-normal">Active</span></div>
        </div>

        {/* Customers */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300 shadow-xl">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl group-hover:bg-purple-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Members</span>
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Registered Customers</div>
          <div className="text-3xl font-serif text-white tracking-wide">{summary?.totalCustomers || 0}</div>
        </div>

        {/* Low Stock count */}
        <div className={`bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl ${summary?.lowStockCount ? 'hover:border-red-500/20' : 'hover:border-emerald-500/20'}`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${summary?.lowStockCount ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            {summary?.lowStockCount ? (
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Warning
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Good</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Low Stock Products</div>
          <div className={`text-3xl font-serif tracking-wide ${summary?.lowStockCount ? 'text-red-400' : 'text-white'}`}>{summary?.lowStockCount || 0} <span className="text-sm font-sans text-muted-foreground font-normal">low items</span></div>
        </div>
      </div>

      {/* Visual Charts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Trend AreaChart */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-2">
          <h3 className="font-serif text-lg text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full inline-block" /> Sales Revenue Trend
          </h3>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#deb32b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#deb32b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="formattedDate" stroke="#666" fontSize={10} tickLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#deb32b" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-wider">No transaction history recorded.</div>
            )}
          </div>
        </div>

        {/* Booking Status Split (Pie Chart) */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl">
          <h3 className="font-serif text-lg text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full inline-block" /> Booking Status Split
          </h3>
          <div className="h-60 w-full flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.rawName] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-xs uppercase tracking-wider">No booking statistics.</div>
            )}
          </div>
          {/* Custom Status Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {pieData.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.rawName] || '#94a3b8' }} />
                <span className="text-muted-foreground truncate">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approvals and Products Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pending Approvals */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-lg text-white flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block" /> Pending Approvals
            </h3>
            {recentBookings && recentBookings.length > 0 && (
              <span className="bg-primary/20 text-primary border border-primary/20 px-2.5 py-0.5 rounded text-xs font-bold font-mono">{recentBookings.length} pending</span>
            )}
          </div>

          {loadingBookings ? (
            <div className="py-12 flex-grow flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !recentBookings || recentBookings.length === 0 ? (
            <div className="border border-white/5 border-dashed rounded-xl p-12 text-center bg-white/[0.01] flex-grow flex flex-col items-center justify-center gap-3">
              <ShieldCheck className="w-8 h-8 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">All pending bookings are cleared. You are fully caught up!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 no-scrollbar flex-grow">
              {recentBookings.map((b) => (
                <div key={b.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {b.name ? b.name.substring(0,2) : 'G'}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{b.name || 'Guest Customer'}</div>
                        <div className="text-muted-foreground text-xs">{b.phone}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" /> {b.preferredDate} ({b.preferredTime})</span>
                      <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-primary" /> {b.products.length} trial items</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <button 
                      onClick={() => handleApprove(b.id)}
                      disabled={updateStatus.isPending}
                      className="text-xs bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1 disabled:opacity-50"
                    >
                      Approve <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Products List */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="font-serif text-lg text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full inline-block" /> Top Trial Selection
          </h3>
          {loadingAnalytics ? (
            <div className="py-12 flex-grow flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !analytics?.mostSelectedProducts || analytics.mostSelectedProducts.length === 0 ? (
            <div className="border border-white/5 border-dashed rounded-xl p-12 text-center bg-white/[0.01] flex-grow flex flex-col items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">No items selected by customers yet.</p>
            </div>
          ) : (
            <div className="space-y-5 flex-grow">
              {(analytics.mostSelectedProducts as any[]).slice(0, 4).map((p, index) => {
                const maxCount = Math.max(...(analytics.mostSelectedProducts as any[]).map(x => x.count)) || 1;
                const percentage = (p.count / maxCount) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-bold">#0{index+1}</span>
                        <span className="text-white font-medium truncate max-w-xs">{p.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs font-semibold">{p.count} selections</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary/70 to-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Brand Sales & Commission Dashboard Section */}
      <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl">
        <h3 className="font-serif text-lg text-white mb-6 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full inline-block" /> Brand Leaderboard & Commissions
        </h3>
        
        {loadingBrandRevenue ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !brandRevenue || brandRevenue.length === 0 ? (
          <div className="border border-white/5 border-dashed rounded-xl p-12 text-center bg-card/20">
            <p className="text-muted-foreground">No brand revenue details are registered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 bg-white/[0.01]">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Brand Name</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Quantity Sold</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Revenue Share</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs">Revenue</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground uppercase tracking-widest text-xs text-right">Commission (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {brandRevenue.map((br, index) => (
                  <tr key={index} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Award className={`w-4 h-4 ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-white font-medium">{br.brandName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-mono">{br.quantitySold} pcs</td>
                    <td className="px-6 py-4 w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="flex-grow bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full" 
                            style={{ width: `${(br.revenue / maxBrandRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold w-8 text-right">
                          {Math.round((br.revenue / maxBrandRevenue) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-mono">{formatPrice(br.revenue)}</td>
                    <td className="px-6 py-4 text-right text-primary font-bold font-mono">{formatPrice(br.revenue * 0.1)}</td>
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
