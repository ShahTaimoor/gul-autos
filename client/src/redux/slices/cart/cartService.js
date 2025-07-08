import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const axiosInstance = axios.create({
  baseURL: API_URL + '/',
  withCredentials: true,
});

// Get current user's cart
export const fetchCart = async () => {
  const res = await axiosInstance.get('/');
  return res.data;
};

// Add or update item in cart
export const addToCart = async ({ productId, quantity }) => {
  const res = await axiosInstance.post('/add', { productId, quantity });
  return res.data;
};

// Remove item from cart
export const removeFromCart = async (productId) => {
  const res = await axiosInstance.post('/remove', { productId });
  return res.data;
};

// Empty cart
export const emptyCart = async () => {
  const res = await axiosInstance.post('/empty');
  return res.data;
};

// Update quantity of an item in cart
export const updateCartQuantity = async ({ productId, quantity }) => {
  const res = await axiosInstance.post('/update', { productId, quantity });
  return res.data;
};
