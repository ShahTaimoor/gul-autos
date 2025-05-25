import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AddProduct } from '@/redux/slices/products/productSlice';

const CreateProducts = () => {


    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [inputValues, setInputValues] = useState({});
    const { categories } = useSelector((state) => state.categories);
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputValues((values) => ({ ...values, [name]: value }));
    };

    const handleCategoryChange = (value) => {
        setInputValues((values) => ({ ...values, category: value }));
    }

    const handleSubmit = (e) => {
        e.preventDefault();


        setLoading(true);

        dispatch(AddProduct(inputValues))
            .unwrap()
            .then((response) => {
                if (response?.success) {
                    toast.success(response?.message);
                    setInputValues({});
                    navigate('/admin/dashboard/all-products')
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
        dispatch(AllCategory());
    }, [dispatch]);


    return (
        <Card className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
            <CardHeader>
                <CardTitle>Create Product</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Title */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="title">Product Title</Label>
                            <Input value={inputValues.title} onChange={handleChange} id="title" name="title" placeholder="Product Title" />
                        </div>

                        {/* Product Price */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="price">Product Price</Label>
                            <Input value={inputValues.price} onChange={handleChange} id="price" name="price" type="number" placeholder="Product Price" />
                        </div>

                        {/* Category */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="category">Category</Label>
                            <Select onValueChange={handleCategoryChange}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {categories?.map((category) => (
                                        <SelectItem key={category._id} value={category._id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Product Stock */}
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="stock">Product Stock</Label>
                            <Input value={inputValues.stock} onChange={handleChange} id="stock" name="stock" type="number" placeholder="Product Stock" />
                        </div>

                        {/* Description (Full Width) */}
                        <div className="md:col-span-2 flex flex-col space-y-1.5">
                            <Label htmlFor="description">Product Description</Label>
                            <Input value={inputValues.description} onChange={handleChange} id="description" name="description" placeholder="Product Description" />
                        </div>

                        {/* Image Upload */}
                        <div className="md:col-span-2 flex flex-col space-y-1.5">
                            <Label>Upload Image</Label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors duration-200">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label htmlFor="picture" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                            <span>Upload a file</span>
                                            <input
                                                id="picture"
                                                name="picture"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(e) =>
                                                    setInputValues((prev) => ({
                                                        ...prev,
                                                        picture: e.target.files[0],
                                                    }))
                                                }
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
                                </div>
                            </div>

                            {/* Image Preview */}
                            {inputValues.picture && (
                                <div className="mt-2 space-y-2">
                                    <img src={URL.createObjectURL(inputValues.picture)} alt="Preview" className="w-32 h-32 object-cover rounded" />
                                    <button
                                        type="button"
                                        onClick={() => setInputValues((v) => ({ ...v, picture: null }))}
                                        className="text-sm font-medium text-red-600 hover:text-red-500"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Product'}
                    </Button>
                </form>
            </CardContent>
        </Card>

    )
}

export default CreateProducts