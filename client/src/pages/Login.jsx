import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValues] = useState({
    name: '',
    password: ''
  });

useEffect(() => {
  if (expired) {
    const timer = setTimeout(() => {
      toast.error("Session expired. Please login again.");
    }, 100); // Small delay to avoid duplicates
    return () => clearTimeout(timer);
  }
}, [expired]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    dispatch(login(inputValue))
      .unwrap()
      .then((response) => {
        if (response?.user) {
          toast.success('Login successful');
          setInputValues({ name: '', password: '' });
          navigate(from, { replace: true });
        } else {
          setErrorMsg('Login failed');
          toast.error('Login failed');
        }
      })
      .catch((error) => {
        console.log('Login error:', error);

        if (
          error?.message?.toLowerCase().includes('invalid') ||
          error?.message?.toLowerCase().includes('incorrect') ||
          error?.message?.toLowerCase().includes('username') ||
          error?.message?.toLowerCase().includes('password')
        ) {
          const errorText = 'Username or password is incorrect';
          setErrorMsg(errorText);
          toast.error(errorText);
        } else {
          const errorText = error?.message || 'Something went wrong during login';
          setErrorMsg(errorText);
          toast.error(errorText);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className='w-full mt-20 mx-auto md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12'>
      <form onSubmit={handleSubmit} className='w-full max-w-md bg-white p-8 rounded-lg border shadow-sm'>
        <div className='flex justify-center mb-6'>
          <img src="/logos.png" alt="" />
        </div>
        
        <p className='text-center mb-6'>Enter your details to Login</p>

        {errorMsg && (
          <Alert variant='destructive' className='mb-4'>
            <AlertTitle>Login Error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className='mb-4'>
          <label className='block text-sm font-semibold mb-2'>Shop Name</label>
          <Input
            type='text'
            name='name'
            placeholder='Enter your shop name'
            value={inputValue.name}
            onChange={handleChange}
            required
          />
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
          />
          <div
            onClick={() => setShowPassword((prev) => !prev)}
            className='absolute right-3 top-9 cursor-pointer text-gray-500'
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        <Button className='w-full mt-4' disabled={loading} type='submit'>
          {loading ? (
            <>
              <Loader2 className='animate-spin mr-2 h-4 w-4' />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>

        <p className='mt-6 text-center text-sm'>
          Don't have an account?
          <Link to='/signup' className='text-blue-500 ml-1'>Sign Up</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
