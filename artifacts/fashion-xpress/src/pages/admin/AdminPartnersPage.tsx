import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type PartnerRequest = {
  id: number;
  shopName: string;
  productsSold: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: string;
};

export function AdminPartnersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<PartnerRequest[]>({
    queryKey: ['/api/partners'],
    queryFn: async () => {
      const res = await fetch('/api/partners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch requests');
      return res.json();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`/api/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      toast({ title: "Success", description: "Status updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-serif mb-2">Partner Requests</h1>
        <p className="text-muted-foreground">Manage incoming boutique and retail partnership requests.</p>
      </div>

      <div className="bg-card/30 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Shop Details</th>
                <th className="p-4 font-medium">Products Sold</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No partner requests found.</td>
                </tr>
              ) : (
                requests?.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-base">{req.shopName}</div>
                    </td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate">
                      {req.productsSold}
                    </td>
                    <td className="p-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(req.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        req.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        req.status === 'reviewed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {req.status === 'approved' && <Check className="w-3 h-3" />}
                        {req.status === 'rejected' && <X className="w-3 h-3" />}
                        {req.status === 'pending' && <Clock className="w-3 h-3" />}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      {req.status !== 'approved' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'approved' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Approve
                        </Button>
                      )}
                      {req.status !== 'rejected' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Reject
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
