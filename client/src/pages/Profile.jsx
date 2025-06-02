import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateProfile } from '@/redux/slices/auth/authSlice';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const Profile = () => {
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

  // Sync local state with updated Redux user info
  useEffect(() => {
    setFormData({
      address: user?.address || '',
      phone: user?.phone || '',
      city: user?.city || ''
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
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
  };

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
                  <p className="text-lg font-medium overflow-hidden">{user?.address.slice(0,56).toUpperCase() || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="text-lg font-medium">{user?.city.slice(0,20).toUpperCase() || 'Not provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Update Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+92 0003333220"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-muted-foreground mb-1">
                      City
                    </label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="New York"
                      value={formData.city.slice(0,20)}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-muted-foreground mb-1">
                    Address
                  </label>
                  <Textarea
                    id="address"
                    name="address"
                    type="text"
                    placeholder="123 Main St, Apt 4B"
                    value={formData.address}
                    onChange={handleChange}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-4">
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
                className={`mt-2`}
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;