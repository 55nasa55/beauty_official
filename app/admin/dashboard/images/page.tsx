'use client';

import { useEffect, useState, useRef } from 'react';
import { useSupabase } from '@/app/providers';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Copy, Image as ImageIcon, X, CircleCheck as CheckCircle, Search, ChevronLeft, ChevronRight, CircleAlert as AlertCircle } from 'lucide-react';

interface AdminImage {
  id: string;
  bucket: string;
  path: string;
  created_at: string;
  bytes: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  tags: string[] | null;
  url: string;
}

export default function ImageManagerPage() {
  const supabase = useSupabase();
  const [images, setImages] = useState<AdminImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(60);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIndexWarning, setShowIndexWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, [page, searchQuery]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(0); // Reset to first page on new search
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  async function fetchImages() {
    try {
      setIsLoading(true);

      const { data: sessionData } = await supabaseClient.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setAuthStatus("No session token (not logged in).");
        setIsLoading(false);
        return;
      }

      // Verify admin access first
      const meRes = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.status === 401 || meRes.status === 403) {
        const text = await meRes.text().catch(() => "");
        setAuthStatus(`Admin check failed: ${meRes.status}. Body: ${text}`);
        setIsLoading(false);
        return;
      }

      if (!meRes.ok) {
        const text = await meRes.text().catch(() => "");
        setAuthStatus(`Admin check failed: ${meRes.status}. Body: ${text}`);
        setIsLoading(false);
        return;
      }

      setAuthStatus("OK (admin verified). Loading images...");

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchQuery,
        sortBy: 'created_at',
        sortDir: 'desc',
      });

      const response = await fetch(`/api/admin/images/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        const text = await response.text().catch(() => "");
        setAuthStatus(`Images fetch failed: ${response.status}. Body: ${text}`);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        setAuthStatus(`Images fetch failed: ${response.status}. Body: ${text}`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      setImages(data.images);
      setTotal(data.total);
      setAuthStatus(null);

      // Show warning if database is empty but we might have storage files
      if (data.total === 0 && page === 0 && !searchQuery) {
        checkStorageForWarning();
      } else {
        setShowIndexWarning(false);
      }
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

  async function checkStorageForWarning() {
    try {
      // Try to list just 1 file from storage to see if there are any
      const { data } = await supabase.storage
        .from('product-images')
        .list('', { limit: 1 });

      if (data && data.length > 0) {
        setShowIndexWarning(true);
      }
    } catch (error) {
      // Silently fail - this is just for the warning
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadResults = await Promise.all(
        Array.from(files).map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Index in database
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
            // Don't throw - storage upload succeeded, which is most important
          }

          return fileName;
        })
      );

      toast({
        title: 'Success',
        description: `${files.length} image(s) uploaded successfully`,
      });

      // Refresh current page
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

  async function handleDelete(imagePath: string) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([imagePath]);

      if (storageError) throw storageError;

      // Delete from database index
      const { error: dbError } = await supabase
        .from('admin_images')
        .delete()
        .eq('path', imagePath);

      if (dbError) {
        console.error('Failed to remove image from database index:', dbError);
        // Don't throw - storage deletion succeeded
      }

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });

      fetchImages();
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imagePath);
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
      const pathsArray = Array.from(selectedImages);

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove(pathsArray);

      if (storageError) throw storageError;

      // Delete from database index
      const { error: dbError } = await supabase
        .from('admin_images')
        .delete()
        .in('path', pathsArray);

      if (dbError) {
        console.error('Failed to remove images from database index:', dbError);
        // Don't throw - storage deletion succeeded
      }

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
      .filter(img => selectedImages.has(img.path))
      .map(img => img.url)
      .join(', ');

    navigator.clipboard.writeText(urls);

    toast({
      title: 'Copied',
      description: `${selectedImages.size} URL(s) copied to clipboard (comma-separated)`,
    });
  }

  function toggleImageSelection(imagePath: string) {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imagePath)) {
        newSet.delete(imagePath);
      } else {
        newSet.add(imagePath);
      }
      return newSet;
    });
  }

  function selectAll() {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.path)));
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, total);

  if (isLoading && images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading images...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {authStatus && (
        <div className="mb-4 rounded border p-3 text-sm bg-yellow-50 border-yellow-200">
          <p className="font-semibold text-yellow-800 mb-1">Auth Status:</p>
          <p className="text-yellow-700">{authStatus}</p>
        </div>
      )}

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

      {showIndexWarning && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Image Index Not Populated</p>
                <p className="text-sm text-yellow-800 mt-1">
                  The database index is empty, but storage files may exist. Images uploaded through this interface will be indexed automatically.
                  Existing storage files will need to be re-uploaded or manually indexed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>
              All Images ({total})
              {total > 0 && ` - Showing ${startIndex}–${endIndex}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search images..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
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
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No images found matching your search.' : 'No images yet. Upload your first image!'}
              </p>
              {!searchQuery && (
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative group border rounded-lg overflow-hidden transition-all ${
                    selectedImages.has(image.path)
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'hover:border-gray-400'
                  }`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleImageSelection(image.path)}
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={image.url}
                        alt={image.path}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedImages.has(image.path) && (
                        <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-1">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 truncate" title={image.path}>
                        {image.path}
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
                        handleDelete(image.path);
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
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
          <p><strong>Search:</strong> Use the search box to filter images by filename</p>
          <p><strong>Select:</strong> Click on any image to select it (blue ring appears)</p>
          <p><strong>Copy URL:</strong> Hover over an image and click the copy button, or select multiple and click "Copy URLs"</p>
          <p><strong>Delete:</strong> Hover over an image to delete individually, or select multiple and delete in bulk</p>
          <p><strong>Use in Products:</strong> Copy the URL and paste it into the product variant's image field (comma-separated for multiple)</p>
        </CardContent>
      </Card>
    </div>
  );
}
