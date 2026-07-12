import React, { useState, useRef } from 'react';
import { useListProducts, useListCategories, useListBrands } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();
  const { data: productsData, isLoading } = useListProducts({ limit: 100 });
  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', categoryId: 0, brandId: 0, 
    color: '', sizes: 'S,M,L,XL', fabric: '', occasion: '', 
    mrp: 0, sellingPrice: 0, stock: 10, imageUrl: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Combine uploaded images and URL images
      const allImages = [...imagePreview];
      if (formData.imageUrl.trim()) {
        formData.imageUrl.split(',').forEach(url => {
          const trimmed = url.trim();
          if (trimmed) allImages.push(trimmed);
        });
      }

      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        categoryId: formData.categoryId || (categories?.[0]?.id || 1),
        brandId: formData.brandId || (brands?.[0]?.id || 1),
        color: formData.color,
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
        fabric: formData.fabric,
        occasion: formData.occasion,
        mrp: formData.mrp,
        sellingPrice: formData.sellingPrice,
        stock: formData.stock,
        images: allImages,
      };

      console.log('[AdminProducts] Creating product:', payload.name);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseText = await res.text();
      console.log('[AdminProducts] Response:', res.status, responseText);

      if (!res.ok) {
        throw new Error(responseText || `Error ${res.status}`);
      }

      toast({ title: "✅ Product created!", description: `${formData.name} has been added to the catalog.` });
      queryClient.invalidateQueries({ queryKey: ['/products'] });
      setIsAdding(false);
      setImagePreview([]);
      setFormData({ name: '', sku: '', description: '', categoryId: 0, brandId: 0, color: '', sizes: 'S,M,L,XL', fabric: '', occasion: '', mrp: 0, sellingPrice: 0, stock: 10, imageUrl: '' });
    } catch (err: any) {
      console.error('Create product error:', err);
      toast({ title: "Failed to create product", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(await res.text());
      }

      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ['/products'] });
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Products</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Manage your catalog</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-6 border border-white/10 rounded-xl bg-card">
          <h2 className="font-serif text-xl mb-6 text-white">New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Name *</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Premium Silk Shirt" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">SKU *</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="FX-001" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Description</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief product description" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Category</label>
                <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}>
                  <option value={0}>Select category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Brand</label>
                <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.brandId} onChange={e => setFormData({...formData, brandId: Number(e.target.value)})}>
                  <option value={0}>Select brand</option>
                  {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Color</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="Navy Blue" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Sizes (comma-separated)</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} placeholder="S,M,L,XL" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Fabric</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.fabric} onChange={e => setFormData({...formData, fabric: e.target.value})} placeholder="Cotton, Silk, etc." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Occasion</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.occasion} onChange={e => setFormData({...formData, occasion: e.target.value})} placeholder="Casual, Formal, etc." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">MRP (₹)</label>
                <input required type="number" min="0" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.mrp} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Selling Price (₹)</label>
                <input required type="number" min="0" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Stock</label>
                <input required type="number" min="0" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3">Product Images</label>
              
              {/* Upload button and URL input */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-md text-primary text-sm hover:bg-primary/20 transition-colors"
                >
                  <Upload className="w-4 h-4" /> Upload Image
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
                <div className="flex-1">
                  <input 
                    type="text" 
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" 
                    value={formData.imageUrl} 
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                    placeholder="Or paste image URLs (comma-separated)" 
                  />
                </div>
              </div>
              
              {/* Image previews */}
              {imagePreview.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {imagePreview.map((img, i) => (
                    <div key={i} className="relative w-20 h-24 rounded-md overflow-hidden border border-white/10 group">
                      <img src={img} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {imagePreview.length === 0 && !formData.imageUrl && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Upload images or paste URLs. Products without images will show "No Image".
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button type="button" onClick={() => { setIsAdding(false); setImagePreview([]); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : '✓ Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !productsData?.items?.length ? (
        <div className="text-center py-20 border border-white/5 rounded-xl bg-card/20">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No products in catalog yet.</p>
          <p className="text-muted-foreground text-sm">Click "Add Product" above to create your first product.</p>
        </div>
      ) : (
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase tracking-widest bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {productsData.items.map((product) => (
                <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded bg-black/50 overflow-hidden flex-shrink-0 border border-white/5">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.brandName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{product.sku}</td>
                  <td className="px-6 py-4 text-muted-foreground">{product.categoryName}</td>
                  <td className="px-6 py-4 text-white">₹{product.sellingPrice}</td>
                  <td className="px-6 py-4">
                    <span className={`${product.stock < 5 ? 'text-red-400' : 'text-white'}`}>{product.stock}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded hover:bg-destructive/10"
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
