import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { login } from '@/redux/slices/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState({
    name: '',
    password: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/signup`, input, {
        headers: { 'Content-Type': 'application/json' },
      });
      toast.success('Signup successful! Logging you in...');
      const loginResponse = await dispatch(login(input)).unwrap();
      if (loginResponse?.user) {
        localStorage.setItem('user', JSON.stringify(loginResponse.user));
        navigate('/');
      } else {
        toast.error('Login failed after signup');
      }
    } catch (err) {
      console.error(err);
      toast.error('User already exists. Please choose another name.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await dispatch(login(input)).unwrap();
      if (response?.user) {
        toast.success('Login successful!');
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/');
      } else {
        toast.error('Login failed');
      }
    } catch (err) {
      const msg = err?.message || 'Something went wrong during login';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logos.png" alt="logo" className="h-16" />
        </div>

        {/* Tabs */}
        <div className="flex mb-8 bg-gray-100 p-1 rounded-lg">
          <Button
            onClick={() => setTab('login')}
            variant={tab === 'login' ? 'default' : 'ghost'}
            className={`w-1/2 ${tab === 'login' ? 'shadow-sm' : 'text-gray-600 hover:text-[#FED700]'}`}
          >
            Login
          </Button>
          <Button
            onClick={() => setTab('signup')}
            variant={tab === 'signup' ? 'default' : 'ghost'}
            className={`w-1/2 ${tab === 'signup' ? 'shadow-sm' : 'text-gray-600 hover:text-[#FED700]'}`}
          >
            Sign Up
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={tab === 'login' ? handleLogin : handleSignup}>
          <div className="space-y-4">
            <div className="relative w-full">
              <input
                type="text"
                name="name"
                value={input.name}
                onChange={handleChange}
                placeholder=" "
                required
                className="peer w-full border border-gray-300 rounded-md pb-2 px-3 pt-3 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
              />
              <label
                htmlFor="name"
                className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
              >
                Shop Name
              </label>
            </div>

            <div className="relative w-full mt-4">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={input.password}
                onChange={handleChange}
                placeholder=" "
                required
                className="peer w-full border border-gray-300 rounded-md pb-2 px-3 pt-3 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
              />
              <label
                htmlFor="password"
                className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-[#FED700]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button className="w-full mt-6 h-10" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {tab === 'login' ? 'Logging in...' : 'Creating account...'}
              </>
            ) : tab === 'login' ? (
              'Login to your account'
            ) : (
              'Create new account'
            )}
          </Button>
        </form>

        {/* Tab switch text */}
        {tab === 'login' ? (
          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={() => setTab('signup')}
              className="text-[#FED700] hover:text-[#e3c16c] font-medium"
            >
              Sign up
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => setTab('login')}
              className="text-[#FED700] hover:text-[#e3c16c] font-medium"
            >
              Login
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Login;
