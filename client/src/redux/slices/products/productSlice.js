import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import productService from "./productService";

export const AddProduct = createAsyncThunk(
    'products/AddProduct',
    async (inputValues, thunkAPI) => {
        try {
            const res = await productService.createProduct(inputValues);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const fetchProducts = createAsyncThunk(
    "products/fetchAll",
    async ({ category, page = 1, limit = 24, stockFilter, sortBy = 'relevance' }, thunkAPI) => {
        try {
            const res = await productService.allProduct(category, page, limit, stockFilter, sortBy);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);



export const getSingleProduct = createAsyncThunk(
    "products/getSingleProduct",
    async (id, thunkAPI) => {
        try {
            const res = await productService.getSingleProd(id);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const updateSingleProduct = createAsyncThunk(
    "products/updateSingleProduct",
    async ({ id, inputValues }, thunkAPI) => {
        try {
            const res = await productService.updateProd({ id, inputValues });
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const deleteSingleProduct = createAsyncThunk(
    'products/deleteSingleProduct',
    async (id, thunkAPI) => {
        try {
            const res = await productService.deleteProduct(id);
            return { id, ...res };
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const importProductsFromExcel = createAsyncThunk(
    'products/importProductsFromExcel',
    async (excelFile, thunkAPI) => {
        try {
            const res = await productService.importProductsFromExcel(excelFile);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const updateProductStock = createAsyncThunk(
    'products/updateProductStock',
    async ({ id, stock }, thunkAPI) => {
        try {
            const res = await productService.updateProductStock({ id, stock });
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const bulkUpdateFeatured = createAsyncThunk(
    'products/bulkUpdateFeatured',
    async ({ productIds, isFeatured }, thunkAPI) => {
        try {
            const res = await productService.bulkUpdateFeatured({ productIds, isFeatured });
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const searchProducts = createAsyncThunk(
    'products/searchProducts',
    async ({ query, limit = 20 }, thunkAPI) => {
        try {
            const res = await productService.searchProducts(query, limit);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);


const initialState = {
    products: [],
    singleProducts: null,
    searchResults: [],
    searchQuery: '',
    status: 'idle',
    searchStatus: 'idle',
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
};

export const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(AddProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(AddProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const newProduct = action.payload.product;
                
                // Transform the product to match the expected structure
                const transformedProduct = {
                    ...newProduct,
                    image: newProduct.picture?.secure_url || null
                };
                
                state.products.push(transformedProduct);
            })
            .addCase(AddProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const { data, pagination } = action.payload || {};
                
                
                state.products = data || [];
                state.currentPage = pagination?.page || 1;
                state.totalPages = pagination?.totalPages || 1;
                state.totalItems = pagination?.total || 0;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateSingleProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
           .addCase(updateSingleProduct.fulfilled, (state, action) => {
  state.status = 'succeeded';
  const updatedProduct = action.payload.product;

  const transformedProduct = {
    ...updatedProduct,
    image: updatedProduct.picture?.secure_url || null
  };

  // Find and update the product in the current list
  const index = state.products.findIndex(p => p._id === updatedProduct._id);
  if (index !== -1) {
    state.products[index] = transformedProduct;
  }
})
            .addCase(updateSingleProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(getSingleProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getSingleProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.singleProducts = action.payload.product;
            })
            .addCase(getSingleProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteSingleProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteSingleProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = state.products.filter(prod => prod._id !== action.payload.id);
            })
            .addCase(deleteSingleProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(importProductsFromExcel.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(importProductsFromExcel.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Refresh products after successful import
                // The products will be refetched by the component
            })
            .addCase(importProductsFromExcel.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateProductStock.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateProductStock.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const updatedProduct = action.payload.product;
                
                // Find and update the product in the current list
                const index = state.products.findIndex(p => p._id === updatedProduct._id);
                if (index !== -1) {
                    state.products[index] = {
                        ...state.products[index],
                        stock: updatedProduct.stock
                    };
                }
            })
            .addCase(updateProductStock.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(bulkUpdateFeatured.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(bulkUpdateFeatured.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const { productIds, isFeatured } = action.meta.arg;
                
                // Update all selected products in the current list
                state.products = state.products.map(product => {
                    if (productIds.includes(product._id)) {
                        return {
                            ...product,
                            isFeatured: isFeatured
                        };
                    }
                    return product;
                });
            })
            .addCase(bulkUpdateFeatured.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(searchProducts.pending, (state) => {
                state.searchStatus = 'loading';
                state.error = null;
            })
            .addCase(searchProducts.fulfilled, (state, action) => {
                state.searchStatus = 'succeeded';
                state.searchResults = action.payload.data || [];
                state.searchQuery = action.payload.query || '';
            })
            .addCase(searchProducts.rejected, (state, action) => {
                state.searchStatus = 'failed';
                state.error = action.payload;
                state.searchResults = [];
            })

    }
});

export default productsSlice.reducer;