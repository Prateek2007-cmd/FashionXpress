import React, { useState } from 'react';
import { useListExecutives, useCreateExecutive } from '@workspace/api-client-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Loader2, UserPlus, Star, Pencil, Trash2, Check, X, Shield,
  KeyRound, UserCheck, ExternalLink, Phone, Mail, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/api-config';
import { Link } from 'wouter';

type ExecEditState = {
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
};

export function AdminExecutivesPage() {
  const { data: executives, isLoading } = useListExecutives();
  const createExecutive = useCreateExecutive();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<ExecEditState>({ name: '', email: '', phone: '', photoUrl: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', photoUrl: ''
  });

  const API_BASE = getApiBaseUrl();

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ExecEditState> }) => {
      const res = await fetch(`${API_BASE}/api/executives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update executive');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Executive details updated.' });
      queryClient.invalidateQueries({ queryKey: ['/executives'] });
      setEditingId(null);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/executives/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete executive');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Executive account removed.' });
      queryClient.invalidateQueries({ queryKey: ['/executives'] });
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const startEdit = (exec: any) => {
    setEditingId(exec.id);
    setEditState({ name: exec.name, email: exec.email, phone: exec.phone, photoUrl: exec.photoUrl || '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExecutive.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: '🎉 Executive Account Created!', description: `${formData.name} can now log in at /login with their credentials.` });
        queryClient.invalidateQueries({ queryKey: ['/executives'] });
        setIsAdding(false);
        setFormData({ name: '', email: '', phone: '', password: '', photoUrl: '' });
      },
      onError: (err: any) => {
        toast({ title: 'Error', description: err.response?.data?.error || err.message, variant: 'destructive' });
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground mb-1">Style Executives</h1>
          <p className="text-muted-foreground text-xs sm:text-sm tracking-widest uppercase">
            Manage your doorstep styling team, credentials, and lead capacity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAdding(true)} className="gap-2 bg-primary text-primary-foreground font-bold tracking-wider uppercase text-xs h-11 px-5 rounded-xl shadow-lg shadow-primary/20">
            <UserPlus className="w-4 h-4" /> Add New Executive Login
          </Button>
        </div>
      </div>

      {/* Add Executive Form Modal / Drawer */}
      {isAdding && (
        <div className="bg-card border border-primary/30 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" /> Create New Executive Login Account
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Full Name *</label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-background border-border"
                placeholder="e.g. Sumair Khan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Login Email *</label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="bg-background border-border"
                placeholder="sumair@fashionxpress.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Phone Number *</label>
              <Input
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="bg-background border-border"
                placeholder="9876543210"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Login Password *</label>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="bg-background border-border font-mono"
                placeholder="••••••••"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={createExecutive.isPending} className="bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs gap-2">
                {createExecutive.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                Create Executive Login
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Executives List Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : executives?.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground text-xs">
            No executives registered. Click "Add New Executive Login" above to create styling team accounts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                <tr>
                  <th className="p-4 pl-6">Executive Name</th>
                  <th className="p-4">Login Email & Phone</th>
                  <th className="p-4 text-center">Pending Leads</th>
                  <th className="p-4 text-center">Completed Leads</th>
                  <th className="p-4 text-center">Rating</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {executives?.map((exec: any) => {
                  const isEditing = editingId === exec.id;
                  const pendingCount = exec.pendingLeads ?? exec.activeBookings ?? 0;
                  const completedCount = exec.completedLeads ?? 0;

                  if (isEditing) {
                    return (
                      <tr key={exec.id} className="bg-primary/5">
                        <td className="p-4 pl-6">
                          <Input
                            value={editState.name}
                            onChange={e => setEditState({ ...editState, name: e.target.value })}
                            className="h-8 text-xs bg-background"
                          />
                        </td>
                        <td className="p-4 space-y-1">
                          <Input
                            value={editState.email}
                            onChange={e => setEditState({ ...editState, email: e.target.value })}
                            className="h-8 text-xs bg-background"
                          />
                          <Input
                            value={editState.phone}
                            onChange={e => setEditState({ ...editState, phone: e.target.value })}
                            className="h-8 text-xs bg-background"
                          />
                        </td>
                        <td className="p-4 text-center font-mono text-xs">{pendingCount}</td>
                        <td className="p-4 text-center font-mono text-xs">{completedCount}</td>
                        <td className="p-4 text-center font-bold text-xs">{exec.rating}</td>
                        <td className="p-4 pr-6 text-right space-x-1">
                          <Button
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: exec.id, data: editState })}
                            disabled={updateMutation.isPending}
                            className="h-7 text-xs bg-primary text-primary-foreground font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="h-7 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={exec.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                            {exec.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{exec.name}</div>
                            <span className="text-[10px] font-mono text-muted-foreground">ID: #EXEC-{exec.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-muted-foreground" /> {exec.email}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-muted-foreground" /> {exec.phone}
                        </div>
                      </td>

                      {/* Pending Leads */}
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          pendingCount > 0
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {pendingCount} pending
                        </span>
                      </td>

                      {/* Completed Leads */}
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          completedCount > 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {completedCount} completed
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" /> {exec.rating || '5.0'}
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(exec)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete executive ${exec.name}?`)) {
                                deleteMutation.mutate(exec.id);
                              }
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                            title="Delete executive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
