import axios from "axios";

const loginUser = async (userData) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/login`,
      userData,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data; // should include { user, token, success, message }
  };

const authService = { loginUser };
export default authService;
