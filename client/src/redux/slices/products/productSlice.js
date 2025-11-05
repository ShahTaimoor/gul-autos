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
    async ({ category, searchTerm, page = 1, limit = 24, stockFilter, sortBy = 'az', productIds }, thunkAPI) => {
        try {
            const res = await productService.allProduct(category, searchTerm, page, limit, stockFilter, sortBy, productIds);
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

export const fetchSearchSuggestions = createAsyncThunk(
    'products/fetchSearchSuggestions',
    async ({ query, limit = 10 }, thunkAPI) => {
        try {
            // Only fetch if query is at least 2 characters
            if (!query || query.trim().length < 2) {
                return { data: [], query };
            }
            const res = await productService.getSearchSuggestions(query.trim(), limit);
            return { data: res.data || [], query: query.trim() };
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

const initialState = {
    products: [],
    singleProducts: null,
    status: 'idle',
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    searchSuggestions: [],
    suggestionsStatus: 'idle',
    suggestionsCache: {}, // Cache for search suggestions
};

export const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearSearchSuggestions: (state) => {
            state.searchSuggestions = [];
            state.suggestionsStatus = 'idle';
        },
    },
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
            .addCase(fetchSearchSuggestions.pending, (state) => {
                state.suggestionsStatus = 'loading';
            })
            .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
                state.suggestionsStatus = 'succeeded';
                state.searchSuggestions = action.payload.data || [];
                // Cache the suggestions
                if (action.payload.query) {
                    state.suggestionsCache[action.payload.query.toLowerCase()] = {
                        data: action.payload.data || [],
                        timestamp: Date.now()
                    };
                }
            })
            .addCase(fetchSearchSuggestions.rejected, (state, action) => {
                state.suggestionsStatus = 'failed';
                state.searchSuggestions = [];
            })

    }
});

export const { clearSearchSuggestions } = productsSlice.actions;
export default productsSlice.reducer;