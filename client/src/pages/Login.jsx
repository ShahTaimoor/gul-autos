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
      console.log('Login error:', error);

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
    <div className='w-full mt-20 mx-auto md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12'>
      <form onSubmit={handleSubmit} className='w-full max-w-md bg-white p-8 rounded-lg border shadow-sm'>
        <div className='flex justify-center mb-6'>
          <img src="/logos.png" alt="Logo" loading="eager" />
        </div>
        
        <p className='text-center mb-6'>Enter your details to Login</p>

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
            className='pr-10'
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className='absolute right-3 top-9 cursor-pointer text-gray-500 hover:text-gray-700'
            disabled={loading}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {errorMsg.password && (
            <p className="text-red-500 text-xs mt-1">{errorMsg.password}</p>
          )}
        </div>

        <Button 
          className='w-full mt-4' 
          disabled={loading} 
          type='submit'
        >
          {loading ? (
            <OneLoader size="small" text="Logging in..." showText={false} />
          ) : (
            'Login'
          )}
        </Button>

        <p className='mt-6 text-center text-sm'>
          Don't have an account?
          <a href='/signup' className='text-blue-500 ml-1 hover:underline'>Sign Up</a>
        </p>
      </form>
    </div>
  );
};

export default React.memo(Login);
