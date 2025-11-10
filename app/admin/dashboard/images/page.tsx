'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Copy, Image as ImageIcon, X, CheckCircle } from 'lucide-react';

interface StorageImage {
  name: string;
  id: string;
  url: string;
  created_at: string;
}

export default function ImageManagerPage() {
  const [images, setImages] = useState<StorageImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      const imagesWithUrls = data.map((file) => {
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(file.name);

        return {
          name: file.name,
          id: file.id,
          url: urlData.publicUrl,
          created_at: file.created_at || '',
        };
      });

      setImages(imagesWithUrls);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch images',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;
        return fileName;
      });

      await Promise.all(uploadPromises);

      toast({
        title: 'Success',
        description: `${files.length} image(s) uploaded successfully`,
      });

      fetchImages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload images',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(imageName: string) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase.storage
        .from('product-images')
        .remove([imageName]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });

      fetchImages();
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageName);
        return newSet;
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete image',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteSelected() {
    if (selectedImages.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedImages.size} selected image(s)?`)) return;

    try {
      const { error } = await supabase.storage
        .from('product-images')
        .remove(Array.from(selectedImages));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedImages.size} image(s) deleted successfully`,
      });

      fetchImages();
      setSelectedImages(new Set());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete images',
        variant: 'destructive',
      });
    }
  }

  function handleCopyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);

    toast({
      title: 'Copied',
      description: 'Image URL copied to clipboard',
    });

    setTimeout(() => setCopiedUrl(null), 2000);
  }

  function handleCopySelectedUrls() {
    const urls = images
      .filter(img => selectedImages.has(img.name))
      .map(img => img.url)
      .join(', ');

    navigator.clipboard.writeText(urls);

    toast({
      title: 'Copied',
      description: `${selectedImages.size} URL(s) copied to clipboard (comma-separated)`,
    });
  }

  function toggleImageSelection(imageName: string) {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageName)) {
        newSet.delete(imageName);
      } else {
        newSet.add(imageName);
      }
      return newSet;
    });
  }

  function selectAll() {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.name)));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading images...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-wide mb-2">Image Manager</h1>
          <p className="text-gray-600">Upload and manage product images in Supabase Storage</p>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            id="image-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Images'}
          </Button>
        </div>
      </div>

      {selectedImages.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedImages.size} image(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedImages(new Set())}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySelectedUrls}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy URLs
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Images ({images.length})</CardTitle>
            {images.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
              >
                {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No images yet. Upload your first image!</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => (
                <div
                  key={image.name}
                  className={`relative group border rounded-lg overflow-hidden transition-all ${
                    selectedImages.has(image.name)
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'hover:border-gray-400'
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleImageSelection(image.name)}
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedImages.has(image.name) && (
                        <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-1">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 truncate" title={image.name}>
                        {image.name}
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(image.url);
                      }}
                      className="shadow-lg"
                    >
                      {copiedUrl === image.url ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.name);
                      }}
                      className="shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p><strong>Upload:</strong> Click "Upload Images" to select and upload one or multiple images</p>
          <p><strong>Select:</strong> Click on any image to select it (blue ring appears)</p>
          <p><strong>Copy URL:</strong> Hover over an image and click the copy button, or select multiple and click "Copy URLs"</p>
          <p><strong>Delete:</strong> Hover over an image to delete individually, or select multiple and delete in bulk</p>
          <p><strong>Use in Products:</strong> Copy the URL and paste it into the product variant's image field (comma-separated for multiple)</p>
        </CardContent>
      </Card>
    </div>
  );
}
