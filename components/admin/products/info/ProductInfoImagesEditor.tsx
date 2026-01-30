'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

interface ProductInfoImage {
  id: string;
  product_id: string;
  image_url: string;
  order_index: number;
}

interface ProductInfoImagesEditorProps {
  productId: string;
}

export function ProductInfoImagesEditor({ productId }: ProductInfoImagesEditorProps) {
  const [images, setImages] = useState<ProductInfoImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (productId) {
      fetchImages();
    }
  }, [productId]);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('product_info_images')
      .select('*')
      .eq('product_id', productId)
      .order('order_index');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch images', variant: 'destructive' });
      return;
    }

    setImages(data || []);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('admin_images')
        .insert({
          bucket: 'product-images',
          path: fileName,
          bytes: file.size,
          mime_type: file.type,
        });

      if (dbError) {
        console.error('Failed to index image in database:', dbError);
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        setUploading(false);
        return;
      }

      const response = await fetch('/api/admin/products/info/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save image');
      }

      toast({ title: 'Success', description: 'Image uploaded' });
      fetchImages();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return;
    }

    const response = await fetch('/api/admin/products/info/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      toast({ title: 'Error', description: 'Failed to delete image', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Image deleted' });
    fetchImages();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = images.findIndex(img => img.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === images.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...images];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    const updates = reordered.map((image, idx) => ({
      id: image.id,
      order_index: idx,
    }));

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return;
    }

    const response = await fetch('/api/admin/products/info/images/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      toast({ title: 'Error', description: 'Failed to reorder images', variant: 'destructive' });
      return;
    }

    setImages(reordered);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Info Images</span>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        {images.length === 0 ? (
          <p className="text-sm text-gray-500">No images yet</p>
        ) : (
          <div className="space-y-2">
            {images.map((image, index) => (
              <div key={image.id} className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReorder(image.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReorder(image.id, 'down')}
                    disabled={index === images.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative w-24 h-24 bg-gray-100 rounded overflow-hidden">
                  <Image
                    src={image.image_url}
                    alt="Product info"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-sm text-gray-600 truncate">
                  {image.image_url}
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(image.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
