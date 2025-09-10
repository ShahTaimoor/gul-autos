// pages/UpdateCategory.jsx
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
import { ButtonLoader } from '@/components/ui/unified-loader';
import { useNavigate, useParams } from 'react-router-dom';
import { SingleCategory, updateCategory } from '@/redux/slices/categories/categoriesSlice';


const UpdateCategory = () => {
    const dispatch = useDispatch();
    const [catName, setCatName] = useState('')

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
            <CardHeader>
                <CardTitle>Update Category</CardTitle>
                <CardDescription>Edit the category name</CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                            id="categoryName"
                            type="text"
                            value={catName}
                            onChange={(e) => setCatName(e.target.value)}
                            placeholder="Enter category name"
                            required
                            disabled={loading}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <ButtonLoader /> : 'Update Category'}
                    </Button>
                </CardContent>
            </form>
        </div>
    );
};

export default UpdateCategory;
