'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Tags, Settings, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface CategoryFacet {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface FacetOption {
  id: string;
  facet_id: string;
  label: string;
  value: string;
  sort_order: number;
}

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [isFacetSheetOpen, setIsFacetSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [facets, setFacets] = useState<CategoryFacet[]>([]);
  const [facetOptions, setFacetOptions] = useState<Record<string, FacetOption[]>>({});
  const [newFacetName, setNewFacetName] = useState('');
  const [editingFacet, setEditingFacet] = useState<CategoryFacet | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState<Record<string, string>>({});
  const [editingOption, setEditingOption] = useState<FacetOption | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }

    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        const { error } = await supabase.from('categories').update(formData).eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        const { error } = await supabase.from('categories').insert([formData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });

      fetchCategories();
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
      description: '',
    });
    setEditingCategory(null);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleManageFacets = async (category: Category) => {
    setSelectedCategory(category);
    setIsFacetSheetOpen(true);
    await fetchFacets(category.id);
  };

  const fetchFacets = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_facets')
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order');

      if (error) throw error;

      setFacets(data || []);

      if (data && data.length > 0) {
        const facetIds = data.map(f => f.id);
        await fetchFacetOptions(facetIds);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchFacetOptions = async (facetIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('facet_options')
        .select('*')
        .in('facet_id', facetIds)
        .order('sort_order');

      if (error) throw error;

      const optionsByFacet: Record<string, FacetOption[]> = {};
      (data || []).forEach((option) => {
        if (!optionsByFacet[option.facet_id]) {
          optionsByFacet[option.facet_id] = [];
        }
        optionsByFacet[option.facet_id].push(option);
      });

      setFacetOptions(optionsByFacet);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateFacet = async () => {
    if (!newFacetName.trim() || !selectedCategory) return;

    try {
      const slug = generateSlug(newFacetName);
      const { error } = await supabase
        .from('category_facets')
        .insert([{
          category_id: selectedCategory.id,
          name: newFacetName,
          slug,
          sort_order: facets.length,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Facet created successfully',
      });

      setNewFacetName('');
      await fetchFacets(selectedCategory.id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateFacet = async (facet: CategoryFacet, newName: string) => {
    try {
      const slug = generateSlug(newName);
      const { error } = await supabase
        .from('category_facets')
        .update({ name: newName, slug })
        .eq('id', facet.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Facet updated successfully',
      });

      setEditingFacet(null);
      if (selectedCategory) {
        await fetchFacets(selectedCategory.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFacet = async (facetId: string) => {
    if (!confirm('Are you sure? This will delete all options and product assignments for this facet.')) return;

    try {
      const { error } = await supabase
        .from('category_facets')
        .delete()
        .eq('id', facetId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Facet deleted successfully',
      });

      if (selectedCategory) {
        await fetchFacets(selectedCategory.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateOption = async (facetId: string) => {
    const label = newOptionLabel[facetId]?.trim();
    if (!label) return;

    try {
      const value = generateSlug(label);
      const currentOptions = facetOptions[facetId] || [];
      const { error } = await supabase
        .from('facet_options')
        .insert([{
          facet_id: facetId,
          label,
          value,
          sort_order: currentOptions.length,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Option created successfully',
      });

      setNewOptionLabel({ ...newOptionLabel, [facetId]: '' });
      if (selectedCategory) {
        await fetchFacets(selectedCategory.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateOption = async (option: FacetOption, newLabel: string) => {
    try {
      const value = generateSlug(newLabel);
      const { error } = await supabase
        .from('facet_options')
        .update({ label: newLabel, value })
        .eq('id', option.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Option updated successfully',
      });

      setEditingOption(null);
      if (selectedCategory) {
        await fetchFacets(selectedCategory.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Are you sure? This will remove this option from all products.')) return;

    try {
      const { error } = await supabase
        .from('facet_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Option deleted successfully',
      });

      if (selectedCategory) {
        await fetchFacets(selectedCategory.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMoveFacet = async (facet: CategoryFacet, direction: 'up' | 'down') => {
    const currentIndex = facets.findIndex(f => f.id === facet.id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === facets.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapFacet = facets[newIndex];

    try {
      await Promise.all([
        supabase.from('category_facets').update({ sort_order: newIndex }).eq('id', facet.id),
        supabase.from('category_facets').update({ sort_order: currentIndex }).eq('id', swapFacet.id),
      ]);

      if (selectedCategory) {
        await fetchFacets(selectedCategory.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMoveOption = async (facetId: string, option: FacetOption, direction: 'up' | 'down') => {
    const currentOptions = facetOptions[facetId] || [];
    const currentIndex = currentOptions.findIndex(o => o.id === option.id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === currentOptions.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapOption = currentOptions[newIndex];

    try {
      await Promise.all([
        supabase.from('facet_options').update({ sort_order: newIndex }).eq('id', option.id),
        supabase.from('facet_options').update({ sort_order: currentIndex }).eq('id', swapOption.id),
      ]);

      if (selectedCategory) {
        await fetchFacets(selectedCategory.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-wide mb-2">Categories</h1>
          <p className="text-gray-600">Manage product categories for navigation</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCategory ? 'Update Category' : 'Create Category'}
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
          <CardTitle>All Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Tags className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No categories yet. Create your first category!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.slug}</p>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageFacets(category)}
                      title="Manage Facets"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      title="Delete Category"
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

      <Sheet open={isFacetSheetOpen} onOpenChange={setIsFacetSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Manage Facets - {selectedCategory?.name}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Facet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Facet name (e.g., Skin concern)"
                    value={newFacetName}
                    onChange={(e) => setNewFacetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFacet();
                      }
                    }}
                  />
                  <Button onClick={handleCreateFacet} disabled={!newFacetName.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {facets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tags className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No facets yet. Add your first facet group above.</p>
                </div>
              ) : (
                facets.map((facet, index) => (
                  <Card key={facet.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingFacet?.id === facet.id ? (
                            <div className="flex gap-2">
                              <Input
                                defaultValue={facet.name}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateFacet(facet, e.currentTarget.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingFacet(null);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingFacet(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <CardTitle className="text-base">{facet.name}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                slug: {facet.slug}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveFacet(facet, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveFacet(facet, 'down')}
                            disabled={index === facets.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFacet(facet)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFacet(facet.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add option (e.g., Acne)"
                            value={newOptionLabel[facet.id] || ''}
                            onChange={(e) =>
                              setNewOptionLabel({ ...newOptionLabel, [facet.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateOption(facet.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCreateOption(facet.id)}
                            disabled={!newOptionLabel[facet.id]?.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {(facetOptions[facet.id] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No options yet
                            </p>
                          ) : (
                            (facetOptions[facet.id] || []).map((option, optionIndex) => (
                              <div
                                key={option.id}
                                className="flex items-center gap-2 p-2 border rounded bg-muted/30"
                              >
                                {editingOption?.id === option.id ? (
                                  <>
                                    <Input
                                      defaultValue={option.label}
                                      autoFocus
                                      className="flex-1"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleUpdateOption(option, e.currentTarget.value);
                                        } else if (e.key === 'Escape') {
                                          setEditingOption(null);
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingOption(null)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{option.label}</p>
                                      <p className="text-xs text-muted-foreground">
                                        value: {option.value}
                                      </p>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleMoveOption(facet.id, option, 'up')}
                                        disabled={optionIndex === 0}
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleMoveOption(facet.id, option, 'down')}
                                        disabled={optionIndex === (facetOptions[facet.id] || []).length - 1}
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingOption(option)}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteOption(option.id)}
                                      >
                                        <Trash2 className="w-3 h-3 text-destructive" />
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
