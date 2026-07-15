import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, UploadCloud, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export function AdminContentPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: content, isLoading } = useQuery({
    queryKey: ['/api/content/partner_page'],
    queryFn: async () => {
      const res = await fetch('/api/content/partner_page');
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch content');
      }
      return res.json();
    }
  });

  useEffect(() => {
    if (content) {
      setTitle(content.title || '');
      setDescription(content.description || '');
      setImageUrl(content.imageUrl || '');
    }
  }, [content]);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      // url is like /uploads/xyz.png — works via Vite proxy in dev
      setImageUrl(url);
      toast({ title: 'Image uploaded!', description: 'Image is ready. Save changes to apply.' });
    } catch (err: any) {
      toast({ title: 'Upload error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/content/partner_page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, imageUrl }),
      });
      if (!res.ok) throw new Error('Failed to save content');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/partner_page'] });
      toast({ title: 'Saved!', description: 'Content updated successfully.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif mb-2">Page Content CMS</h1>
          <p className="text-muted-foreground">Manage dynamic text and images for public pages.</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="bg-card/30 border border-white/10 rounded-xl p-6 space-y-8">
        <h2 className="text-xl font-serif pb-2 border-b border-white/10 text-primary">
          Partner With Us Page
        </h2>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Main Title
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Partner With The Fashion Xpress"
              className="bg-black/40 border-white/10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Description Text
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Join our exclusive network of premium boutiques..."
              className="bg-black/40 border-white/10 min-h-[100px]"
            />
          </div>

          {/* Hero Image */}
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Hero Image
            </label>

            {/* Drag-and-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-8 px-6 text-center
                ${dragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/10 hover:border-primary/40 hover:bg-white/5'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Uploading…</p>
                </>
              ) : (
                <>
                  <UploadCloud className={`w-10 h-10 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-white font-medium">Drop image here or click to browse</p>
                    <p className="text-muted-foreground text-sm mt-1">PNG, JPG, WEBP — max 5 MB</p>
                  </div>
                </>
              )}
            </div>

            {/* Current image preview */}
            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video max-w-sm group">
                <img src={imageUrl} alt="Hero Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-[10px] uppercase tracking-wider rounded text-white/70">
                  Preview
                </div>
              </div>
            )}

            {/* Or enter URL manually */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">or enter URL</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <Input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/…"
              className="bg-black/40 border-white/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
