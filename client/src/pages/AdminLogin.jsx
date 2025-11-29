import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OneLoader from '@/components/ui/OneLoader';
import { Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin } from '@/redux/slices/auth/authSlice';

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ shopName: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValues] = useState({
    shopName: '',
    password: '',
  });

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && (user.role === 1 || user.role === 2)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Validation function
  const validateForm = useCallback(() => {
    const errors = { shopName: '', password: '' };
    
    if (!inputValue.shopName.trim()) {
      errors.shopName = 'Shop name is required';
    }
    
    if (!inputValue.password || inputValue.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    return errors;
  }, [inputValue]);

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
    if (validationErrors.shopName || validationErrors.password) {
      setErrorMsg(validationErrors);
      return;
    }

    setLoading(true);
    setErrorMsg({ shopName: '', password: '' });

    try {
      const response = await dispatch(adminLogin({
        name: inputValue.shopName.trim(),
        password: inputValue.password,
      })).unwrap();
      
      if (response?.success && response?.user) {
        toast.success('Admin login successful!');
        setInputValues({ shopName: '', password: '' });
        navigate('/admin/dashboard', { replace: true });
      } else {
        setErrorMsg({ shopName: 'Authentication failed', password: 'Authentication failed' });
        toast.error('Authentication failed');
      }
    } catch (error) {
      const errorMessage = error || 'Invalid shop name or password';
      setErrorMsg({ shopName: errorMessage, password: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch, inputValue, validateForm, navigate]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield size={32} className="text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 uppercase">
                Admin Login
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Enter your credentials to access the admin panel
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Name Field */}
            <div className="space-y-2">
              <Label htmlFor="shopName" className="text-sm font-semibold text-gray-900">
                Shop Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shopName"
                type="text"
                name="shopName"
                placeholder="Enter your shop name"
                value={inputValue.shopName}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="username"
                className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errorMsg.shopName && (
                <p className="text-red-500 text-xs mt-1">
                  {errorMsg.shopName}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={inputValue.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-12 pr-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errorMsg.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errorMsg.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <OneLoader size="small" text="" showText={false} />
                  <span>Logging in...</span>
                </div>
              ) : (
                <span>Login as Admin</span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 space-y-2">
            <p className="text-xs text-gray-500">
              Only administrators can access this page
            </p>
            <p className="text-xs text-gray-400">
              Need regular access? <Link to="/" className="text-primary hover:underline">Go to customer login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

