import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { updateUserRole } from '../redux/slices/auth/authSlice';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import OneLoader from '../components/ui/OneLoader';
import { Shield, User, Crown } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState({});

  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);

  const getAllUsers = () => {
    setLoading(true);
    fetch(import.meta.env.VITE_API_URL + '/all-users', {
      credentials: 'include',
      headers: { "Content-Type": "application/json" }
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('API Response:', data);
        setUsers(Array.isArray(data) ? data : data?.users || []);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
    
    try {
      const result = await dispatch(updateUserRole({ userId, role: parseInt(newRole) })).unwrap();
      
      if (result.success) {
        toast.success('User role updated successfully');
        // Update the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, role: parseInt(newRole) }
              : user
          )
        );
      } else {
        toast.error(result.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Role change error:', error);
      toast.error(error || 'Failed to update user role');
    } finally {
      setUpdatingRoles(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 0:
        return { label: 'User', color: 'bg-blue-100 text-blue-800', icon: User };
      case 1:
        return { label: 'Admin', color: 'bg-green-100 text-green-800', icon: Shield };
      case 2:
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800', icon: Crown };
      default:
        return { label: 'User', color: 'bg-blue-100 text-blue-800', icon: User };
    }
  };

  const getRoleIcon = (role) => {
    const { icon: Icon } = getRoleLabel(role);
    return <Icon className="h-4 w-4" />;
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <OneLoader size="large" text="Loading Users..." />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <Button onClick={getAllUsers} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      
      <div className="bg-white border rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm font-medium text-gray-700">
              <th className="py-3 px-4 border-b">No</th>
              <th className="py-3 px-4 border-b">Shop Name</th>
              <th className="py-3 px-4 border-b">Address</th>
              <th className="py-3 px-4 border-b">City</th>
              <th className="py-3 px-4 border-b">Mobile</th>
              <th className="py-3 px-4 border-b">Current Role</th>
              <th className="py-3 px-4 border-b">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const { label: roleLabel, color: roleColor } = getRoleLabel(user.role);
              const isUpdating = updatingRoles[user._id];
              
              return (
                <tr
                  key={user._id || index}
                  className="hover:bg-gray-50 text-sm text-gray-700 border-b"
                >
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium capitalize">{user.name}</td>
                  <td className="py-3 px-4">
                    {user.address ? (
                      <span title={user.address}>
                        {user.address.length > 50 
                          ? `${user.address.substring(0, 50)}...` 
                          : user.address
                        }
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {user.city || <span className="text-gray-400">N/A</span>}
                  </td>
                  <td className="py-3 px-4">
                    {user.phone || <span className="text-gray-400">N/A</span>}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={`${roleColor} flex items-center gap-1 w-fit`}>
                      {getRoleIcon(user.role)}
                      {roleLabel}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {currentUser?.role === 2 ? (
                        // Check if this is the super admin's own row
                        currentUser?._id === user._id ? (
                          <span className="text-sm text-gray-500 italic">
                            Cannot change own role
                          </span>
                        ) : (
                          <Select
                            value={user.role.toString()}
                            onValueChange={(value) => handleRoleChange(user._id, value)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  User
                                </div>
                              </SelectItem>
                              <SelectItem value="1">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="2">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4" />
                                  Super Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )
                      ) : (
                        <span className="text-sm text-gray-500">
                          Only Super Admin can change roles
                        </span>
                      )}
                      {isUpdating && (
                        <OneLoader size="small" text="Updating..." showText={false} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;