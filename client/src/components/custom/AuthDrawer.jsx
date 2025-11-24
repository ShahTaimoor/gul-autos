import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OneLoader from '@/components/ui/OneLoader';
import { Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '@/redux/slices/auth/authSlice';
import axios from 'axios';
import { useAuthDrawer } from '@/contexts/AuthDrawerContext';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

const AuthDrawer = () => {
  const { open, setOpen, initialMode } = useAuthDrawer();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [mode, setMode] = useState(initialMode || 'login'); // 'login' or 'signup'
  
  // Update mode when initialMode changes
  useEffect(() => {
    if (open && initialMode) {
      setMode(initialMode);
    }
  }, [open, initialMode]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ name: '', password: '', phone: '', address: '', city: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValues] = useState({
    name: '',
    password: '',
    phone: '',
    address: '',
    city: ''
  });

  // Check if user is logged in, close drawer
  useEffect(() => {
    if (user && open) {
      setOpen(false);
    }
  }, [user, open, setOpen]);

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setInputValues({ name: '', password: '', phone: '', address: '', city: '' });
      setErrorMsg({ name: '', password: '', phone: '', address: '', city: '' });
      setShowPassword(false);
    }
  }, [open]);

  // Memoized validation functions
  const validateForm = useCallback(() => {
    const errors = { name: '', password: '', phone: '', address: '', city: '' };
    const isLoginMode = mode === 'login';
    
    if (!inputValue.name.trim()) {
      errors.name = 'Shop name is required';
    }
    
    if (!inputValue.password.trim()) {
      errors.password = 'Password is required';
    }
    
    // Only validate phone, address, city for signup
    if (!isLoginMode) {
      if (!inputValue.phone.trim()) {
        errors.phone = 'Phone number is required';
      }
      
      if (!inputValue.address.trim()) {
        errors.address = 'Address is required';
      }
      
      if (!inputValue.city.trim()) {
        errors.city = 'City is required';
      }
    }
    
    return errors;
  }, [inputValue, mode]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errorMsg[name]) {
      setErrorMsg(prev => ({ ...prev, [name]: '' }));
    }
  }, [errorMsg]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.name || validationErrors.password) {
      setErrorMsg(validationErrors);
      return;
    }

    setLoading(true);
    setErrorMsg({ name: '', password: '', phone: '', address: '', city: '' });

    try {
      const response = await dispatch(login(inputValue)).unwrap();
      
      if (response?.user) {
        toast.success('Login successful');
        setInputValues({ name: '', password: '', phone: '', address: '', city: '' });
        setOpen(false);
        // User will stay on current page after login
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

      setErrorMsg({ name: nameError, password: passwordError, phone: '', address: '', city: '' });
      toast.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
      }, [dispatch, inputValue, validateForm, setOpen]);

  const handleSignup = useCallback(async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.name || validationErrors.password || validationErrors.phone || validationErrors.address || validationErrors.city) {
      setErrorMsg(validationErrors);
      return;
    }

    setLoading(true);
    setErrorMsg({ name: '', password: '', phone: '', address: '', city: '' });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/signup`,
        inputValue,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data?.success) {
        toast.success('Signup successful! Please login.');
        setInputValues({ name: '', password: '', phone: '', address: '', city: '' });
        // Switch to login mode after successful signup
        setMode('login');
      } else {
        toast.error(response.data?.message || 'Signup failed. Please try again.');
        setErrorMsg({ name: response.data?.message || 'Signup failed', password: '', phone: '', address: '', city: '' });
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      // Handle different error types
      let errorMessage = 'Signup failed. Please try again.';
      let nameError = '';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        nameError = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'User with this shop name already exists. Please choose another name.';
        nameError = 'User already exists';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
        nameError = 'Server error';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      setErrorMsg({ name: nameError, password: '', phone: '', address: '', city: '' });
    } finally {
      setLoading(false);
    }
  }, [inputValue, validateForm]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setInputValues({ name: '', password: '', phone: '', address: '', city: '' });
    setErrorMsg({ name: '', password: '', phone: '', address: '', city: '' });
  }, []);

  const isLogin = mode === 'login';

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md">
        <div className="mx-auto w-full max-w-md h-full flex flex-col">
          <DrawerHeader className="relative flex-shrink-0">
            <DrawerTitle className="text-2xl font-bold text-gray-900 uppercase">
              {isLogin ? 'LOGIN' : 'SIGNUP'}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </DrawerDescription>
            <DrawerClose asChild>
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-900" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          
          <form 
            onSubmit={isLogin ? handleLogin : handleSignup}
            className="px-6 pb-6 space-y-6 flex-1 overflow-y-auto"
          >
            {/* Shop Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-900">
                Shop Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your shop name"
                value={inputValue.name}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="username"
                className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errorMsg.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errorMsg.name}
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
                  autoComplete={isLogin ? "current-password" : "new-password"}
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

            {/* Phone Field (Signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={inputValue.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="tel"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {errorMsg.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorMsg.phone}
                  </p>
                )}
              </div>
            )}

            {/* Address Field (Signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-900">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  type="text"
                  name="address"
                  placeholder="Enter your address"
                  value={inputValue.address}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="street-address"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {errorMsg.address && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorMsg.address}
                  </p>
                )}
              </div>
            )}

            {/* City Field (Signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-semibold text-gray-900">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  type="text"
                  name="city"
                  placeholder="Enter your city"
                  value={inputValue.city}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="address-level2"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {errorMsg.city && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorMsg.city}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <OneLoader size="small" text="" showText={false} />
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </div>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </Button>

            {/* Toggle Mode Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-gray-900 underline hover:text-primary transition-colors"
              >
                {isLogin ? (
                  <>New customer? Create your account</>
                ) : (
                  <>Already have an account? Sign In</>
                )}
              </button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AuthDrawer;

