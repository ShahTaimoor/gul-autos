// pages/Category.jsx
import React, { useEffect, useState } from 'react';
import {
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
import { useNavigate, useParams } from 'react-router-dom';
import { SingleCategory, updateCategory } from '@/redux/slices/categories/categoriesSlice';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


const UpdateCategory = () => {
    const dispatch = useDispatch();
    const [catName, setCatName] = useState({})

    const navigate = useNavigate()
    const [loading, setLoading] = useState(false);
    const { slug } = useParams()
    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        dispatch(updateCategory({ name: catName, slug }))
            .unwrap()
            .then((response) => {
                if (response?.success) {
                    toast.success(response?.message);
                    navigate('/admin/category')

                } else {
                    toast.error(response?.message || 'Failed to add category');
                }
                setLoading(false);
            })
            .catch((error) => {
                toast.error(error || 'Failed to add category');
                setLoading(false);
            });
    };



    useEffect(() => {
        setLoading(true);
        dispatch(SingleCategory(slug))
            .unwrap()
            .then((response) => {
                if (response?.success) {
                    setCatName(response.data.category?.name);
                } else {
                    toast.error(response?.message || 'Failed to fetch category');
                }
            })
            .catch((error) => {
                toast.error(error || 'Failed to fetch category');
            })
            .finally(() => setLoading(false));
    }, [dispatch, slug]);



    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                    <CardContent className="w-full">
                        <div className="space-y-2 mt-2">
                            {categories.map((category) => (
                                <TableRow key={category._id}>
                                    <TableCell className="font-medium">
                                        {editingCategory?.slug === category.slug ? (
                                            <span className="text-primary">{category.name}</span>
                                        ) : (
                                            category.name
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{category.slug}</Badge>
                                    </TableCell>
                                    <TableCell className="flex justify-end space-x-2">
                                        <Button
                                            variant={editingCategory?.slug === category.slug ? "default" : "outline"}
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
                        </div>

                        <Button className="mt-4" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Category'}
                        </Button>
                    </CardContent>
                </div>
            </form>



        </div>
    );
};

export default UpdateCategory;
