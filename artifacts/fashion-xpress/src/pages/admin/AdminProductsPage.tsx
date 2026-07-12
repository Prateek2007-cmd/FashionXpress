import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';
import { useListProducts, useListCategories, useListBrands } from '@workspace/api-client-react';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data: productsData, isLoading } = useListProducts({ limit: 100 });
  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', categoryId: 1, brandId: 1, color: '', sizes: ['S', 'M', 'L'], fabric: '', occasion: '', mrp: 0, sellingPrice: 0, stock: 10
  });

  const createProduct = useMutation({
    mutationFn: (data: any) => customFetch({ url: '/api/products', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/products'] });
      setIsAdding(false);
    }
  });

  const deleteProduct = useMutation({
    mutationFn: (id: number) => customFetch({ url: `/api/products/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/products'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Products (Collections)</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-6 border border-white/10 rounded-xl bg-card/30">
          <h2 className="font-serif text-xl mb-4">New Product</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Name</label>
              <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">SKU</label>
              <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Category</label>
              <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Brand</label>
              <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.brandId} onChange={e => setFormData({...formData, brandId: Number(e.target.value)})}>
                {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Color</label>
              <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Fabric</label>
              <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.fabric} onChange={e => setFormData({...formData, fabric: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Occasion</label>
              <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.occasion} onChange={e => setFormData({...formData, occasion: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Stock</label>
              <input required type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Selling Price</label>
              <input required type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">MRP</label>
              <input required type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm" value={formData.mrp} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} />
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="submit" disabled={createProduct.isPending} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/30 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsData?.items.map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{product.name}</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{product.sku}</td>
                  <td className="px-6 py-4">₹{product.sellingPrice}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this product?')) {
                          deleteProduct.mutate(product.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={deleteProduct.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
