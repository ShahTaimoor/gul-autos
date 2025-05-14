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

const Category = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [inputValues, setInputValues] = useState({ name: '', picture: null });
  const [editingCategory, setEditingCategory] = useState(null);
  const { categories, status, error } = useSelector((state) => state.categories);

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
    if (editingCategory) {
      updateExistingCategory();
    } else {
      addNewCategory();
    }
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
      .then((response) => {
        if (response?.success) {
          toast.success(response?.message);
          setInputValues({ name: '', picture: null });
          dispatch(AllCategory());
        } else {
          toast.error(response?.message || 'Failed to add category');
        }
      })
      .catch((error) => {
        toast.error(error || 'Failed to add category');
      })
      .finally(() => {
        setLoading(false);
      });
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
      .then((response) => {
        if (response?.success) {
          toast.success(response?.message);
          setEditingCategory({ ...categories, picture: null });

          dispatch(AllCategory());
        } else {
          toast.error(response?.message || 'Failed to update category');
        }
      })
      .catch((error) => {
        toast.error(error || 'Failed to update category');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = (slug, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" category?`)) {
      setLoading(true);
      dispatch(deleteCategory(slug))
        .unwrap()
        .then((response) => {
          if (response?.success) {
            toast.success(response?.message || 'Category deleted successfully');
            dispatch(AllCategory());
          } else {
            toast.error(response?.message || 'Failed to delete category');
          }
        })
        .catch((error) => {
          toast.error(error || 'Failed to delete category');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const startEditing = (category) => {
    setEditingCategory({ ...category, picture: null });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingCategory ? 'Update Category' : 'Add New Category'}
          </CardTitle>
          <CardDescription>
            {editingCategory
              ? 'Edit the selected category'
              : 'Create a new product category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            encType="multipart/form-data"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                name="name"
                value={editingCategory ? editingCategory.name : inputValues.name}
                onChange={handleChange}
                placeholder="e.g. Electronics, Clothing"
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <div className="space-y-4">
                {/* File Upload Area */}
                <div className="space-y-2">
                  <Label htmlFor="picture" className="block text-sm font-medium text-gray-700">
                    Upload Image
                    <span className="ml-1 text-red-500">*</span>
                  </Label>

                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors duration-200">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="picture"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="picture"
                            name="picture"
                            type="file"
                            className="sr-only"
                            onChange={handleChange}
                            accept="image/*"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF, WEBP up to 5MB
                      </p>
                    </div>
                  </div>
                </div>


                {/* Image preview */}
                {inputValues.picture && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(inputValues.picture)}
                      alt="Image Preview"
                      className="w-32 h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editingCategory) {
                          setEditingCategory({ ...editingCategory, picture: null });
                        } else {
                          setInputValues(v => ({ ...v, picture: null }));
                        }
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Remove Image
                    </button>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="truncate max-w-[200px]">
                        <span className="font-medium">Name:</span> {inputValues.picture.name}
                      </p>
                      <p>
                        <span className="font-medium">Size:</span> {(inputValues.picture.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p>
                        <span className="font-medium">Type:</span> {inputValues.picture.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}


              </div>

            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingCategory ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingCategory ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </>
                )}
              </Button>

              {editingCategory && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={loading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>Manage your product categories</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {status === 'failed' && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              {error || 'Failed to load categories'}
            </div>
          )}

          {categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category,index) => (
                  <TableRow key={category._id}>

                    <TableCell>
                     <span>{index + 1}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {editingCategory?.slug === category.slug ? (
                        <span className="text-primary">{category.name}</span>
                      ) : (
                        category.name
                      )}
                    </TableCell>
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
                    <TableCell className="flex justify-end space-x-2">
                      <Button
                        variant={editingCategory?.slug === category.slug ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => startEditing(category)}
                        disabled={loading}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(category.slug, category.name)}
                        disabled={loading || editingCategory?.slug === category.slug}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            status === 'succeeded' && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No categories found.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Add your first category using the form above.
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Category;
