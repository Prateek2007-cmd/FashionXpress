import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { 
  ClipboardList, 
  User, 
  Mail, 
  Phone, 
  ShoppingBag, 
  Loader2, 
  Calendar, 
  MapPin, 
  Check,
  X as XIcon,
  Clock,
  MessageSquare
} from 'lucide-react';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://fashionxpress.onrender.com';

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  priceAtSale: string;
  color: string;
  size: string;
  product: {
    id: number;
    name: string;
    sku: string;
    brandName: string;
    images: string[];
    sellingPrice: string;
  };
}

interface AdminOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  status: string;
  totalAmount: string;
  shippingAddress: string;
  specialRequirements: string | null;
  createdAt: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  items: OrderItem[];
}

export function AdminOrdersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Failed to load orders: ${res.statusText}`);
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      toast({
        title: 'Error loading orders',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error(await res.text() || 'Failed to update order status');
      toast({ title: `Order status updated to: ${newStatus === 'approved' ? 'Ready for Pickup' : 'Rejected'}` });
      fetchOrders();
    } catch (err: any) {
      toast({
        title: 'Error updating order',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Customer Reservations & Orders</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Overview of all pickup reservations across the platform
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 border border-white/10 hover:border-primary/50 text-white rounded-md text-sm font-medium transition-colors bg-white/5 hover:bg-primary/10"
        >
          Refresh Orders
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-xl bg-card/20">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No orders placed yet.</p>
          <p className="text-muted-foreground text-sm">When customers reserve store pickups, they will show up here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, idx) => {
            return (
              <div 
                key={order.id} 
                className="bg-card border border-white/5 hover:border-white/10 rounded-xl overflow-hidden shadow-lg transition-all"
              >
                {/* Order Header */}
                <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="font-serif font-bold text-primary text-sm bg-primary/10 px-2.5 py-1 rounded">
                      S.No: {idx + 1}
                    </span>
                    <span className="font-mono font-bold text-white text-lg">
                      {order.orderNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider block">Order Total</span>
                      <span className="font-medium text-primary text-lg">{formatPrice(parseFloat(order.totalAmount))}</span>
                    </div>
                    <div>
                      {order.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-500/10 border border-green-500/20 text-xs text-green-500 font-medium capitalize">
                          <Check className="w-3.5 h-3.5" /> Ready for Pickup
                        </span>
                      ) : order.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium capitalize">
                          <XIcon className="w-3.5 h-3.5" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-500 font-medium capitalize">
                          <Clock className="w-3.5 h-3.5" /> Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                  {/* Left Column: Product Details */}
                  <div className="p-6 lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                        <ShoppingBag className="w-4 h-4" /> ITEMS TO COLLECT ({order.items.length})
                      </h3>
                      <div className="divide-y divide-white/5 space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                            <div className="w-16 h-20 bg-black/50 rounded overflow-hidden flex-shrink-0 border border-white/5">
                              {item.product?.images?.[0] ? (
                                <img 
                                  src={item.product.images[0]} 
                                  alt={item.product.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate">{item.product?.name || 'Unknown Product'}</h4>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Brand/Merchant: <strong className="text-white">{item.product?.brandName}</strong>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                SKU: {item.product?.sku || 'N/A'}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                                <span>Size: <strong className="text-white">{item.size}</strong></span>
                                <span>Color: <strong className="text-white">{item.color}</strong></span>
                                <span>Qty: <strong className="text-white">{item.quantity}</strong></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">{formatPrice(parseFloat(item.priceAtSale))}</div>
                              {item.quantity > 1 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.quantity} × {formatPrice(parseFloat(item.priceAtSale))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    {order.status === 'pending' && (
                      <div className="pt-6 border-t border-white/5 flex gap-3">
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'approved')}
                          className="flex-1 h-11 flex items-center justify-center gap-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-all disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" /> Approve (Ready for Pickup)
                        </button>
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'rejected')}
                          className="h-11 px-6 rounded border border-white/10 hover:border-red-500 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 text-sm font-medium transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Customer Details */}
                  <div className="p-6 bg-white/[0.01] space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                        <User className="w-4 h-4" /> Customer Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{order.customer.name}</div>
                            <div className="text-xs text-muted-foreground">Customer Name</div>
                          </div>
                        </div>
                        {order.customer.phone && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm text-white">{order.customer.phone}</div>
                              <div className="text-xs text-muted-foreground">Mobile Number</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="text-sm text-white truncate max-w-[200px]" title={order.customer.email}>
                            {order.customer.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                        <MapPin className="w-3.5 h-3.5" /> Pickup / Address
                      </h4>
                      <p className="text-sm text-white leading-relaxed">
                        {order.shippingAddress}
                      </p>
                    </div>

                    {order.specialRequirements && (
                      <div className="pt-4 border-t border-white/5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                          <MessageSquare className="w-3.5 h-3.5" /> Customer Notes
                        </h4>
                        <p className="text-sm text-white italic leading-relaxed">
                          "{order.specialRequirements}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
