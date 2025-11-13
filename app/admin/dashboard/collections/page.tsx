'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Grid } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  slug: string;
  product_ids: string[];
  product_tags: string[];
  display_on_home: boolean;
  sort_order: number;
}

export default function CollectionsManagementPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    product_tags: '',
    display_on_home: false,
    sort_order: 0,
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('sort_order');

    if (!error && data) {
      setCollections(data);
    }

    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const collectionData = {
      name: formData.name,
      slug: formData.slug,
      product_tags: formData.product_tags ? formData.product_tags.split(',').map(t => t.trim()) : [],
      display_on_home: formData.display_on_home,
      sort_order: formData.sort_order,
    };

    try {
      if (editingCollection) {
        const { error } = await supabase.from('collections').update(collectionData).eq('id', editingCollection.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Collection updated successfully',
        });
      } else {
        const { error } = await supabase.from('collections').insert([collectionData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Collection created successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCollections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug,
      product_tags: collection.product_tags?.join(', ') || '',
      display_on_home: collection.display_on_home,
      sort_order: collection.sort_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collection deleted successfully',
      });

      fetchCollections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      product_tags: '',
      display_on_home: false,
      sort_order: 0,
    });
    setEditingCollection(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading collections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-wide mb-2">Collections</h1>
          <p className="text-gray-600">Manage collections for dynamic product carousels</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_tags">Product Tags (comma separated)</Label>
                <Input
                  id="product_tags"
                  value={formData.product_tags}
                  onChange={(e) => setFormData({ ...formData, product_tags: e.target.value })}
                  placeholder="featured, best-seller, new"
                />
                <p className="text-xs text-gray-500">
                  Products with these tags will appear in this collection carousel
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.display_on_home}
                    onChange={(e) => setFormData({ ...formData, display_on_home: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Display on homepage</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCollection ? 'Update Collection' : 'Create Collection'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Collections ({collections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <div className="text-center py-12">
              <Grid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No collections yet. Create your first collection!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{collection.name}</h3>
                      {collection.display_on_home && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          On Homepage
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{collection.slug}</p>
                    {collection.product_tags && collection.product_tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {collection.product_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Sort order: {collection.sort_order}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(collection)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(collection.id)}
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
    </div>
  );
}
