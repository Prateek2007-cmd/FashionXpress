import React, { useState, useRef } from 'react';
import { useListProducts, useListCategories, useListBrands } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Upload, X, Image as ImageIcon, Pencil, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

import { getApiBaseUrl } from '@/lib/api-config';

const API_BASE = getApiBaseUrl();

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas compression failed'));
            }
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function MerchantProductsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token, user } = useAuth();
  
  // Only list products for this merchant
  const { data: productsData, isLoading } = useListProducts({ 
    limit: 100, 
    merchantId: user?.id || undefined 
  });
  const merchantProductsList: any[] = Array.isArray(productsData)
    ? productsData
    : (productsData as any)?.products || (productsData as any)?.items || [];
  const { data: categories } = useListCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const editCameraInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', categoryId: 0, brandName: '',
    color: '', sizes: 'S,M,L,XL', fabric: '', occasion: '',
    mrp: 0, sellingPrice: 0, stock: 10, imageUrl: ''
  });

  // Fabric list states
  const [fabricsList, setFabricsList] = useState<string[]>([]);

  // Color tag states
  const [colorsList, setColorsList] = useState<string[]>([]);
  const [showColorCustom, setShowColorCustom] = useState(false);
  const [customColorVal, setCustomColorVal] = useState('');

  // Occasion tag states
  const [occasionsList, setOccasionsList] = useState<string[]>([]);
  const [showOccasionCustom, setShowOccasionCustom] = useState(false);
  const [customOccasionVal, setCustomOccasionVal] = useState('');

  const FABRIC_OPTIONS = ['Cotton', 'Silk', 'Linen', 'Chiffon', 'Georgette', 'Net', 'Velvet', 'Satin', 'Crepe', 'Organza', 'Khadi', 'Rayon', 'Polyester', 'Denim', 'Brocade', 'Tussar Silk', 'Chanderi', 'Banarasi'];
  const COLOR_OPTIONS = ['Red', 'Pink', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'White', 'Black', 'Gold', 'Silver', 'Maroon', 'Navy Blue', 'Peach', 'Lavender', 'Turquoise', 'Mint', 'Coral', 'Beige', 'Ivory'];
  const OCCASION_OPTIONS = ['Wedding', 'Party', 'Festive', 'Casual', 'Formal', 'Engagement', 'Baby Shower', 'Cocktail', 'Office', 'Traditional', 'Sangeet', 'Mehndi', 'Reception', 'College', 'Date Night'];

  // Edit state
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', description: '', color: '', sizes: '', fabric: '', occasion: '',
    mrp: 0, sellingPrice: 0, stock: 0, images: [] as string[], imageUrl: ''
  });

  const [editFabricsList, setEditFabricsList] = useState<string[]>([]);
  const [editFabricInput, setEditFabricInput] = useState('');
  const [editColorsList, setEditColorsList] = useState<string[]>([]);
  const [editColorInput, setEditColorInput] = useState('');
  const [showEditColorCustom, setShowEditColorCustom] = useState(false);
  const [customEditColorVal, setCustomEditColorVal] = useState('');
  const [editOccasionsList, setEditOccasionsList] = useState<string[]>([]);
  const [editOccasionInput, setEditOccasionInput] = useState('');
  const [showEditOccasionCustom, setShowEditOccasionCustom] = useState(false);
  const [customEditOccasionVal, setCustomEditOccasionVal] = useState('');

  const uploadFile = async (file: File): Promise<string> => {
    let uploadBlob: Blob = file;
    try {
      if (file.type.startsWith('image/')) {
        uploadBlob = await compressImage(file);
      }
    } catch (e) {
      console.warn("Failed to compress image, uploading original", e);
    }

    const formData = new FormData();
    formData.append('file', uploadBlob, file.name || 'image.jpg');
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
    if (fabricsList.length === 0) {
      toast({ title: 'Validation Error', description: 'Please enter at least one fabric.', variant: 'destructive' });
      return;
    }
    if (colorsList.length === 0) {
      toast({ title: 'Validation Error', description: 'Please select at least one color.', variant: 'destructive' });
      return;
    }
    if (occasionsList.length === 0) {
      toast({ title: 'Validation Error', description: 'Please select at least one occasion.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);

    try {
      const allImages = [...uploadedImageUrls];

      const payload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        categoryId: formData.categoryId || (categories?.[0]?.id || 1),
        brandName: formData.brandName || user?.name || "Merchant Store",
        color: colorsList.join(', '),
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
        fabric: fabricsList.join(', '),
        occasion: occasionsList.join(', '),
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
      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        try {
          const errData = JSON.parse(responseText);
          errMsg = errData.error || errData.message || errMsg;
        } catch {
          errMsg = responseText || errMsg;
        }
        throw new Error(errMsg);
      }

      toast({ title: '✅ Product created!', description: `${formData.name} has been added to the catalog.` });
      queryClient.invalidateQueries();
      setIsAdding(false);
      setUploadedImageUrls([]);
      setFabricsList([]);
      setColorsList([]);
      setOccasionsList([]);
      setFormData({ name: '', sku: '', description: '', categoryId: 0, brandName: '', color: '', sizes: 'S,M,L,XL', fabric: '', occasion: '', mrp: 0, sellingPrice: 0, stock: 10, imageUrl: '' });
    } catch (err: any) {
      toast({ title: 'Failed to create product', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 204) {
        const errText = await res.text();
        let errMsg = errText;
        try {
          const json = JSON.parse(errText);
          errMsg = json.error || json.message || errText;
        } catch {}
        throw new Error(errMsg || `Error ${res.status}`);
      }
      toast({ title: '✅ Product deleted successfully' });
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: 'Failed to delete product', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
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
    const parsedFabrics = product.fabric ? product.fabric.split(',').map((f: string) => f.trim()).filter(Boolean) : [];
    setEditFabricsList(parsedFabrics);
    setEditFabricInput('');
    const parsedColors = product.color ? product.color.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
    setEditColorsList(parsedColors);
    setEditColorInput('');
    const parsedOccasions = product.occasion ? product.occasion.split(',').map((o: string) => o.trim()).filter(Boolean) : [];
    setEditOccasionsList(parsedOccasions);
    setEditOccasionInput('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (editFabricsList.length === 0) {
      toast({ title: 'Validation Error', description: 'Please enter at least one fabric.', variant: 'destructive' });
      return;
    }
    setIsEditSaving(true);
    try {
      const allImages = [...editForm.images];

      const payload: any = {
        name: editForm.name,
        description: editForm.description,
        color: editColorsList.join(', '),
        fabric: editFabricsList.join(', '),
        occasion: editOccasionsList.join(', '),
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
      queryClient.invalidateQueries();
      setEditingProduct(null);
    } catch (err: any) {
      toast({ title: 'Failed to update product', description: err.message, variant: 'destructive' });
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleOpenAdd = () => {
    if (!isAdding) {
      const generatedSku = 'SKU-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      setFormData({
        name: '',
        sku: generatedSku,
        description: '',
        categoryId: categories?.[0]?.id || 1,
        brandName: user?.name || '',
        color: '',
        sizes: 'S,M,L,XL',
        fabric: '',
        occasion: '',
        mrp: 0,
        sellingPrice: 0,
        stock: 10,
        imageUrl: ''
      });
      setUploadedImageUrls([]);
      setFabricsList([]);
      setColorsList([]);
      setOccasionsList([]);
    }
    setIsAdding(!isAdding);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">My Dresses</h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Upload and manage your collection</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Dress
        </button>
      </div>

      {isAdding && (
        <div className="bg-card border border-white/5 rounded-xl p-6 mb-8">
          <h2 className="font-serif text-xl text-white mb-6">Add New Dress</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Name, SKU, Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Name *</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Silk Wedding Lehenga" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">SKU (Auto-Generated)</label>
                <input disabled type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white opacity-60 cursor-not-allowed" value={formData.sku} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Description</label>
                <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>

            {/* Row 2: Category, Brand (defaults to merchant name), Color */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Category</label>
                <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}>
                  <option value={0}>Select category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Brand/Merchant Name</label>
                <input disabled type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white opacity-60 cursor-not-allowed" value={formData.brandName} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Color *</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm text-white"
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (val && !colorsList.includes(val)) setColorsList([...colorsList, val]);
                    }}
                  >
                    <option value="">Choose color...</option>
                    {COLOR_OPTIONS.filter(c => !colorsList.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    type="button"
                    title="Add custom color"
                    onClick={() => { setShowColorCustom(v => !v); setCustomColorVal(''); }}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-white/20 bg-white/5 hover:bg-primary/20 text-primary text-lg font-bold transition-colors flex-shrink-0"
                  >+</button>
                </div>
                {showColorCustom && (
                  <div className="flex gap-2 mt-2">
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 bg-background border border-primary/40 rounded-md px-3 py-2 text-sm text-white"
                      value={customColorVal}
                      onChange={e => setCustomColorVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const t = customColorVal.trim();
                          if (t && !colorsList.includes(t)) setColorsList([...colorsList, t]);
                          setCustomColorVal('');
                          setShowColorCustom(false);
                        }
                        if (e.key === 'Escape') setShowColorCustom(false);
                      }}
                      placeholder="Type custom color & press Enter"
                    />
                    <button type="button" onClick={() => {
                      const t = customColorVal.trim();
                      if (t && !colorsList.includes(t)) setColorsList([...colorsList, t]);
                      setCustomColorVal('');
                      setShowColorCustom(false);
                    }} className="px-3 bg-primary text-primary-foreground rounded text-sm">Add</button>
                  </div>
                )}
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {colorsList.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-xs text-white">
                      {c}
                      <button type="button" onClick={() => setColorsList(prev => prev.filter(x => x !== c))} className="text-primary hover:text-red-500 transition-colors">
                        <span className="text-primary font-bold ml-1">×</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Sizes, Fabric, Occasion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Sizes (comma-separated) *</label>
                <input required type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} placeholder="S,M,L,XL" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Fabric *</label>
                <select
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white"
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !fabricsList.includes(val)) setFabricsList([...fabricsList, val]);
                  }}
                >
                  <option value="">Choose fabric...</option>
                  {FABRIC_OPTIONS.filter(f => !fabricsList.includes(f)).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {fabricsList.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-xs text-white">
                      {f}
                      <button type="button" onClick={() => setFabricsList(prev => prev.filter(x => x !== f))} className="text-primary hover:text-red-500 transition-colors">
                        <span className="text-primary font-bold ml-1">×</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Occasion *</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm text-white"
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (val && !occasionsList.includes(val)) setOccasionsList([...occasionsList, val]);
                    }}
                  >
                    <option value="">Choose occasion...</option>
                    {OCCASION_OPTIONS.filter(o => !occasionsList.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <button
                    type="button"
                    title="Add custom occasion"
                    onClick={() => { setShowOccasionCustom(v => !v); setCustomOccasionVal(''); }}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-white/20 bg-white/5 hover:bg-primary/20 text-primary text-lg font-bold transition-colors flex-shrink-0"
                  >+</button>
                </div>
                {showOccasionCustom && (
                  <div className="flex gap-2 mt-2">
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 bg-background border border-primary/40 rounded-md px-3 py-2 text-sm text-white"
                      value={customOccasionVal}
                      onChange={e => setCustomOccasionVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const t = customOccasionVal.trim();
                          if (t && !occasionsList.includes(t)) setOccasionsList([...occasionsList, t]);
                          setCustomOccasionVal('');
                          setShowOccasionCustom(false);
                        }
                        if (e.key === 'Escape') setShowOccasionCustom(false);
                      }}
                      placeholder="Type custom occasion & press Enter"
                    />
                    <button type="button" onClick={() => {
                      const t = customOccasionVal.trim();
                      if (t && !occasionsList.includes(t)) setOccasionsList([...occasionsList, t]);
                      setCustomOccasionVal('');
                      setShowOccasionCustom(false);
                    }} className="px-3 bg-primary text-primary-foreground rounded text-sm">Add</button>
                  </div>
                )}
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {occasionsList.map(o => (
                    <span key={o} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-xs text-white">
                      {o}
                      <button type="button" onClick={() => setOccasionsList(prev => prev.filter(x => x !== o))} className="text-primary hover:text-red-500 transition-colors">
                        <span className="text-primary font-bold ml-1">×</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: MRP, Selling Price, Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">MRP (₹) *</label>
                <input required type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.mrp || ''} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Selling Price (₹) *</label>
                <input required type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.sellingPrice || ''} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Stock *</label>
                <input required type="number" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground">Images</label>
              <div className="flex gap-4 flex-wrap items-center justify-center border border-white/5 bg-black/20 p-6 rounded-xl">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-md border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-white/[0.08] transition-all text-muted-foreground hover:text-primary disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span className="text-[10px] uppercase tracking-widest">{isUploading ? 'Uploading' : 'Upload File'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-24 h-24 rounded-md border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-white/[0.08] transition-all text-muted-foreground hover:text-primary disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] uppercase tracking-widest">Take Photo</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {uploadedImageUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {uploadedImageUrls.map((img, i) => (
                    <div key={i} className="relative w-20 h-24 rounded-md overflow-hidden border border-white/10 group">
                      <img src={img} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        title="Delete photo"
                        className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 z-10 transition-transform active:scale-95 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button type="button" onClick={() => { setIsAdding(false); setUploadedImageUrls([]); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={isSaving || isUploading} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : '✓ Save Dress'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !merchantProductsList.length ? (
        <div className="text-center py-20 border border-white/5 rounded-xl bg-card/20">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No dresses uploaded yet.</p>
          <p className="text-muted-foreground text-sm">Click "Add Dress" above to upload your first garment.</p>
        </div>
      ) : (
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
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
                {merchantProductsList.map((product) => (
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
                      {deletingId === product.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs text-red-400 font-medium whitespace-nowrap">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(product)}
                            className="text-muted-foreground hover:text-primary transition-colors p-2 rounded hover:bg-primary/10"
                            title="Edit product"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(product.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded hover:bg-destructive/10"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)}>
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl text-white">Edit Dress Details</h2>
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
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm text-white"
                      value=""
                      onChange={e => {
                        const val = e.target.value;
                        if (val && !editColorsList.includes(val)) setEditColorsList([...editColorsList, val]);
                      }}
                    >
                      <option value="">Choose color...</option>
                      {COLOR_OPTIONS.filter(c => !editColorsList.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                      type="button"
                      title="Add custom color"
                      onClick={() => { setShowEditColorCustom(v => !v); setCustomEditColorVal(''); }}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-white/20 bg-white/5 hover:bg-primary/20 text-primary text-lg font-bold transition-colors flex-shrink-0"
                    >+</button>
                  </div>
                  {showEditColorCustom && (
                    <div className="flex gap-2 mt-2">
                      <input
                        autoFocus
                        type="text"
                        className="flex-1 bg-background border border-primary/40 rounded-md px-3 py-2 text-sm text-white"
                        value={customEditColorVal}
                        onChange={e => setCustomEditColorVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const t = customEditColorVal.trim();
                            if (t && !editColorsList.includes(t)) setEditColorsList([...editColorsList, t]);
                            setCustomEditColorVal('');
                            setShowEditColorCustom(false);
                          }
                          if (e.key === 'Escape') setShowEditColorCustom(false);
                        }}
                        placeholder="Type custom color & press Enter"
                      />
                      <button type="button" onClick={() => {
                        const t = customEditColorVal.trim();
                        if (t && !editColorsList.includes(t)) setEditColorsList([...editColorsList, t]);
                        setCustomEditColorVal('');
                        setShowEditColorCustom(false);
                      }} className="px-3 bg-primary text-primary-foreground rounded text-sm">Add</button>
                    </div>
                  )}
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {editColorsList.map(c => (
                      <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-xs text-white">
                        {c}
                        <button type="button" onClick={() => setEditColorsList(prev => prev.filter(x => x !== c))} className="text-primary hover:text-red-500 transition-colors">
                          <span className="text-primary font-bold ml-1">×</span>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Sizes (comma-separated)</label>
                  <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white" value={editForm.sizes} onChange={e => setEditForm({...editForm, sizes: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Fabric * (Select from list)</label>
                  <select
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white"
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (val && !editFabricsList.includes(val)) setEditFabricsList([...editFabricsList, val]);
                    }}
                  >
                    <option value="">Choose fabric...</option>
                    {FABRIC_OPTIONS.filter(f => !editFabricsList.includes(f)).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {editFabricsList.map(f => (
                      <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-xs text-white">
                        {f}
                        <button type="button" onClick={() => setEditFabricsList(prev => prev.filter(x => x !== f))} className="text-primary hover:text-red-500 transition-colors">
                          <span className="text-primary font-bold ml-1">×</span>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Occasion</label>
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm text-white"
                      value=""
                      onChange={e => {
                        const val = e.target.value;
                        if (val && !editOccasionsList.includes(val)) setEditOccasionsList([...editOccasionsList, val]);
                      }}
                    >
                      <option value="">Choose occasion...</option>
                      {OCCASION_OPTIONS.filter(o => !editOccasionsList.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <button
                      type="button"
                      title="Add custom occasion"
                      onClick={() => { setShowEditOccasionCustom(v => !v); setCustomEditOccasionVal(''); }}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-white/20 bg-white/5 hover:bg-primary/20 text-primary text-lg font-bold transition-colors flex-shrink-0"
                    >+</button>
                  </div>
                  {showEditOccasionCustom && (
                    <div className="flex gap-2 mt-2">
                      <input
                        autoFocus
                        type="text"
                        className="flex-1 bg-background border border-primary/40 rounded-md px-3 py-2 text-sm text-white"
                        value={customEditOccasionVal}
                        onChange={e => setCustomEditOccasionVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const t = customEditOccasionVal.trim();
                            if (t && !editOccasionsList.includes(t)) setEditOccasionsList([...editOccasionsList, t]);
                            setCustomEditOccasionVal('');
                            setShowEditOccasionCustom(false);
                          }
                          if (e.key === 'Escape') setShowEditOccasionCustom(false);
                        }}
                        placeholder="Type custom occasion & press Enter"
                      />
                      <button type="button" onClick={() => {
                        const t = customEditOccasionVal.trim();
                        if (t && !editOccasionsList.includes(t)) setEditOccasionsList([...editOccasionsList, t]);
                        setCustomEditOccasionVal('');
                        setShowEditOccasionCustom(false);
                      }} className="px-3 bg-primary text-primary-foreground rounded text-sm">Add</button>
                    </div>
                  )}
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {editOccasionsList.map(o => (
                      <span key={o} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-xs text-white">
                        {o}
                        <button type="button" onClick={() => setEditOccasionsList(prev => prev.filter(x => x !== o))} className="text-primary hover:text-red-500 transition-colors">
                          <span className="text-primary font-bold ml-1">×</span>
                        </button>
                      </span>
                    ))}
                  </div>
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
                <div className="flex gap-4 flex-wrap items-center justify-center border border-white/5 bg-black/20 p-6 rounded-xl">
                  <button
                    type="button"
                    disabled={isEditUploading}
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-24 h-24 rounded-md border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-white/[0.08] transition-all text-muted-foreground hover:text-primary disabled:opacity-50"
                  >
                    {isEditUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span className="text-[10px] uppercase tracking-widest">{isEditUploading ? 'Uploading' : 'Upload File'}</span>
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isEditUploading}
                    onClick={() => editCameraInputRef.current?.click()}
                    className="w-24 h-24 rounded-md border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-white/[0.08] transition-all text-muted-foreground hover:text-primary disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-widest">Take Photo</span>
                  </button>
                  <input
                    ref={editCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />
                </div>

                {editForm.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {editForm.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-24 rounded-md overflow-hidden border border-white/10 group">
                        <img src={img} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEditImage(i)}
                          title="Delete photo"
                          className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 z-10 transition-transform active:scale-95 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isEditSaving || isEditUploading} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                  {isEditSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : '✓ Update Dress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
