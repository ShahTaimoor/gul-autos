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
import { Eye, EyeOff, User, Lock, Shield } from 'lucide-react';

const AdminProfile = () => {
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);

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
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleUsernameSubmit = () => {
    if (!usernameData.newUsername.trim()) {
      return;
    }

    if (usernameData.newUsername === user?.name) {
      return;
    }

    dispatch(updateUsername({ newUsername: usernameData.newUsername }))
      .unwrap()
      .then(() => {
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handlePasswordSubmit = () => {
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    if (newPassword.length < 6) {
      return;
    }

    if (oldPassword === newPassword) {
      return;
    }

    dispatch(changePassword(passwordData))
      .unwrap()
      .then(() => {
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 0:
        return { label: 'User', color: 'bg-blue-100 text-blue-800', icon: User };
      case 1:
        return { label: 'Admin', color: 'bg-green-100 text-green-800', icon: Shield };
      case 2:
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800', icon: Shield };
      default:
        return { label: 'User', color: 'bg-blue-100 text-blue-800', icon: User };
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
    <div className="container mt-20 mx-auto p-4 max-w-4xl">
      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <div className="bg-slate-900 h-32 relative">
          <div className="absolute -bottom-16 left-6">
            <Avatar className="w-32 h-32 border-4 border-white shadow-sm bg-white">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-3xl bg-slate-100 text-slate-600">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardHeader className="pt-20 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">{user?.name}</CardTitle>
              <p className="text-gray-500 mt-1">{user?.email}</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 w-fit ${roleInfo.color}`}>
              <roleInfo.icon className="h-4 w-4" />
              {roleInfo.label}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="username" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900"
              >
                <User className="h-4 w-4" />
                Change Username
              </TabsTrigger>
              <TabsTrigger 
                value="password" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900"
              >
                <Lock className="h-4 w-4" />
                Change Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="username" className="space-y-6 mt-8">
              <div className="space-y-6 max-w-md">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Update Username</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This will be your visible display name to other users.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="newUsername" className="text-sm font-medium text-gray-700 block">
                    New Username
                  </label>
                  <Input
                    id="newUsername"
                    name="newUsername"
                    type="text"
                    placeholder="Enter new username"
                    value={usernameData.newUsername}
                    onChange={handleUsernameChange}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="password" className="space-y-6 mt-8">
              <div className="space-y-6 max-w-md">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Ensure your account is secure by using a strong password.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Old Password */}
                  <div className="space-y-2">
                    <label htmlFor="oldPassword" className="text-sm font-medium text-gray-700 block">
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
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('old')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block">
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
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-end items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Button
            onClick={() => {
              if (activeTab === 'username') {
                handleUsernameSubmit();
              } else if (activeTab === 'password') {
                handlePasswordSubmit();
              }
            }}
            disabled={status === 'loading'}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {status === 'loading' ? (
              <OneLoader size="small" text="Saving..." showText={false} />
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
