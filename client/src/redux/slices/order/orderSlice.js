import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import orderService from "./orderService";

// Add Order
export const addOrder = createAsyncThunk(
  'orders/addOrder',
  async (orderData, thunkAPI) => {
    try {
      const res = await orderService.addOrder(orderData);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);


export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }, thunkAPI) => {
    try {
      const res = await orderService.updateOrderStatus(orderId, status);
      return { orderId, status, data: res.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);


// Fetch Orders (User)
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, thunkAPI) => {
    try {
      const res = await orderService.getAllOrder();
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// Fetch Orders (Admin)
export const fetchOrdersAdmin = createAsyncThunk(
  'orders/fetchOrdersAdmin',
  async (_, thunkAPI) => {
    try {
      const res = await orderService.getAllOrderAdmin();
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// Fetch Metrics
export const fetchOrdersMetrics = createAsyncThunk(
  'orders/fetchOrdersMetrics',
  async (_, thunkAPI) => {
    try {
      const res = await orderService.getMetrics();
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const initialState = {
  orders: [],
  metrics: null,
  status: 'idle',
    newOrdersCount: 0,
  error: null,
  metricsStatus: 'idle',
  metricsError: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Orders (User)
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders = action.payload.data;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Fetch Orders (Admin)
      .addCase(fetchOrdersAdmin.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrdersAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders = action.payload.data;
      })
      .addCase(fetchOrdersAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Fetch Metrics
      .addCase(fetchOrdersMetrics.pending, (state) => {
        state.metricsStatus = 'loading';
      })
      .addCase(fetchOrdersMetrics.fulfilled, (state, action) => {
        state.metricsStatus = 'succeeded';
        state.metrics = action.payload.data;
      })
      .addCase(fetchOrdersMetrics.rejected, (state, action) => {
        state.metricsStatus = 'failed';
        state.metricsError = action.payload;
      })

      // Add Order
      .addCase(addOrder.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addOrder.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders.push(action.payload.data);
      })
      .addCase(addOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Update the specific order in the state
        const index = state.orders.findIndex(order => order._id === action.payload.orderId);
        if (index !== -1) {
          state.orders[index].status = action.payload.status;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
  },
});

export default ordersSlice.reducer;
