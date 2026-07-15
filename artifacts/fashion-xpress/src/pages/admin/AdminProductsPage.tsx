import React, { useState, useRef } from 'react';
import { useListProducts, useListCategories, useListBrands } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Upload, X, Image as ImageIcon, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://fashionxpress.onrender.com';

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();
  const { data: productsData, isLoading } = useListProducts({ limit: 100 });
  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // uploadedImageUrls stores the final URLs (returned from /api/upload)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', categoryId: 0, brandName: '',
    color: '', sizes: 'S,M,L,XL', fabric: '', occasion: '',
    mrp: 0, sellingPrice: 0, stock: 10, imageUrl: ''
  });

  // Edit state
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', description: '', color: '', sizes: '', fabric: '', occasion: '',
    mrp: 0, sellingPrice: 0, stock: 0, images: [] as string[], imageUrl: ''
  });

  /** Upload a file to /api/upload and return the URL */
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
    const data = await res.json();
    return data.url as string;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} exceeds 5MB`, variant: 'destructive' });
          continue;
        }
        const url = await uploadFile(file);
        urls.push(url);
      }
      setUploadedImageUrls(prev => [...prev, ...urls]);
      if (urls.length > 0) {
        toast({ title: `✅ ${urls.length} image(s) uploaded` });
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsEditUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} exceeds 5MB`, variant: 'destructive' });
          continue;
        }
        const url = await uploadFile(file);
        urls.push(url);
      }
      setEditForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      if (urls.length > 0) {
        toast({ title: `✅ ${urls.length} image(s) uploaded` });
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsEditUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditImage = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const allImages = [...uploadedImageUrls];
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
        brandName: formData.brandName,
        color: formData.color,
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
        fabric: formData.fabric,
        occasion: formData.occasion,
        mrp: formData.mrp,
        sellingPrice: formData.sellingPrice,
        stock: formData.stock,
        images: allImages,
      };

      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseText = await res.text();
      if (!res.ok) throw new Error(responseText || `Error ${res.status}`);

      toast({ title: '✅ Product created!', description: `${formData.name} has been added to the catalog.` });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAdding(false);
      setUploadedImageUrls([]);
      setFormData({ name: '', sku: '', description: '', categoryId: 0, brandName: '', color: '', sizes: 'S,M,L,XL', fabric: '', occasion: '', mrp: 0, sellingPrice: 0, stock: 10, imageUrl: '' });
    } catch (err: any) {
      toast({ title: 'Failed to create product', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      toast({ title: 'Product deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch (err: any) {
      toast({ title: 'Failed to delete', description: err.message, variant: 'destructive' });
    }
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      color: product.color || '',
      sizes: (product.sizes || []).join(', '),
      fabric: product.fabric || '',
      occasion: product.occasion || '',
      mrp: product.mrp || 0,
      sellingPrice: product.sellingPrice || 0,
      stock: product.stock || 0,
      images: product.images || [],
      imageUrl: '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsEditSaving(true);
    try {
      const allImages = [...editForm.images];
      if (editForm.imageUrl.trim()) {
        editForm.imageUrl.split(',').forEach(url => {
          const trimmed = url.trim();
          if (trimmed) allImages.push(trimmed);
        });
      }

      const payload: any = {
        name: editForm.name,
        description: editForm.description,
        color: editForm.color,
        fabric: editForm.fabric,
        occasion: editForm.occasion,
        sizes: editForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
        mrp: Number(editForm.mrp),
        sellingPrice: Number(editForm.sellingPrice),
        stock: Number(editForm.stock),
        images: allImages,
      };

      const res = await fetch(`${API_BASE}/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Error ${res.status}`);
      }

      toast({ title: '✅ Product updated!', description: `${editForm.name} has been updated.` });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditingProduct(null);
    } catch (err: any) {
      toast({ title: 'Failed to update product', description: err.message, variant: 'destructive' });
    } finally {
      setIsEditSaving(false);
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
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {isAdding && (
        <div className="bg-card border border-white/5 rounded-xl p-6 mb-8">
          <h2 className="font-serif text-xl text-white mb-6">New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Name, SKU, Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Name *</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">SKU *</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Description</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>

            {/* Row 2: Category, Brand, Color */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Category</label>
                <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}>
                  <option value={0}>Select category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Brand Name *</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} placeholder="e.g. Gucci, Zara" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Color</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
              </div>
            </div>

            {/* Row 3: Sizes, Fabric, Occasion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Sizes (comma-separated)</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} placeholder="S,M,L,XL" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Fabric</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.fabric} onChange={e => setFormData({...formData, fabric: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Occasion</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.occasion} onChange={e => setFormData({...formData, occasion: e.target.value})} />
              </div>
            </div>

            {/* Row 4: MRP, Selling Price, Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">MRP (₹)</label>
                <input type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.mrp} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Selling Price (₹)</label>
                <input type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Stock</label>
                <input type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground">Images</label>
              <div className="flex gap-3 flex-wrap items-start">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-24 rounded-md border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span className="text-[10px] uppercase tracking-widest">{isUploading ? 'Uploading' : 'Upload'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex-1">
                  <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="Or paste image URLs (comma-separated)" />
                </div>
              </div>

              {uploadedImageUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {uploadedImageUrls.map((img, i) => (
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

              {uploadedImageUrls.length === 0 && !formData.imageUrl && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Upload images or paste URLs. Products without images will show "No Image".
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button type="button" onClick={() => { setIsAdding(false); setUploadedImageUrls([]); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={isSaving || isUploading} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
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
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(product)}
                        className="text-muted-foreground hover:text-primary transition-colors p-2 rounded hover:bg-primary/10"
                        title="Edit product"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded hover:bg-destructive/10"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)}>
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl text-white">Edit Product</h2>
              <button onClick={() => setEditingProduct(null)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Name</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Description</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Color</label>
                  <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Sizes (comma-separated)</label>
                  <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.sizes} onChange={e => setEditForm({...editForm, sizes: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Fabric</label>
                  <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.fabric} onChange={e => setEditForm({...editForm, fabric: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Occasion</label>
                  <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.occasion} onChange={e => setEditForm({...editForm, occasion: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">MRP (₹)</label>
                  <input type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.mrp} onChange={e => setEditForm({...editForm, mrp: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Selling Price (₹)</label>
                  <input type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.sellingPrice} onChange={e => setEditForm({...editForm, sellingPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Stock</label>
                  <input type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: Number(e.target.value)})} />
                </div>
              </div>

              {/* Image Upload for Edit */}
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground">Images</label>
                <div className="flex gap-3 flex-wrap items-start">
                  <button
                    type="button"
                    disabled={isEditUploading}
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-20 h-24 rounded-md border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
                  >
                    {isEditUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span className="text-[10px] uppercase tracking-widest">{isEditUploading ? 'Uploading' : 'Upload'}</span>
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white"
                      value={editForm.imageUrl}
                      onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                      placeholder="Or paste image URLs (comma-separated)"
                    />
                  </div>
                </div>

                {editForm.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {editForm.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-24 rounded-md overflow-hidden border border-white/10 group">
                        <img src={img} alt={`Preview ${i+1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <button
                          type="button"
                          onClick={() => removeEditImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Existing images shown above. Upload new images to add them. Remove images by clicking ✕.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isEditSaving || isEditUploading} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                  {isEditSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : '✓ Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
