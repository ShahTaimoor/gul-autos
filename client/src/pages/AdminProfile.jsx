import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { changePassword, updateUsername } from '@/redux/slices/auth/authSlice';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OneLoader from '@/components/ui/OneLoader';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Lock, Shield, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

const AdminProfile = () => {
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);
  const toast = useToast();

  // Username change state
  const [usernameData, setUsernameData] = useState({
    newUsername: user?.name || ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Error states
  const [errors, setErrors] = useState({
    username: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Show/hide password states
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState('username');

  // Sync username with user data
  useEffect(() => {
    setUsernameData({
      newUsername: user?.name || ''
    });
  }, [user]);

  const handleUsernameChange = (e) => {
    const { value } = e.target;
    setUsernameData({ newUsername: value });
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateUsername = () => {
    if (!usernameData.newUsername.trim()) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return false;
    }
    if (usernameData.newUsername === user?.name) {
      setErrors(prev => ({ ...prev, username: 'Please enter a different username' }));
      return false;
    }
    if (usernameData.newUsername.length < 3) {
      setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    const newErrors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    let isValid = true;

    if (!passwordData.oldPassword) {
      newErrors.oldPassword = 'Current password is required';
      isValid = false;
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
      isValid = false;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleUsernameSubmit = () => {
    if (!validateUsername()) {
      return;
    }

    dispatch(updateUsername({ newUsername: usernameData.newUsername }))
      .unwrap()
      .then(() => {
        toast.success('Username updated successfully!');
        setErrors(prev => ({ ...prev, username: '' }));
      })
      .catch((err) => {
        const errorMessage = err?.message || err || 'Failed to update username';
        toast.error(errorMessage);
        setErrors(prev => ({ ...prev, username: errorMessage }));
      });
  };

  const handlePasswordSubmit = () => {
    if (!validatePassword()) {
      return;
    }

    dispatch(changePassword(passwordData))
      .unwrap()
      .then(() => {
        toast.success('Password changed successfully!');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      })
      .catch((err) => {
        const errorMessage = err?.message || err || 'Failed to change password';
        toast.error(errorMessage);
        if (errorMessage.toLowerCase().includes('current') || errorMessage.toLowerCase().includes('old')) {
          setErrors(prev => ({ ...prev, oldPassword: errorMessage }));
        } else {
          setErrors(prev => ({ ...prev, newPassword: errorMessage }));
        }
      });
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 0:
        return { 
          label: 'User', 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 
          icon: User 
        };
      case 1:
        return { 
          label: 'Admin', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 
          icon: Shield 
        };
      case 2:
        return { 
          label: 'Super Admin', 
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', 
          icon: Shield 
        };
      default:
        return { 
          label: 'User', 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 
          icon: User 
        };
    }
  };

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

  const roleInfo = getRoleInfo(user.role);

  return (
    <div className="container mt-20 mx-auto p-4 max-w-5xl">
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 h-40 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
          <div className="absolute -bottom-20 left-8">
            <Avatar className="w-40 h-40 border-4 border-white dark:border-gray-800 shadow-xl bg-white dark:bg-gray-900">
              <AvatarImage src={user?.avatar} className="object-cover" />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardHeader className="pt-24 pb-6 px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {user?.name}
                </CardTitle>
                {usernameData.newUsername === user?.name && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                <p className="text-sm">{user?.email}</p>
              </div>
            </div>
            <div className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 w-fit shadow-sm ${roleInfo.color}`}>
              <roleInfo.icon className="h-4 w-4" />
              {roleInfo.label}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl h-12">
              <TabsTrigger 
                value="username" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-100 rounded-lg transition-all"
              >
                <User className="h-4 w-4" />
                <span className="font-medium">Change Username</span>
              </TabsTrigger>
              <TabsTrigger 
                value="password" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-100 rounded-lg transition-all"
              >
                <Lock className="h-4 w-4" />
                <span className="font-medium">Change Password</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="username" className="space-y-6 mt-8">
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Update Username
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This will be your visible display name. Choose a username that represents you professionally.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="newUsername" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                    New Username
                  </label>
                  <div className="relative">
                    <Input
                      id="newUsername"
                      name="newUsername"
                      type="text"
                      placeholder="Enter new username"
                      value={usernameData.newUsername}
                      onChange={handleUsernameChange}
                      required
                      className={`h-12 border-2 transition-all ${
                        errors.username 
                          ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20'
                      }`}
                    />
                    {errors.username && (
                      <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.username}</span>
                      </div>
                    )}
                  </div>
                  {!errors.username && usernameData.newUsername && usernameData.newUsername !== user?.name && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Username is available
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="password" className="space-y-6 mt-8">
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ensure your account is secure by using a strong, unique password. Use a combination of letters, numbers, and special characters.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Old Password */}
                  <div className="space-y-2">
                    <label htmlFor="oldPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        name="oldPassword"
                        type={showPasswords.old ? "text" : "password"}
                        placeholder="Enter current password"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`h-12 border-2 transition-all pr-12 ${
                          errors.oldPassword 
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('old')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPasswords.old ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.oldPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.oldPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        placeholder="Enter new password (min. 6 characters)"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`h-12 border-2 transition-all pr-12 ${
                          errors.newPassword 
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.newPassword}</span>
                      </p>
                    )}
                    {!errors.newPassword && passwordData.newPassword && passwordData.newPassword.length >= 6 && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Password strength: Good
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`h-12 border-2 transition-all pr-12 ${
                          errors.confirmPassword 
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                            : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword
                            ? 'border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500/20'
                            : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                    {!errors.confirmPassword && passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-end items-center px-8 py-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={() => {
              if (activeTab === 'username') {
                handleUsernameSubmit();
              } else if (activeTab === 'password') {
                handlePasswordSubmit();
              }
            }}
            disabled={status === 'loading'}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all px-6 h-11 font-semibold"
          >
            {status === 'loading' ? (
              <>
                <OneLoader size="small" text="Saving..." showText={false} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminProfile;
