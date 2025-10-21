import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { Button } from '../components/ui/button';
import LazyImage from '../components/ui/LazyImage';
import Pagination from '../components/custom/Pagination';
import SearchBar from '../components/custom/SearchBar';
import { useSearch } from '@/hooks/use-search';
import { usePagination } from '@/hooks/use-pagination';
import { Eye, Download, Filter, FileDown, Plus, X, Upload, Trash2, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/redux/slices/auth/axiosInstance';

const Media = () => {
  const dispatch = useDispatch();
  const { products, status, totalItems } = useSelector((state) => state.products);
  
  // Use the search hook to eliminate duplication
  const search = useSearch({
    initialCategory: 'all',
    initialPage: 1,
    initialLimit: 24,
    initialStockFilter: 'all',
    initialSortBy: 'az'
  });

  // Use pagination hook to eliminate pagination duplication
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 24,
    totalItems,
    onPageChange: (page) => {
      search.handlePageChange(page);
    }
  });

  // Local state for UI-specific functionality
  const [previewImage, setPreviewImage] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

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

  // Fetch media on component mount
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Fetch products with debounced search using the hook
  useEffect(() => {
    search.handleSearch(search.debouncedSearchTerm);
  }, [search.debouncedSearchTerm, search.page, search.category, search.handleSearch]);

  // Filter products to show only those with images and apply search filtering
  useEffect(() => {
    console.log('useEffect triggered - products:', products.length, 'uploadedMedia:', uploadedMedia.length);
    
    let filtered = products.filter(product => 
      product && 
      product._id && 
      (product.picture?.secure_url || product.image)
    );

    // Add uploaded media to the filtered results
    const mediaItems = uploadedMedia.map(media => ({
      _id: media._id || media.id,
      title: media.name || media.originalName,
      picture: { secure_url: media.url },
      isUploadedMedia: true,
      uploadedAt: media.createdAt
    }));

    console.log('Media items created:', mediaItems);
    console.log('Raw uploaded media:', uploadedMedia);

    // Combine product images with uploaded media
    const allMedia = [...filtered, ...mediaItems];
    console.log('All media combined:', allMedia.length, 'items');
    console.log('Combined media details:', allMedia);

    // Apply search filtering using the hook
    const searchFiltered = search.filterProducts(allMedia, search.searchTerm, search.selectedProductId);
    console.log('Final filtered products:', searchFiltered.length);
    setFilteredProducts(searchFiltered);
  }, [products, uploadedMedia, search.searchTerm, search.selectedProductId, search.filterProducts]);

  const handlePreviewImage = useCallback((imageUrl) => {
    setPreviewImage(imageUrl);
  }, []);

  const handleDownloadImage = useCallback(async (imageUrl, productTitle) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${productTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  }, []);

  const handleSearchChange = useCallback((value) => {
    search.handleSearchChange(value);
  }, [search]);

  const handleSearchSubmit = useCallback((term, productId = null) => {
    search.handleSearchWithTracking(term, productId);
  }, [search]);

  const handlePageChange = useCallback((page) => {
    pagination.setCurrentPage(page);
  }, [pagination]);

  // Delete functionality
  const handleDeleteSingle = useCallback(async (itemId) => {
    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(`/media/${itemId}`);
      
      if (response.data.success) {
        toast.success('Media deleted successfully');
        // Refresh media list
        await fetchMedia();
        // Remove from selected items if it was selected
        setSelectedItems(prev => prev.filter(id => id !== itemId));
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete media: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  }, [fetchMedia]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for deletion');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete('/media/bulk', {
        data: { ids: selectedItems }
      });
      
      if (response.data.success) {
        toast.success(`Successfully deleted ${response.data.data.deletedCount} media items`);
        // Refresh media list
        await fetchMedia();
        // Clear selection
        setSelectedItems([]);
        setDeleteMode(false);
        setShowDeleteModal(false);
      } else {
        throw new Error(response.data.message || 'Bulk delete failed');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete media: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  }, [selectedItems, fetchMedia]);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredProducts.map(item => item._id));
    }
  }, [selectedItems.length, filteredProducts]);

  const toggleDeleteMode = useCallback(() => {
    setDeleteMode(prev => !prev);
    if (deleteMode) {
      setSelectedItems([]);
    }
  }, [deleteMode]);

  // Import functionality
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  }, []);

  const handleImport = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to import');
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await axiosInstance.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        console.log('Upload successful, received data:', response.data.data);
        toast.success(`Successfully uploaded ${response.data.data.length} images to Cloudinary`);
        // Refresh media list from database
        await fetchMedia();
        setShowImportModal(false);
        setSelectedFiles([]);
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload images: ' + (error.response?.data?.message || error.message));
      console.error('Upload error:', error);
    } finally {
      setIsImporting(false);
    }
  }, [selectedFiles, fetchMedia]);


  // Export functionality
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // Show progress
        toast.info(`Starting export of ${filteredProducts.length} images...`);
        
        // Fetch images in parallel batches for better performance
        const batchSize = 5; // Process 5 images at a time
        let processedCount = 0;
        
        for (let i = 0; i < filteredProducts.length; i += batchSize) {
          const batch = filteredProducts.slice(i, i + batchSize);
          
          // Process batch in parallel
          const batchPromises = batch.map(async (product, batchIndex) => {
            const imageUrl = product.picture?.secure_url || product.image;
            
            if (imageUrl) {
              try {
                const response = await fetch(imageUrl, {
                  // Add timeout to prevent hanging
                  signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`);
                }
                
                const blob = await response.blob();
                const fileName = `${product.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || `product_${i + batchIndex + 1}`}.jpg`;
                return { fileName, blob, success: true };
              } catch (error) {
                console.warn(`Failed to fetch image for ${product.title}:`, error);
                return { fileName: null, blob: null, success: false };
              }
            }
            return { fileName: null, blob: null, success: false };
          });
          
          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);
          
          // Add successful results to zip
          batchResults.forEach(({ fileName, blob, success }) => {
            if (success && fileName && blob) {
              zip.file(fileName, blob);
            }
          });
          
          processedCount += batch.length;
          
          // Update progress
          const progress = Math.round((processedCount / filteredProducts.length) * 100);
          toast.info(`Exporting... ${progress}% (${processedCount}/${filteredProducts.length})`);
        }

        // Generate zip with progress indication
        toast.info('Creating ZIP file...');
        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 } // Balanced compression
        });
        
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `media_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Successfully exported ${filteredProducts.length} images as ZIP`);
      } catch (zipError) {
        console.error('ZIP creation failed:', zipError);
        
        // Fallback: download images individually with progress
        toast.info('ZIP creation failed, downloading images individually...');
        
        for (let i = 0; i < filteredProducts.length; i++) {
          const product = filteredProducts[i];
          const imageUrl = product.picture?.secure_url || product.image;
          
          if (imageUrl) {
            try {
              const response = await fetch(imageUrl, {
                signal: AbortSignal.timeout(5000) // 5 second timeout for individual downloads
              });
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              const fileName = `${product.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || `product_${i + 1}`}.jpg`;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              // Show progress for individual downloads
              if ((i + 1) % 5 === 0 || i === filteredProducts.length - 1) {
                toast.info(`Downloaded ${i + 1}/${filteredProducts.length} images`);
              }
            } catch (error) {
              console.warn(`Failed to fetch image for ${product.title}:`, error);
            }
          }
        }
        toast.success(`Successfully exported ${filteredProducts.length} images individually`);
      }

      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export images');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [filteredProducts]);

  // Only show main loader for initial loading, not for search/filter operations
  if (status === 'loading' && products.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Gallery</h1>
        <p className="text-gray-600">Browse and manage all product images</p>
      </div>

      {/* Enhanced Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Enhanced Search Bar */}
          <div className="flex-1">
            <SearchBar
              searchTerm={search.searchTerm}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
              searchHistory={search.searchHistory}
              popularSearches={search.popularSearches}
              products={search.allProducts}
            />
          </div>

          {/* Import/Export/Delete Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 transition-all duration-200 hover:bg-green-50 hover:border-green-300"
            >
              <FileDown className="h-4 w-4" />
              Export
            </Button>

            <Button
              variant={deleteMode ? "destructive" : "outline"}
              onClick={toggleDeleteMode}
              className="flex items-center gap-2 transition-all duration-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4" />
              {deleteMode ? 'Cancel Delete' : 'Delete Mode'}
            </Button>

            {deleteMode && selectedItems.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedItems.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredProducts.length} images
            {search.searchTerm && ` for "${search.searchTerm}"`}
            {uploadedMedia.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({uploadedMedia.length} uploaded media)
              </span>
            )}
            {mediaLoading && (
              <span className="ml-2 text-blue-600 animate-pulse">
                Loading media...
              </span>
            )}
          </p>
          
          {deleteMode && filteredProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {selectedItems.length === filteredProducts.length ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedItems.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedItems.length > 0 && (
                <span className="text-sm text-red-600 font-medium">
                  {selectedItems.length} selected
                </span>
              )}
            </div>
          )}
        </div>
        
        {uploadedMedia.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Uploaded media includes images from Cloudinary storage
          </p>
        )}
      </div>

      {/* Media Grid - Image Only */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {filteredProducts.map((product) => (
            <div 
              key={product._id} 
              className="relative group transition-all duration-300 hover:scale-105"
            >
              {/* Selection Checkbox */}
              {deleteMode && (
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectItem(product._id);
                    }}
                    className="bg-white/90 hover:bg-white rounded-full p-1 shadow-md transition-all"
                  >
                    {selectedItems.includes(product._id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              )}

              {/* Product Image Only */}
              <div className="relative aspect-square bg-gray-50 overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105 cursor-pointer w-full"
              onClick={() => handlePreviewImage(product.picture?.secure_url || product.image)}
              >
                <LazyImage
                  src={product.picture?.secure_url || product.image}
                  alt={product.title || 'Product Image'}
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

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewImage(product.picture?.secure_url || product.image);
                    }}
                    className="bg-white/90 hover:bg-white text-black"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadImage(product.picture?.secure_url || product.image, product.title || 'product');
                    }}
                    className="bg-white/90 hover:bg-white text-black"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {/* Delete button for uploaded media */}
                  {product.isUploadedMedia && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this media?')) {
                          handleDeleteSingle(product._id);
                        }
                      }}
                      className="bg-red-500/90 hover:bg-red-500 text-white"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-500">
            {search.searchTerm
              ? 'Try adjusting your search criteria'
              : 'No product images available'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="rounded-lg shadow-lg object-contain w-full h-auto max-h-[90vh]"
              loading="eager"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 lg:right-24 xl:right-24 bg-black/70 hover:bg-red-500 text-white rounded-full p-1 px-2 text-sm md:text-base"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Images</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFiles([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Images will be automatically converted to WebP and uploaded to Cloudinary
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Selected {selectedFiles.length} files:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-xs text-gray-500 truncate">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || selectedFiles.length === 0}
                  className="flex-1 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Uploading...' : 'Upload to Cloudinary'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFiles([]);
                  }}
                  className="transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Export Images</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Export all {filteredProducts.length} product images as a ZIP file.</p>
                <p className="mt-2 text-xs text-gray-500">
                  Images will be named based on product titles and downloaded as a single ZIP file.
                </p>
                {isExporting && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700">Processing images in batches for faster export...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleExport}
                  disabled={isExporting || filteredProducts.length === 0}
                  className="flex-1 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? 'Exporting...' : 'Export All Images'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                  className="transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-600">Confirm Bulk Delete</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Are you sure you want to delete <strong>{selectedItems.length}</strong> media items?</p>
                <p className="mt-2 text-red-600 font-medium">This action cannot be undone.</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete {selectedItems.length} Items
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Media;
