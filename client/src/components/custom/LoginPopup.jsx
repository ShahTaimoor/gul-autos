import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { login } from '@/redux/slices/auth/authSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const LoginPopup = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValues] = useState({
    name: '',
    password: ''
  });

  // Debug logging
  console.log('LoginPopup Debug:', { isOpen });

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
          onClose(); // Close the popup
          // Refresh the current page to reload the data
          window.location.reload();
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

  // Reset form when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValues({ name: '', password: '' });
      setErrorMsg('');
      setShowPassword(false);
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) {
    console.log('LoginPopup not open - not rendering');
    return null;
  }

  console.log('LoginPopup rendering dialog');
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className='flex justify-center mb-2'>
              <h2 className='text-xl font-medium'>Gul Auto</h2>
            </div>
            <h2 className='text-2xl font-bold'>Session Expired</h2>
            <p className='text-sm text-muted-foreground mt-1'>Please login again to continue</p>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {errorMsg && (
            <Alert variant='destructive'>
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div>
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

          <div className='relative'>
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

          <Button className='w-full' disabled={loading} type='submit'>
            {loading ? (
              <>
                <Loader2 className='animate-spin mr-2 h-4 w-4' />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPopup; 