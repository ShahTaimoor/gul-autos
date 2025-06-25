// pages/Category.jsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  AddCategory,
  AllCategory,
  deleteCategory,
  reorderCategory,
  updateCategory,
} from '@/redux/slices/categories/categoriesSlice';
import { Loader2, PlusCircle, Trash2, Edit, X, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';

// DND Kit
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Row Componen
const SortableRow = ({ category, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </TableRow>
  );
};

const Category = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [inputValues, setInputValues] = useState({ name: '', picture: null });
  const [editingCategory, setEditingCategory] = useState(null);
  const { categories, status, error } = useSelector((state) => state.categories);
  const [localCategories, setLocalCategories] = useState([]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'picture') {
      const file = files[0];
      if (editingCategory) {
        setEditingCategory({ ...editingCategory, picture: file });
      } else {
        setInputValues((values) => ({ ...values, picture: file }));
      }
    } else {
      if (editingCategory) {
        setEditingCategory({ ...editingCategory, [name]: value });
      } else {
        setInputValues((values) => ({ ...values, [name]: value }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    editingCategory ? updateExistingCategory() : addNewCategory();
  };

  const addNewCategory = () => {
    if (!inputValues.name.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    const formData = new FormData();
    formData.append('name', inputValues.name);
    formData.append('picture', inputValues.picture);

    setLoading(true);
    dispatch(AddCategory(formData))
      .unwrap()
      .then((res) => {
        toast.success(res.message || 'Category added');
        setInputValues({ name: '', picture: null });
        dispatch(AllCategory());
      })
      .catch(() => toast.error('Failed to add category'))
      .finally(() => setLoading(false));
  };

  const updateExistingCategory = () => {
    if (!editingCategory?.name?.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    setLoading(true);
    dispatch(updateCategory({
      name: editingCategory.name,
      slug: editingCategory.slug,
      picture: editingCategory.picture,
    }))
      .unwrap()
      .then((res) => {
        toast.success(res.message || 'Category updated');
        setEditingCategory(null);
        dispatch(AllCategory());
      })
      .catch(() => toast.error('Failed to update category'))
      .finally(() => setLoading(false));
  };

  const handleDelete = (slug, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    setLoading(true);
    dispatch(deleteCategory(slug))
      .unwrap()
      .then((res) => {
        toast.success(res.message || 'Deleted successfully');
        dispatch(AllCategory());
      })
      .catch(() => toast.error('Failed to delete category'))
      .finally(() => setLoading(false));
  };

  const startEditing = (category) => {
    setEditingCategory({ ...category, picture: null });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  const sensors = useSensors(useSensor(PointerSensor));

const handleDragEnd = (event) => {
  const { active, over } = event;
  if (active.id !== over?.id) {
    const oldIndex = localCategories.findIndex((item) => item._id === active.id);
    const newIndex = localCategories.findIndex((item) => item._id === over.id);
    const reordered = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(reordered);

    const reorderedIds = reordered.map((item) => item._id);

    dispatch(reorderCategory(reorderedIds))
      .unwrap()
      .then(() => toast.success('Reorder saved!'))
      .catch(() => toast.error('Failed to save order'));
  }
};


  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  useEffect(() => {
    setLocalCategories(categories || []);
  }, [categories]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>

      {/* Add / Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingCategory ? 'Update Category' : 'Add Category'}</CardTitle>
          <CardDescription>
            {editingCategory ? 'Edit selected category' : 'Create a new category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                name="name"
                id="name"
                value={editingCategory ? editingCategory.name : inputValues.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="picture">Upload Image</Label>
              <Input
                type="file"
                id="picture"
                name="picture"
                onChange={handleChange}
                accept="image/*"
              />
            </div>
            {inputValues.picture && (
              <div className="text-sm text-gray-600">
                <img
                  src={URL.createObjectURL(inputValues.picture)}
                  alt="preview"
                  className="w-32 h-32 object-cover rounded my-2"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingCategory ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingCategory ? <Check className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </>
                )}
              </Button>
              {editingCategory && (
                <Button type="button" variant="outline" onClick={cancelEditing}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Category Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>Manage your product categories</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : status === 'failed' ? (
            <div className="text-red-500 p-4 border border-red-300">
              {error || 'Failed to load categories'}
            </div>
          ) : localCategories.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No categories found. Add one above.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localCategories.map((c) => c._id)} strategy={verticalListSortingStrategy}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localCategories.map((category, index) => (
                      <SortableRow key={category._id} category={category}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          <img
                            src={category.image}
                            alt={category.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.slug}</Badge>
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => startEditing(category)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(category.slug, category.name)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </SortableRow>
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Category;
