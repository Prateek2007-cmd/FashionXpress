import React, { useState } from 'react';
import { useListExecutives, useCreateExecutive } from '@workspace/api-client-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, UserPlus, Star, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

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

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://fashionxpress.onrender.com";

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
      toast({ title: 'Success', description: 'Executive updated.' });
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
      toast({ title: 'Deleted', description: 'Executive removed.' });
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
        toast({ title: 'Success', description: 'Executive account created.' });
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
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">Executives</h1>
          <p className="text-muted-foreground">Manage your stylist and delivery team.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Add Executive
        </Button>
      </div>

      {isAdding && (
        <div className="bg-card/30 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-serif mb-6 text-primary">Create New Executive Account</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</label>
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-black/40 border-white/10" placeholder="e.g. Jane Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <Input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-black/40 border-white/10" placeholder="jane@fashionxpress.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</label>
              <Input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-black/40 border-white/10" placeholder="+91 9876543210" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Initial Password</label>
              <Input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Photo URL (Optional)</label>
              <Input value={formData.photoUrl} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} className="bg-black/40 border-white/10" placeholder="https://..." />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="border-white/20">Cancel</Button>
              <Button type="submit" disabled={createExecutive.isPending}>
                {createExecutive.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Account
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card/30 border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : executives?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No executives found. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-medium">Executive</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium text-center">Active</th>
                  <th className="p-4 font-medium text-center">Rating</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {executives?.map((exec) => {
                  const isEditing = editingId === exec.id;
                  const isDeleting = deletingId === exec.id;

                  return (
                    <tr key={exec.id} className={`transition-colors ${isEditing ? 'bg-primary/5' : 'hover:bg-white/5'}`}>
                      <td className="p-4">
                        {isEditing ? (
                          <Input
                            value={editState.name}
                            onChange={e => setEditState({ ...editState, name: e.target.value })}
                            className="bg-black/40 border-white/10 h-9 text-sm w-40"
                            placeholder="Name"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center border border-primary/30 shrink-0">
                              {exec.photoUrl
                                ? <img src={exec.photoUrl} alt={exec.name} className="w-full h-full object-cover" />
                                : <span className="text-primary font-semibold text-lg">{exec.name.charAt(0)}</span>
                              }
                            </div>
                            <span className="font-medium">{exec.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <Input value={editState.email} onChange={e => setEditState({ ...editState, email: e.target.value })} className="bg-black/40 border-white/10 h-9 text-sm w-48" placeholder="Email" />
                            <Input value={editState.phone} onChange={e => setEditState({ ...editState, phone: e.target.value })} className="bg-black/40 border-white/10 h-9 text-sm w-48" placeholder="Phone" />
                          </div>
                        ) : (
                          <>
                            <div className="mb-1">{exec.email}</div>
                            <div>{exec.phone}</div>
                          </>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                          {exec.activeBookings}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                          <Star className="w-3 h-3 fill-amber-500" /> {exec.rating.toFixed(1)}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap text-muted-foreground">
                        {isEditing ? (
                          <Input value={editState.photoUrl} onChange={e => setEditState({ ...editState, photoUrl: e.target.value })} className="bg-black/40 border-white/10 h-9 text-sm w-40" placeholder="Photo URL" />
                        ) : (
                          format(new Date(exec.createdAt), 'MMM d, yyyy')
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm" variant="outline"
                                className="h-8 w-8 p-0 border-green-500/30 text-green-500 hover:bg-green-500/10"
                                onClick={() => updateMutation.mutate({ id: exec.id, data: editState })}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-8 w-8 p-0 border-white/20 text-muted-foreground hover:bg-white/10"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : isDeleting ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Sure?</span>
                              <Button
                                size="sm" variant="outline"
                                className="h-8 px-2 border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs"
                                onClick={() => deleteMutation.mutate(exec.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-8 w-8 p-0 border-white/20 text-muted-foreground hover:bg-white/10"
                                onClick={() => setDeletingId(null)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                size="sm" variant="outline"
                                className="h-8 w-8 p-0 border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                                onClick={() => startEdit(exec)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-8 w-8 p-0 border-white/10 text-muted-foreground hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/5"
                                onClick={() => setDeletingId(exec.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
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
