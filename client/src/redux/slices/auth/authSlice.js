import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authService from "./authService";

// Load user from localStorage on app load
const userFromStorage = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

const initialState = {
  user: userFromStorage,
  isAuthenticated: !!userFromStorage,
  status: 'idle',
  error: null,
};

// Thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async (user, thunkAPI) => {
    try {
      return await authService.loginUser(user);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'success';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
