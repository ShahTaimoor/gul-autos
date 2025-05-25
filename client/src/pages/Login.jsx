import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '@/redux/slices/auth/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const expired = params.get('expired');
  const from = location.state?.from?.pathname || '/';
  useEffect(() => {
    if (expired) {
      toast.error("Session expired. Please login again.");
    }
  }, [expired]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [inputValue, setInputValues] = useState({
    name: '',
    password: ''
  });

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
          // This case might be rare, but just in case
          setErrorMsg('Login failed');
          toast.error('Login failed');
        }
      })
      .catch((error) => {
        console.log('Login error:', error);

        // Check error message or error code to detect invalid credentials
        // Adjust the condition below according to your backend's error structure
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
    <div className='w-full mx-auto md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12'>
      <form onSubmit={handleSubmit} className='w-full max-w-md bg-white p-8 rounded-lg border shadow-sm'>
        <div className='flex justify-center mb-6'>
          <h2 className='text-xl font-medium'>Gul Auto</h2>
        </div>
        <h2 className='text-2xl font-bold text-center mb-2'>Hey There!</h2>
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

        <div className='mb-4'>
          <label className='block text-sm font-semibold mb-2'>Password</label>
          <Input
            type='password'
            name='password'
            placeholder='Enter your password'
            value={inputValue.password}
            onChange={handleChange}
            required
          />
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
