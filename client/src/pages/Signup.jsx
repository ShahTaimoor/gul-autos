import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/unified-loader'; // Add Eye and EyeOff icons
import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for showing password
  const navigate = useNavigate();
  const [inputValue, setInputValues] = useState({
    name: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/signup`,
        inputValue,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success('Signup successful! Please login.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      toast.error('User already exists. Please choose another name.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className='w-full mt-5 flex flex-col '>
      <form onSubmit={handleSubmit} className='w-full max-w-md bg-white p-8 rounded-lg border shadow-sm'>
        <div className='flex justify-center mb-6'>
          <img src="/logos.png" alt="" />
        </div>
        
        <p className='text-center mb-6'>Enter your details to Sign Up</p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className='mb-4'>
          <label className='block text-sm font-semibold mb-2'>Shop Name</label>
          <Input
            onChange={handleChange}
            placeholder='Enter Your Shop Name'
            type='text'
            name='name'
            value={inputValue.name}
            required
          />
        </div>

        <div className='mb-4 relative'>
          <label className='block text-sm font-semibold mb-2'>Password</label>
          <Input
            onChange={handleChange}
            placeholder='Enter Your Password'
            type={showPassword ? 'text' : 'password'} // Toggle between text and password
            name='password'
            value={inputValue.password}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5 mt-7 text-gray-500 mr-1.5" /> : <Eye className="h-5 w-5 mt-7 mr-1.5 text-gray-500" />}
          </button>
        </div>

        <Button className='w-full mt-4' disabled={loading}>
          {loading ? (
            <ButtonLoader />
          ) : (
            'Sign Up'
          )}
        </Button>

        <div className='text-center mt-4'>
          <p className='text-sm text-gray-600'>
            Already have an account?{' '}
            <Link to='/login' className='text-blue-600 hover:underline font-medium'>
              Login here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
