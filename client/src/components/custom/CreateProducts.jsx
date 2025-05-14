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
        <Card className="w-[900px] ml-10 ">
            <CardHeader>
                <CardTitle>Create Product</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} encType='multipart/form-data'>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="title">Product Title</Label>
                            <Input value={inputValues.title} onChange={handleChange} id="title" type='text' name='title' placeholder="Product Title" />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="price">Product Price</Label>
                            <Input value={inputValues.price} onChange={handleChange} id="price" type='number' name='price' placeholder="Product Price" />
                            <Label htmlFor="category">Category</Label>
                            <Select onValueChange={handleCategoryChange}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {categories &&
                                        categories.map((category) => (
                                            <SelectItem key={category._id} value={category._id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}

                                </SelectContent>
                            </Select>
                        </div>
                                               <div className="flex flex-col space-y-1.5">
                            <Label>Upload Image</Label>

                            {/* Custom Upload Box */}
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
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label
                                            htmlFor="picture"
                                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                        >
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
                                <div className="mt-2">
                                    <img
                                        src={URL.createObjectURL(inputValues.picture)}
                                        alt="Image Preview"
                                        className="w-32 h-32 object-cover rounded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setInputValues((v) => ({ ...v, picture: null }))
                                        }
                                        className="text-sm font-medium text-red-600 hover:text-red-500"
                                    >
                                        Remove Image
                                    </button>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p className="truncate max-w-[200px]">
                                            <span className="font-medium">Name:</span> {inputValues.picture.name}
                                        </p>
                                        <p>
                                            <span className="font-medium">Size:</span>{' '}
                                            {(inputValues.picture.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <p>
                                            <span className="font-medium">Type:</span>{' '}
                                            {inputValues.picture.type.split('/')[1].toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="description">Product Description</Label>
                            <Input value={inputValues.description} onChange={handleChange} id="description" name='description' placeholder="Product description" />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="stock">Product Stock</Label>
                            <Input value={inputValues.stock} onChange={handleChange} id="stock" name='stock' placeholder="Product stock" />
                        </div>
                    </div>
                    <Button type='submit' className="mt-4" disabled={loading}>
                        {loading ? 'Adding...' : 'Adding Products'}
                    </Button>
                </form>
            </CardContent>

        </Card>
    )
}

export default CreateProducts