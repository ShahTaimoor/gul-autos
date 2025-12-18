import { setUserLogout } from "@/redux/slices/authSlice"
import { useDispatch } from "react-redux"

const useErrorLogout = () => {

    const dispatch = useDispatch()

    const handleErrorLogout = (error, otherTitle = 'Error Occred') => {
        if (error.response.status === 400) {
            dispatch(setUserLogout())
            // No toast notification - rely on automatic redirect
            // The ProtectedRoute component will handle the redirect to login page
        }
    }

    return { handleErrorLogout }


}

export default useErrorLogout