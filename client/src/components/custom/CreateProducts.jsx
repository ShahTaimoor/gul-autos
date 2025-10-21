import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import OneLoader from '../ui/OneLoader';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AddProduct, importProductsFromExcel, fetchProducts } from '@/redux/slices/products/productSlice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileSpreadsheet, Upload, Download, ImageIcon, X, Search, Eye, Zap } from 'lucide-react';
import LazyImage from '../ui/LazyImage';
import Pagination from '../custom/Pagination';
import { convertToWebP, getImageInfo, createPreviewUrl, revokePreviewUrl, isWebPSupported } from '@/utils/imageConverter';
import axiosInstance from '@/redux/slices/auth/axiosInstance';

const CreateProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector((state) => state.categories);
  const { products } = useSelector((state) => state.products);
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
  const [selectedMediaImage, setSelectedMediaImage] = useState(null);
  const [mediaCurrentPage, setMediaCurrentPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);
  const [mediaTotalItems, setMediaTotalItems] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionInfo, setConversionInfo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

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
  const [categorySearch, setCategorySearch] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues((values) => ({ ...values, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setInputValues((values) => ({ ...values, category: value }));
    setCategorySearch(''); // Clear search when category is selected
  };

  const handleCategorySearch = (e) => {
    setCategorySearch(e.target.value);
  };

  // Fetch media from database
  const fetchMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      console.log('Fetching media from:', axiosInstance.defaults.baseURL + '/media');
      const response = await axiosInstance.get('/media');
      
      if (response.data.success) {
        setUploadedMedia(response.data.data);
        console.log('Fetched media from database:', response.data.data);
      } else {
        console.error('Media fetch failed:', response.data.message);
        toast.error('Failed to fetch media: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      toast.error('Failed to fetch media: ' + (error.response?.data?.message || error.message));
    } finally {
      setMediaLoading(false);
    }
  }, []);

  // Handle image file selection and conversion
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's a supported image format
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast.error('Please select a JPEG, PNG, or WebP image file');
      return;
    }

    setIsConverting(true);
    setConversionInfo(null);

    try {
      // Get original image info
      const originalInfo = await getImageInfo(file);
      
      // Convert to WebP if it's JPEG or PNG
      let processedFile = file;
      if (file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        processedFile = await convertToWebP(file, {
          quality: 0.85,
          maxWidth: 1200,
          maxHeight: 1200,
          maintainAspectRatio: true
        });
        
        // Show conversion info
        const compressionRatio = ((1 - processedFile.size / file.size) * 100).toFixed(1);
        setConversionInfo({
          original: {
            size: (file.size / 1024).toFixed(2),
            type: file.type.split('/')[1].toUpperCase()
          },
          converted: {
            size: (processedFile.size / 1024).toFixed(2),
            type: 'WEBP'
          },
          compression: compressionRatio
        });

        toast.success(`Image optimized! Size reduced by ${compressionRatio}%`);
      } else {
        toast.info('Image is already in WebP format');
      }

      // Create preview URL
      const newPreviewUrl = createPreviewUrl(processedFile);
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
      setPreviewUrl(newPreviewUrl);

      // Update form state
      setInputValues(prev => ({
        ...prev,
        picture: processedFile
      }));

    } catch (error) {
      console.error('Image conversion error:', error);
      toast.error(`Image conversion failed: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  // Filter categories based on search - show only if search is empty or category starts with search
  const filteredCategories = categories?.filter(category => {
    if (!categorySearch) return true; // Show all when no search
    return category.name.toLowerCase().startsWith(categorySearch.toLowerCase());
  }) || [];

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

    dispatch(AddProduct(formData))
      .unwrap()
      .then((response) => {
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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch products and media for media picker with pagination
  useEffect(() => {
    if (showMediaPicker) {
      // Fetch ALL products for media picker (no limit)
      dispatch(fetchProducts({ 
        category: 'all', 
        searchTerm: mediaSearchTerm, 
        page: 1, 
        limit: 1000, // Fetch all products
        stockFilter: 'active'
      }));
      // Also fetch uploaded media
      fetchMedia();
    }
  }, [dispatch, showMediaPicker, mediaSearchTerm, fetchMedia]);

  // Filter products for media picker - only show products with images
  const allProductsWithImages = products?.filter(product => 
    product && 
    product._id && 
    (product.picture?.secure_url || product.image)
  ) || [];

  // Add uploaded media to the filtered results
  const mediaItems = uploadedMedia.map(media => ({
    _id: media._id || media.id,
    title: media.name || media.originalName,
    picture: { secure_url: media.url },
    isUploadedMedia: true,
    uploadedAt: media.createdAt
  }));

  // Combine product images with uploaded media
  const allMedia = [...allProductsWithImages, ...mediaItems];

  // Apply search filter
  const searchFilteredProducts = allMedia.filter(item => {
    if (!mediaSearchTerm) return true;
    const searchLower = mediaSearchTerm.toLowerCase();
    return (
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      (item.isUploadedMedia && item.title?.toLowerCase().includes(searchLower))
    );
  });

  // Apply client-side pagination
  const itemsPerPage = 20;
  const startIndex = (mediaCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredMediaProducts = searchFilteredProducts.slice(startIndex, endIndex);

  // Update pagination info when products or media change
  useEffect(() => {
    if (showMediaPicker && (products || uploadedMedia.length > 0)) {
      const totalPages = Math.max(1, Math.ceil(searchFilteredProducts.length / itemsPerPage));
      setMediaTotalPages(totalPages);
      setMediaTotalItems(searchFilteredProducts.length);
    }
  }, [products, uploadedMedia, showMediaPicker, mediaSearchTerm, mediaCurrentPage, searchFilteredProducts.length]);


  const handleMediaPageChange = (page) => {
    setMediaCurrentPage(page);
  };

  const handleMediaSearchChange = (e) => {
    setMediaSearchTerm(e.target.value);
    setMediaCurrentPage(1); // Reset to first page when searching
  };

  const handleMediaSelect = async (product) => {
    setSelectedMediaImage(product);
    setShowMediaPicker(false);
    
    const imageUrl = product.picture?.secure_url || product.image;
    if (imageUrl) {
      setIsConverting(true);
      setConversionInfo(null);
      
      try {
        // Fetch the image
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${product.title}.jpg`, { type: blob.type });
        
        // Convert to WebP if it's not already
        let processedFile = file;
        if (file.type.match(/^image\/(jpeg|jpg|png)$/)) {
          processedFile = await convertToWebP(file, {
            quality: 0.85,
            maxWidth: 1200,
            maxHeight: 1200,
            maintainAspectRatio: true
          });
          
          // Show conversion info
          const compressionRatio = ((1 - processedFile.size / file.size) * 100).toFixed(1);
          setConversionInfo({
            original: {
              size: (file.size / 1024).toFixed(2),
              type: file.type.split('/')[1].toUpperCase()
            },
            converted: {
              size: (processedFile.size / 1024).toFixed(2),
              type: 'WEBP'
            },
            compression: compressionRatio
          });

          toast.success(`Image optimized! Size reduced by ${compressionRatio}%`);
        }

        // Create preview URL
        const newPreviewUrl = createPreviewUrl(processedFile);
        if (previewUrl) {
          revokePreviewUrl(previewUrl);
        }
        setPreviewUrl(newPreviewUrl);

        // Update form state
        setInputValues(prev => ({ ...prev, picture: processedFile }));
        
      } catch (error) {
        console.error('Error processing selected image:', error);
        toast.error('Failed to process selected image');
      } finally {
        setIsConverting(false);
      }
    }
  };

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
                <SelectContent position="popper" className="max-h-60">
                  {/* Search Input */}
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Type first letter to filter..."
                      value={categorySearch}
                      onChange={handleCategorySearch}
                      className="h-8"
                    />
                  </div>
                  
                  {/* Category List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ')
                          }
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        No categories found
                      </div>
                    )}
                  </div>
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
              
              {/* Media Picker Button */}
              <div className="mb-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowMediaPicker(true);
                    setMediaCurrentPage(1);
                    setMediaSearchTerm('');
                  }}
                  className="w-full flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Choose from Existing Images
                </Button>
              </div>

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
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="sr-only"
                        onChange={handleImageChange}
                        disabled={isConverting}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP up to 5MB • Auto-converted to WebP
                  </p>
                </div>
              </div>

              {/* Conversion Status */}
              {isConverting && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
                    <span className="text-sm text-blue-800">Optimizing image...</span>
                  </div>
                </div>
              )}

              {/* Conversion Info */}
              {conversionInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Image Optimized!</span>
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Original: {conversionInfo.original.size}KB ({conversionInfo.original.type})</span>
                      <span>→</span>
                      <span>Optimized: {conversionInfo.converted.size}KB ({conversionInfo.converted.type})</span>
                    </div>
                    <div className="text-center font-medium">
                      {conversionInfo.compression}% size reduction
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {inputValues.picture && (
                <div className="mt-2 space-y-2">
                  <div className="relative">
                    <img
                      src={previewUrl || URL.createObjectURL(inputValues.picture)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                    {inputValues.picture.type === 'image/webp' && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                        WebP
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInputValues((v) => ({ ...v, picture: null }));
                        setConversionInfo(null);
                        if (previewUrl) {
                          revokePreviewUrl(previewUrl);
                          setPreviewUrl(null);
                        }
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Remove Image
                    </button>
                    {inputValues.picture.type === 'image/webp' && (
                      <span className="text-xs text-green-600 font-medium">✓ Optimized</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

              <Button
                type="submit"
                className="mt-6 w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? <OneLoader size="small" text="Adding..." showText={false} /> : 'Add Product'}
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
                    {importLoading ? <OneLoader size="small" text="Importing..." showText={false} /> : 'Import Products'}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Choose from Existing Images</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMediaPicker(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search images by product name or description..."
                  value={mediaSearchTerm}
                  onChange={handleMediaSearchChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Media Grid */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {mediaLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading media...</span>
                </div>
              ) : filteredMediaProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredMediaProducts.map((product) => (
                    <div
                      key={product._id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-200"
                      onClick={() => handleMediaSelect(product)}
                    >
                      <div className="aspect-square bg-gray-50">
                        <LazyImage
                          src={product.picture?.secure_url || product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          fallback="/logo.jpeg"
                          quality={85}
                        />
                        
                        {/* Uploaded Media Indicator */}
                        {product.isUploadedMedia && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            Uploaded
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      {/* Product title */}
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate" title={product.title}>
                          {product.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
                  <p className="text-gray-500">
                    {mediaSearchTerm 
                      ? 'Try adjusting your search criteria'
                      : 'No product images available'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {mediaTotalPages > 1 && (
              <div className="fixed bottom-11 left-14 right-0">
                <Pagination
                  currentPage={mediaCurrentPage}
                  totalPages={mediaTotalPages}
                  onPageChange={handleMediaPageChange}
                />
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>
                    {filteredMediaProducts.length} images available
                    {mediaTotalPages > 1 && ` (Page ${mediaCurrentPage} of ${mediaTotalPages})`}
                  </p>
                  {uploadedMedia.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Including {uploadedMedia.length} uploaded media files
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowMediaPicker(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CreateProducts;