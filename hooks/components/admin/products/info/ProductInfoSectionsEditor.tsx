'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ProductInfoSection {
  id: string;
  product_id: string;
  title: string;
  content: string;
  order_index: number;
}

interface ProductInfoSectionsEditorProps {
  productId: string;
}

export function ProductInfoSectionsEditor({ productId }: ProductInfoSectionsEditorProps) {
  const [sections, setSections] = useState<ProductInfoSection[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ProductInfoSection | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const { toast } = useToast();

  useEffect(() => {
    if (productId) {
      fetchSections();
    }
  }, [productId]);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('product_info_sections')
      .select('*')
      .eq('product_id', productId)
      .order('order_index');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch sections', variant: 'destructive' });
      return;
    }

    setSections(data || []);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return;
    }

    const response = await fetch('/api/admin/products/info/sections/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        title: formData.title,
        content: formData.content,
      }),
    });

    if (!response.ok) {
      toast({ title: 'Error', description: 'Failed to create section', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Section created' });
    setFormData({ title: '', content: '' });
    setIsDialogOpen(false);
    fetchSections();
  };

  const handleUpdate = async () => {
    if (!editingSection || !formData.title || !formData.content) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return;
    }

    const response = await fetch('/api/admin/products/info/sections/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: editingSection.id,
        title: formData.title,
        content: formData.content,
      }),
    });

    if (!response.ok) {
      toast({ title: 'Error', description: 'Failed to update section', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Section updated' });
    setFormData({ title: '', content: '' });
    setEditingSection(null);
    setIsDialogOpen(false);
    fetchSections();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this section?')) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return;
    }

    const response = await fetch('/api/admin/products/info/sections/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Section deleted' });
    fetchSections();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...sections];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    const updates = reordered.map((section, idx) => ({
      id: section.id,
      order_index: idx,
    }));

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      return;
    }

    const response = await fetch('/api/admin/products/info/sections/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      toast({ title: 'Error', description: 'Failed to reorder sections', variant: 'destructive' });
      return;
    }

    setSections(reordered);
  };

  const openCreateDialog = () => {
    setEditingSection(null);
    setFormData({ title: '', content: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (section: ProductInfoSection) => {
    setEditingSection(section);
    setFormData({ title: section.title, content: section.content });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Info Sections</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSection ? 'Edit Section' : 'Create Section'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Section title"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Section content"
                    rows={8}
                  />
                </div>
                <Button onClick={editingSection ? handleUpdate : handleCreate} className="w-full">
                  {editingSection ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <p className="text-sm text-gray-500">No sections yet</p>
        ) : (
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-start gap-2 p-3 border rounded-lg">
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReorder(section.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReorder(section.id, 'down')}
                    disabled={index === sections.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{section.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{section.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEditDialog(section)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(section.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
