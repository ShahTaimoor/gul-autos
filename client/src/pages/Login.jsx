import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import OneLoader from '@/components/ui/OneLoader';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '@/redux/slices/auth/authSlice';


const Login = () => {

  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const params = new URLSearchParams(location.search);
  const expired = params.get('expired');
  const from = location.state?.from?.pathname || '/';

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ name: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValues] = useState({
    name: '',
    password: ''
  });

  // Memoized validation functions
  const validateForm = useCallback(() => {
    const errors = { name: '', password: '' };
    
    if (!inputValue.name.trim()) {
      errors.name = 'Username is required';
    }
    
    if (!inputValue.password.trim()) {
      errors.password = 'Password is required';
    }
    
    return errors;
  }, [inputValue]);

  // Memoized error messages
  const errorMessages = useMemo(() => ({
    invalidCredentials: 'Username or password is incorrect',
    serverError: 'Something went wrong during login',
    networkError: 'Network error. Please check your connection'
  }), []);

  useEffect(() => {
    if (expired) {
      const timer = setTimeout(() => {
        toast.error("Session expired. Please login again.");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [expired]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errorMsg[name]) {
      setErrorMsg(prev => ({ ...prev, [name]: '' }));
    }
  }, [errorMsg]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.name || validationErrors.password) {
      setErrorMsg(validationErrors);
      return;
    }

    setLoading(true);
    setErrorMsg({ name: '', password: '' });

    try {
      const response = await dispatch(login(inputValue)).unwrap();
      
      if (response?.user) {
        toast.success('Login successful');
        setInputValues({ name: '', password: '' });
        navigate(from, { replace: true });
      } else {
        setErrorMsg({ name: 'Login failed', password: 'Login failed' });
        toast.error('Login failed');
      }
    } catch (error) {
      let nameError = '';
      let passwordError = '';

      if (error?.message?.toLowerCase().includes('username') ||
          error?.message?.toLowerCase().includes('name')) {
        nameError = 'Invalid username';
      }
      
      if (error?.message?.toLowerCase().includes('password')) {
        passwordError = 'Invalid password';
      }

      // If no specific field error, show generic error
      if (!nameError && !passwordError) {
        nameError = 'Invalid username';
        passwordError = 'Invalid password';
      }

      setErrorMsg({ name: nameError, password: passwordError });
      toast.error(errorMessages.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }, [dispatch, inputValue, navigate, from, validateForm, errorMessages.invalidCredentials]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className='min-h-screen  bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center items-center p-4 sm:p-6'>
      <form onSubmit={handleSubmit} className='w-full max-w-sm sm:max-w-md bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-white/40 shadow-2xl'>
        <div className='flex justify-center mb-6 sm:mb-8'>
          <div className="relative">
            <img src="/logo.jpeg" alt="GULTRADERS Logo" loading="eager" className="h-16 sm:h-20 w-auto object-contain" />
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-sm"></div>
          </div>
        </div>
        
        <h1 className='text-xl sm:text-2xl font-bold text-center mb-2 text-gray-800'>Welcome Back</h1>
        <p className='text-center mb-6 sm:mb-8 text-sm sm:text-base text-gray-600'>Sign in to your GULTRADERS account</p>

        <div className='mb-4'>
          <label className='block text-sm font-semibold mb-2'>Shop Name</label>
          <Input
            type='text'
            name='name'
            placeholder='Enter your shop name'
            value={inputValue.name}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="username"
            className='h-11 sm:h-10'
          />
          {errorMsg.name && (
            <p className="text-red-500 text-xs mt-1">{errorMsg.name}</p>
          )}
        </div>

        <div className='mb-4 relative'>
          <label className='block text-sm font-semibold mb-2'>Password</label>
          <Input
            type={showPassword ? 'text' : 'password'}
            name='password'
            placeholder='Enter your password'
            value={inputValue.password}
            onChange={handleChange}
            required
            className='pr-10 h-11 sm:h-10'
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 p-1'
            disabled={loading}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {errorMsg.password && (
            <p className="text-red-500 text-xs mt-1">{errorMsg.password}</p>
          )}
        </div>

        <Button 
          className='w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 h-12 sm:h-auto' 
          disabled={loading} 
          type='submit'
        >
          {loading ? (
            <OneLoader size="small" text="Logging in..." showText={false} />
          ) : (
            'Sign In'
          )}
        </Button>

        <p className='mt-6 text-center text-sm text-gray-600'>
          Don't have an account?
          <Link to='/signup' className='text-blue-600 ml-1 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200'>Sign Up</Link>
        </p>
      </form>
    </div>
  );
};

export default React.memo(Login);
