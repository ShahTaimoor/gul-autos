import axios from "axios";

// Create Category
const createCat = async (inputValues) => {
    try {
        const axiosResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/create-category`,
            inputValues,
            { withCredentials: true }
        );
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

// Update Category
const updateCat = async ({ name, slug, picture }) => {
    try {
        const formData = new FormData();
        formData.append('name', name);
        if (picture) formData.append('picture', picture);

        const axiosResponse = await axios.put(
            `${import.meta.env.VITE_API_URL}/update-category/${slug}`,
            formData,
            { withCredentials: true }
        );

        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

// Delete Category
const deleteCat = async (slug) => {
    try {
        const axiosResponse = await axios.delete(
            `${import.meta.env.VITE_API_URL}/delete-category/${slug}`,
            { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

// Get All Categories
const getAllCat = async () => {
    try {
        const axiosResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/all-category`,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

// Get Single Category
const getSingleCat = async (slug) => {
    try {
        const axiosResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/single-category/${slug}`,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};


const categoryService = { createCat, getAllCat, deleteCat, updateCat, getSingleCat };

export default categoryService;
