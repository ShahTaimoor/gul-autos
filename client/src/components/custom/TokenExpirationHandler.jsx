import { useSelector, useDispatch } from 'react-redux';
import { clearTokenExpired } from '@/redux/slices/auth/authSlice';
import LoginPopup from './LoginPopup';

const TokenExpirationHandler = () => {
  const dispatch = useDispatch();
  const { tokenExpired } = useSelector((state) => state.auth);

  const handleCloseLoginPopup = () => {
    console.log('Closing login popup');
    dispatch(clearTokenExpired());
  };

  if (!tokenExpired) {
    return null;
  }

  return (
    <LoginPopup isOpen={true} onClose={handleCloseLoginPopup} />
  );
};

export default TokenExpirationHandler; 