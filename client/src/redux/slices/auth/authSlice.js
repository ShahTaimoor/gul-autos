import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

const userFromStorage = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

const initialState = {
  user: userFromStorage,
  isAuthenticated: !!userFromStorage,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
  try {
    return await authService.loginUser(userData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});




export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, thunkAPI) => {
  try {
    return await authService.updateProfile(formData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const logoutAsync = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    await authService.logoutUser();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

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
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
      })
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
