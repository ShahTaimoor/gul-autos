import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import OneLoader from '@/components/ui/OneLoader';
import { Eye, EyeOff } from 'lucide-react'; // Add Eye and EyeOff icons
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
      navigate('/');
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
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center justify-center p-4 sm:p-6'>
      <form onSubmit={handleSubmit} className='w-full max-w-sm sm:max-w-md bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-white/40 shadow-2xl'>
        <div className='flex justify-center mb-6 sm:mb-8'>
          <div className="relative">
            <img src="/logo.jpeg" alt="GULTRADERS Logo" className="h-16 sm:h-20 w-auto object-contain" />
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl blur-sm"></div>
          </div>
        </div>
        
        <h1 className='text-xl sm:text-2xl font-bold text-center mb-2 text-gray-800'>Join GULTRADERS</h1>
        <p className='text-center mb-6 sm:mb-8 text-sm sm:text-base text-gray-600'>Create your account to get started</p>

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
            className='h-11 sm:h-10'
          />
        </div>

        <div className='mb-4 relative'>
          <label className='block text-sm font-semibold mb-2'>Password</label>
          <div className='relative'>
            <Input
              onChange={handleChange}
              placeholder='Enter Your Password'
              type={showPassword ? 'text' : 'password'} // Toggle between text and password
              name='password'
              value={inputValue.password}
              required
              className='h-11 sm:h-10 pr-10 w-full'
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 p-1 flex items-center justify-center"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button className='w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 h-12 sm:h-auto' disabled={loading}>
          {loading ? (
            <OneLoader size="small" text="Signing Up..." showText={false} />
          ) : (
            'Create Account'
          )}
        </Button>

        <div className='text-center mt-6'>
          <p className='text-sm text-gray-600'>
            Already have an account?{' '}
            <Link 
              to="/login" 
              className='text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200'
            >
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
