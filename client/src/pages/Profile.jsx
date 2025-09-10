import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateProfile, changePassword } from '@/redux/slices/auth/authSlice';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ButtonLoader } from '@/components/ui/unified-loader';
import { Textarea } from '@/components/ui/textarea';

const Profile = React.memo(() => {
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);

  // Local state for form inputs
  const [formData, setFormData] = useState({
    address: user?.address || '',
    phone: user?.phone || '',
    city: user?.city || ''
  });

  // Show form if user info incomplete
  const [showForm, setShowForm] = useState(!user?.address || !user?.phone || !user?.city);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Sync local state with updated Redux user info
  useEffect(() => {
    setFormData({
      address: user?.address || '',
      phone: user?.phone || '',
      city: user?.city || ''
    });
  }, [user]);

  // ✅ Memoize handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    dispatch(updateProfile(formData))
      .unwrap()
      .then(() => {
        toast.success('Profile updated successfully');
        setShowForm(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err || 'Update failed');
      });
  }, [dispatch, formData]);

  // Password change handlers
  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [passwordErrors]);

  const validatePasswordForm = useCallback(() => {
    const errors = {};
    
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }, [passwordData]);

  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      await dispatch(changePassword(passwordData)).unwrap();
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error || 'Failed to change password');
    }
  }, [dispatch, passwordData, validatePasswordForm]);

  // ✅ Memoize expensive computations
  const isFormValid = useMemo(() => {
    return formData.address.trim() && formData.phone.trim() && formData.city.trim();
  }, [formData]);

  if (!user) {
    return (
      <div className="container  mx-auto p-4 space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-20 mx-auto p-4 max-w-4xl">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary h-32 relative">
          <div className="absolute -bottom-16 left-6">
            <Avatar className="w-32 h-32 border-4 border-background">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-3xl bg-background">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardHeader className="pt-20">
          <CardTitle className="text-3xl">{user?.name}</CardTitle>
        </CardHeader>

        <CardContent>
          {!showForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">

                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-lg font-medium">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="text-lg font-medium overflow-hidden">{user?.address?.slice(0, 56).toUpperCase() || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="text-lg font-medium">{user?.city?.slice(0, 20).toUpperCase() || 'Not provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Update Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Phone */}
                  <div className="relative w-full">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder=" "
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="peer w-full border border-gray-300 rounded-md px-3 pt-4 pb-2 text-sm bg-white
        focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                    />
                    <label
                      htmlFor="phone"
                      className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
        transition-all duration-200 ease-in-out pointer-events-none
        peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground 
        peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
                    >
                      Phone Number
                    </label>
                  </div>

                  {/* City */}
                  <div className="relative w-full">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder=" "
                      value={formData.city?.slice(0, 20) || ''}
                      onChange={handleChange}
                      required
                      className="peer w-full border border-gray-300 rounded-md px-3 pt-4 pb-2 text-sm bg-white
        focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                    />
                    <label
                      htmlFor="city"
                      className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
        transition-all duration-200 ease-in-out pointer-events-none
        peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground 
        peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
                    >
                      City
                    </label>
                  </div>

                  {/* Address */}
                  <div className="relative w-full">
                    <textarea
                      id="address"
                      name="address"
                      placeholder=" "
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="peer w-full border border-gray-300 rounded-md px-3 pt-4 pb-2 text-sm bg-white
        focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                    />
                    <label
                      htmlFor="address"
                      className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
        transition-all duration-200 ease-in-out pointer-events-none
        peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground 
        peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
                    >
                      Address
                    </label>
                  </div>
                </div>

              </div>
            </div>
          )}
        </CardContent>

        {/* Password Change Section - Admin Only */}
        {user?.role === 'admin' && (
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <Button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                variant="outline"
                size="sm"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </Button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Password */}
                  <div className="relative">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      placeholder=" "
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="peer w-full border border-gray-300 rounded-md px-3 pt-4 pb-2 text-sm bg-white
                      focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                    />
                    <label
                      htmlFor="currentPassword"
                      className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
                      transition-all duration-200 ease-in-out pointer-events-none
                      peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground 
                      peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
                    >
                      Current Password
                    </label>
                    {passwordErrors.currentPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder=" "
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="peer w-full border border-gray-300 rounded-md px-3 pt-4 pb-2 text-sm bg-white
                      focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                    />
                    <label
                      htmlFor="newPassword"
                      className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
                      transition-all duration-200 ease-in-out pointer-events-none
                      peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground 
                      peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
                    >
                      New Password
                    </label>
                    {passwordErrors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder=" "
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="peer w-full border border-gray-300 rounded-md px-3 pt-4 pb-2 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                  />
                  <label
                    htmlFor="confirmPassword"
                    className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
                    transition-all duration-200 ease-in-out pointer-events-none
                    peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground 
                    peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
                  >
                    Confirm New Password
                  </label>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-[#FED700] hover:bg-[#FED700]/90 text-black"
                  >
                    {status === 'loading' ? <ButtonLoader /> : 'Update Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

       <CardFooter className="flex justify-end items-center space-x-3 pt-4">
  {!showForm ? (
    <Button onClick={() => setShowForm(true)} variant="outline">
      Edit Profile
    </Button>
  ) : (
    <>
      <Button
        onClick={() => setShowForm(false)}
        variant="outline"
        disabled={status === 'loading'}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={status === 'loading'}
        className="flex items-center gap-2"
      >
        {status === 'loading' ? (
          <ButtonLoader />
        ) : (
          'Save Changes'
        )}
      </Button>
    </>
  )}
</CardFooter>

      </Card>
    </div>
  );
});

export default Profile;