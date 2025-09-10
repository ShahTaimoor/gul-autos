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
import { Badge } from '@/components/ui/badge';
import { Shield, User, Lock, Settings, Mail, Phone, MapPin, Home } from 'lucide-react';

const AdminProfile = React.memo(() => {
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);

  // Local state for form inputs
  const [formData, setFormData] = useState({
    name: user?.name || '',
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
      name: user?.name || '',
      address: user?.address || '',
      phone: user?.phone || '',
      city: user?.city || ''
    });
  }, [user]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error(err || 'Update failed');
    }
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
    return formData.name.trim() && formData.address.trim() && formData.phone.trim() && formData.city.trim();
  }, [formData]);

  if (!user) {
    return (
      <div className="container mx-auto p-4 space-y-6 max-w-4xl">
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
    <div className="container mt-20 mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-[#FED700]" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
          <Badge className="bg-[#FED700] text-black font-semibold">
            <Shield className="w-3 h-3 mr-1" />
            Administrator
          </Badge>
        </div>
        <p className="text-gray-600">Manage your admin account settings and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-r from-[#FED700] to-[#FED700]/80 h-32 relative">
            <div className="absolute -bottom-16 left-6">
              <Avatar className="w-32 h-32 border-4 border-background">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-3xl bg-background">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <CardContent className="pt-20 pb-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {user?.name || 'Admin User'}
                </h2>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.email || 'admin@example.com'}
                </p>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-[#FED700]" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#FED700]" />
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{user?.city || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {user?.address && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Home className="w-5 h-5 text-[#FED700] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{user.address}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end items-center space-x-3 pt-4">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
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
                  disabled={status === 'loading' || !isFormValid}
                  className="flex items-center gap-2 bg-[#FED700] hover:bg-[#FED700]/90 text-black"
                >
                  {status === 'loading' ? (
                    <ButtonLoader />
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Password Change Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#FED700]" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Change your password to keep your account secure
              </p>
              <Button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                variant="outline"
                className="w-full"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>

          {/* Admin Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FED700]" />
                Admin Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Account Type</span>
                <Badge className="bg-[#FED700] text-black">Administrator</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Access Level</span>
                <span className="text-sm font-medium">Full Access</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm font-medium">Recently</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Edit Form */}
      {showForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#FED700]" />
              Edit Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder=" "
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="peer w-full border border-gray-300 rounded-md px-3 pt-4 pb-2 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
                    transition-all duration-200 ease-in-out pointer-events-none
                    peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground 
                    peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700]"
                  >
                    Full Name
                  </label>
                </div>

                {/* Phone */}
                <div className="relative">
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
                <div className="relative">
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder=" "
                    value={formData.city}
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
              </div>

              {/* Address */}
              <div className="relative">
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
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Change Form */}
      {showPasswordForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#FED700]" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default AdminProfile;
