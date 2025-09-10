import { setTokenExpired } from "@/redux/slices/auth/authSlice"
import { useDispatch } from "react-redux"
import { toast } from "sonner"

const useErrorLogout = () => {

    const dispatch = useDispatch()

    const handleErrorLogout = (error, otherTitle = 'Error Occurred') => {
        if (error.response?.status === 401) {
            dispatch(setTokenExpired())
            // No toast needed - user will be redirected to login page
        } else {
            toast.error(otherTitle)
        }
    }

    return { handleErrorLogout }


}

export default useErrorLogout