import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as cartService from './cartService';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  isUpdating: false,
};

// Fetch cart items
export const fetchCart = createAsyncThunk('fetchCart', async (_, thunkAPI) => {
  try {
    return await cartService.fetchCart();
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Add item to cart with optimistic update
export const addToCart = createAsyncThunk('addToCart', async ({ productId, quantity }, thunkAPI) => {
  try {
    const result = await cartService.addToCart({ productId, quantity });
    return result;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Remove item from cart
export const removeFromCart = createAsyncThunk('removeFromCart', async (productId, thunkAPI) => {
  try {
    return await cartService.removeFromCart(productId);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Empty cart
export const emptyCart = createAsyncThunk('emptyCart', async (_, thunkAPI) => {
  try {
    return await cartService.emptyCart();
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Update cart item quantity with debouncing
export const updateCartQuantity = createAsyncThunk(
  'cart/updateCartQuantity',
  async ({ productId, quantity }, thunkAPI) => {
    try {
      return await cartService.updateCartQuantity({ productId, quantity });
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Optimistic update for immediate feedback
    optimisticAddToCart: (state, action) => {
      const { productId, quantity, product } = action.payload;
      const existingItem = state.items.find(item => 
        (item.product?._id || item.product) === productId
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }
    },
    
    // Optimistic update for quantity changes
    optimisticUpdateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => 
        (item.product?._id || item.product) === productId
      );
      if (item) {
        item.quantity = quantity;
      }
    },
    
    // Optimistic remove
    optimisticRemoveFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => 
        (item.product?._id || item.product) !== productId
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.isUpdating = false;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
        state.isUpdating = false;
      })
      
      // Remove from Cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
      })
      
      // Empty Cart
      .addCase(emptyCart.fulfilled, (state) => {
        state.items = [];
      })
      
      // Update Cart Quantity
      .addCase(updateCartQuantity.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.isUpdating = false;
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.error = action.payload;
        state.isUpdating = false;
      });
  },
});

export const { 
  optimisticAddToCart, 
  optimisticUpdateQuantity, 
  optimisticRemoveFromCart 
} = cartSlice.actions;

export default cartSlice.reducer;
