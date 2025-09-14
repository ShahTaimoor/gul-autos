import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { ButtonLoader } from '@/components/ui/unified-loader';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AddProduct, importProductsFromExcel } from '@/redux/slices/products/productSlice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileSpreadsheet, Upload, Download } from 'lucide-react';

const CreateProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector((state) => state.categories);
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Initial input values
  const initialValues = {
    title: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    picture: null,
  };

  const [inputValues, setInputValues] = useState(initialValues);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues((values) => ({ ...values, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setInputValues((values) => ({ ...values, category: value }));
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error('Please select an Excel file');
      return;
    }

    setImportLoading(true);
    try {
      const result = await dispatch(importProductsFromExcel(excelFile)).unwrap();
      
      if (result.success) {
        toast.success(result.message);
        setExcelFile(null);
        // Reset file input
        const fileInput = document.getElementById('excelFile');
        if (fileInput) fileInput.value = '';
      } else {
        toast.error(result.message || 'Import failed');
      }
    } catch (error) {
      toast.error(error || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template with only name, stock, price
    const csvContent = "name,stock,price\nSample Product 1,10,29.99\nSample Product 2,5,15.50\nSample Product 3,20,9.99";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', inputValues.title);
    formData.append('description', inputValues.description);
    formData.append('price', inputValues.price);
    formData.append('category', inputValues.category);
    formData.append('stock', inputValues.stock);
    if (inputValues.picture) {
      formData.append('picture', inputValues.picture);
    }

    // Debug: Log form data
    console.log('Form data being sent:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    dispatch(AddProduct(formData))
      .unwrap()
      .then((response) => {
        console.log('Product creation response:', response);
        if (response?.success) {
          toast.success(response?.message);
          setInputValues(initialValues);
        } else {
          toast.error(response?.message || 'Failed to add product');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Product creation error:', error);
        toast.error(error || 'Failed to add product');
        setLoading(false);
      });
  };

  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  return (
    <Card className="w-full max-w-4xl lg:min-w-[900px] lg:min-h-[700px] mx-auto p-4 sm:p-6 md:p-8">
      <CardHeader>
        <CardTitle>Create Products</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Product</TabsTrigger>
            <TabsTrigger value="excel">Excel Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-6">
            <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">Product Title</Label>
              <Input
                value={inputValues.title}
                onChange={handleChange}
                id="title"
                name="title"
                placeholder="Product Title"
              />
            </div>

            {/* Price */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="price">Product Price</Label>
              <Input
                value={inputValues.price}
                onChange={handleChange}
                id="price"
                name="price"
                type="number"
                placeholder="Product Price"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={handleCategoryChange}
                value={inputValues.category}
              >
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

            {/* Stock */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="stock">Product Stock</Label>
              <Input
                value={inputValues.stock}
                onChange={handleChange}
                id="stock"
                name="stock"
                type="number"
                placeholder="Product Stock"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 flex flex-col space-y-1.5">
              <Label htmlFor="description">Product Description</Label>
              <Input
                value={inputValues.description}
                onChange={handleChange}
                id="description"
                name="description"
                placeholder="Product Description"
              />
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2 flex flex-col space-y-1.5">
              <Label>Upload Image</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
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
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
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
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, WEBP up to 5MB
                  </p>
                </div>
              </div>

              {/* Preview */}
              {inputValues.picture && (
                <div className="mt-2 space-y-2">
                  <img
                    src={URL.createObjectURL(inputValues.picture)}
                    alt="Preview"
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
                </div>
              )}
            </div>
          </div>

              <Button
                type="submit"
                className="mt-6 w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? <ButtonLoader /> : 'Add Product'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="excel" className="mt-6">
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Excel Import Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Excel columns:</strong> <strong>name</strong>, <strong>stock</strong>, <strong>price</strong></li>
                  <li>• <strong>All columns are optional</strong> - you can include any combination of these three</li>
                  <li>• Missing fields will use defaults: name="Product X", stock=0, price=0</li>
                  <li>• All products will be assigned to "General" category automatically</li>
                  <li>• Products will be created with default image (can be updated later)</li>
                  <li>• Empty rows will be skipped automatically</li>
                </ul>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Download Excel template</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {/* File Upload */}
              <form onSubmit={handleExcelImport}>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="excelFile">Select Excel File</Label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors duration-200">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label
                            htmlFor="excelFile"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                          >
                            <span>Upload Excel file</span>
                            <input
                              id="excelFile"
                              name="excelFile"
                              type="file"
                              accept=".xlsx,.xls,.csv"
                              className="sr-only"
                              onChange={(e) => setExcelFile(e.target.files[0])}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Excel files (.xlsx, .xls, .csv) up to 10MB
                        </p>
                      </div>
                    </div>

                    {/* File Preview */}
                    {excelFile && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {excelFile.name}
                          </span>
                          <span className="text-xs text-green-600">
                            ({(excelFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setExcelFile(null);
                            const fileInput = document.getElementById('excelFile');
                            if (fileInput) fileInput.value = '';
                          }}
                          className="text-xs text-red-600 hover:text-red-500 mt-1"
                        >
                          Remove file
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={importLoading || !excelFile}
                  >
                    {importLoading ? <ButtonLoader /> : 'Import Products'}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CreateProducts;
