import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useListCategories, useCreateCategory, useDeleteCategory } from '@workspace/api-client-react';
import { Plus, Trash2, Pencil, Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/api-config';

export function AdminCategoriesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', imageUrl: '' });

  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', slug: '', imageUrl: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const createCategory = useCreateCategory({
    request: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setIsAdding(false);
        setFormData({ name: '', slug: '', imageUrl: '' });
      },
    },
  });

  const deleteCategory = useDeleteCategory({
    request: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory.mutate({ data: formData });
  };

  const openEdit = (category: any) => {
    setEditingCategory(category);
    setEditFormData({
      name: category.name || '',
      slug: category.slug || '',
      imageUrl: category.imageUrl || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsUpdating(true);
    try {
      const API_BASE = getApiBaseUrl();
      const res = await fetch(`${API_BASE}/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      if (!res.ok) throw new Error(await res.text());
      queryClient.invalidateQueries();
      setEditingCategory(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-2">Categories</h1>
          <p className="text-muted-foreground text-sm">Manage product catalog categories.</p>
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setEditingCategory(null); }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* New Category Form */}
      {isAdding && (
        <div className="mb-8 p-6 border border-white/10 rounded-xl bg-card/30">
          <h2 className="font-serif text-xl mb-4 text-primary">New Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
              <input
                required
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Slug</label>
              <input
                required
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Image URL (Optional)</label>
              <input
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCategory.isPending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {createCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Form */}
      {editingCategory && (
        <div className="mb-8 p-6 border border-primary/30 rounded-xl bg-card/40 backdrop-blur-md relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-serif text-xl text-primary">Edit Category #{editingCategory.id}</h2>
            <button
              onClick={() => setEditingCategory(null)}
              className="text-muted-foreground hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleEditSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
              <input
                required
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Slug</label>
              <input
                required
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                value={editFormData.slug}
                onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Image URL (Optional)</label>
              <input
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                value={editFormData.imageUrl}
                onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => (
            <div key={category.id} className="border border-white/10 rounded-xl bg-card/30 p-6 flex flex-col justify-between group hover:border-white/20 transition-all">
              <div>
                <h3 className="font-serif text-lg text-white">{category.name}</h3>
                <p className="text-sm text-muted-foreground font-mono mt-1">/{category.slug}</p>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => openEdit(category)}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  title="Edit category"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this category?')) {
                      deleteCategory.mutate({ id: category.id });
                    }
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  disabled={deleteCategory.isPending}
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
