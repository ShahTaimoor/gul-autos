import { setUserLogout } from "@/redux/slices/authSlice"
import { useDispatch } from "react-redux"
import { toast } from "sonner"

const useErrorLogout = () => {

    const dispatch = useDispatch()

    const handleErrorLogout = (error, otherTitle = 'Error Occred') => {
        if (error.response.status === 400) {
            dispatch(setUserLogout())
            toast('Session Expired Please login Again to continue')
        } else {
            toast(otherTitle)
        }
    }

    return { handleErrorLogout }


}

export default useErrorLogout