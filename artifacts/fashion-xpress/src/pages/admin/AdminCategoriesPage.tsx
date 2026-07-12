import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';
import { useListCategories } from '@workspace/api-client-react';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', imageUrl: '' });

  const createCategory = useMutation({
    mutationFn: (data: any) => customFetch({ url: '/api/categories', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/categories'] });
      setIsAdding(false);
      setFormData({ name: '', slug: '', imageUrl: '' });
    }
  });

  const deleteCategory = useMutation({
    mutationFn: (id: number) => customFetch({ url: `/api/categories/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/categories'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Categories</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-6 border border-white/10 rounded-xl bg-card/30">
          <h2 className="font-serif text-xl mb-4">New Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
              <input
                required
                type="text"
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Slug</label>
              <input
                required
                type="text"
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Image URL (Optional)</label>
              <input
                type="text"
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCategory.isPending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
              >
                {createCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Category'}
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
            <div key={category.id} className="border border-white/5 rounded-xl bg-card/30 p-6 flex flex-col justify-between group">
              <div>
                <h3 className="font-serif text-lg">{category.name}</h3>
                <p className="text-sm text-muted-foreground font-mono mt-1">/{category.slug}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this category?')) {
                      deleteCategory.mutate(category.id);
                    }
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  disabled={deleteCategory.isPending}
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
