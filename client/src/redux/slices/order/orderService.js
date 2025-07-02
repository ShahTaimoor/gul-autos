import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Get Orders By User ID
const getAllOrder = async () => {
  try {
    const axiosResponse = await axios.get(`${API_URL}/get-orders-by-user-id`, {
      withCredentials: true, // 
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred while fetching orders.';
    return Promise.reject(errorMessage);
  }
};

// Add New Order
const addOrder = async (orderData) => {
  try {
    const axiosResponse = await axios.post(`${API_URL}/order`, orderData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred while adding the order.';
    return Promise.reject(errorMessage);
  }
};

// Get Orders By User ID
const getAllOrderAdmin = async () => {
  try {
    const axiosResponse = await axios.get(`${API_URL}/get-all-orders`, {
      withCredentials: true, 
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred while fetching orders.';
    return Promise.reject(errorMessage);
  }
};



// Update Order Status
const updateOrderStatus = async (orderId, {status, packerName}) => {
  try {
    const axiosResponse = await axios.put(
      `${API_URL}/${orderId}/status`,
      { status, packerName },
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return axiosResponse.data;
  } catch (error) {
    const errorMessage = 
      error.response?.data?.message || error.message ||
      'An unexpected error occurred while updating order';
    return Promise.reject(errorMessage);
  }
};


const orderService = { getAllOrder, addOrder,  getAllOrderAdmin, updateOrderStatus };

export default orderService;
