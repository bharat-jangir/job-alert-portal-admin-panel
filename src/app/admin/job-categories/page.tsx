'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface JobCategory {
  _id: string;
  name: string;
  displayName?: string;
  slug: string;
  sequenceNo: number;
  showOnHome: boolean;
  isDeleted: boolean;
}

export default function JobCategoriesPage() {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', displayName: '', slug: '', sequenceNo: 0, showOnHome: true });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Get all active categories
      const response = await api.get('/job-categories/active');
      const data = response.data?.data ?? response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (category?: JobCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, displayName: category.displayName || category.name, slug: category.slug, sequenceNo: category.sequenceNo, showOnHome: category.showOnHome ?? true });
    } else {
      setEditingCategory(null);
      // Auto-increment sequence number for new category
      const maxSeq = categories.length > 0 ? Math.max(...categories.map(c => c.sequenceNo)) : 0;
      setFormData({ name: '', displayName: '', slug: '', sequenceNo: maxSeq + 1, showOnHome: true });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.patch(`/job-categories/${editingCategory._id}`, formData);
        toast.success('Category updated successfully');
      } else {
        await api.post('/job-categories', formData);
        toast.success('Category created successfully');
      }
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/job-categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Job Categories</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input 
                required 
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  setFormData({ ...formData, name, displayName: formData.displayName || name, slug: editingCategory ? formData.slug : slug });
                }}
                placeholder="e.g. Admit Card"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input 
                required 
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Admit Card"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input 
                required 
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. admit-card"
                disabled={!!editingCategory} // Usually better not to change slug if it affects URLs, but can be removed
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sequence No (Order)</label>
              <Input 
                required 
                type="number"
                value={formData.sequenceNo}
                onChange={(e) => setFormData({ ...formData, sequenceNo: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="showOnHome"
                checked={formData.showOnHome}
                onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="showOnHome" className="text-sm font-medium">Show on Home?</label>
            </div>
            <Button type="submit" className="w-full">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sequence No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Show on Home</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={`${category._id}-${category.sequenceNo}`}>
                <TableCell>
                  <Input 
                    type="number"
                    defaultValue={category.sequenceNo}
                    className="w-20 text-center h-8"
                    onBlur={async (e) => {
                      const newSeq = parseInt(e.target.value);
                      if (newSeq && newSeq !== category.sequenceNo) {
                        try {
                          await api.patch(`/job-categories/${category._id}/reorder`, { newSequence: newSeq });
                          toast.success('Reordered successfully');
                          fetchCategories();
                        } catch (err) {
                          toast.error('Failed to update sequence');
                          e.target.value = category.sequenceNo.toString();
                        }
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.displayName || category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell className="text-center">
                  <input
                    type="checkbox"
                    checked={category.showOnHome}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      try {
                        await api.patch(`/job-categories/${category._id}`, { showOnHome: checked });
                        toast.success('Visibility updated');
                        fetchCategories();
                      } catch (err) {
                        toast.error('Failed to update visibility');
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenDialog(category)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(category._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No categories found. Create one to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
