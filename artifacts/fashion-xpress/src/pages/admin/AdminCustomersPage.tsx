import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Search, User, TrendingUp, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

type Customer = {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  lifetimeSpend: number;
  createdAt: string;
};

export function AdminCustomersPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');

  const API_BASE =
    import.meta.env.VITE_API_URL || "";

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/admin/customers'],
    queryFn: async () => {
      console.log("API_BASE:", API_BASE);
      console.log("Request URL:", `${API_BASE}/api/admin/customers`);
      const res = await fetch(`${API_BASE}/api/admin/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)),
    );
  }, [customers, search]);

  const totalRevenue = useMemo(
    () => (customers ?? []).reduce((sum, c) => sum + c.lifetimeSpend, 0),
    [customers],
  );

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif mb-2">Customers</h1>
        <p className="text-muted-foreground">View and manage your customer base.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-card/30 border border-white/10 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">{customers?.length ?? '—'}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Total Customers</div>
          </div>
        </div>
        <div className="bg-card/30 border border-white/10 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Total Lifetime Spend</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="pl-9 bg-black/40 border-white/10"
        />
      </div>

      {/* Table */}
      <div className="bg-card/30 border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {search ? 'No customers match your search.' : 'No customers found yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-muted-foreground uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Phone</th>
                  <th className="p-4 font-medium text-right">Lifetime Spend</th>
                  <th className="p-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                          <span className="text-primary font-semibold">{c.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {c.phone ?? <span className="italic text-white/30">—</span>}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`font-semibold ${
                          c.lifetimeSpend > 0 ? 'text-green-400' : 'text-muted-foreground'
                        }`}
                      >
                        ₹{c.lifetimeSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(c.createdAt), 'MMM d, yyyy')}
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
