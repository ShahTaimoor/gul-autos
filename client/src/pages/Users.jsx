import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import OneLoader from '../components/ui/OneLoader';
import { useUsers } from '@/hooks/use-users';
import {
  getRoleLabel,
  getRoleIcon,
  filterUsers,
  getUserStats,
  getPageNumbers,
} from '@/utils/userHelpers';
import {
  RefreshCw,
  Users as UsersIcon,
  User,
  Shield,
  Crown,
  MapPin,
  Phone,
  Building2,
  Search,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Users = () => {
  const { users, loading, updatingRoles, fetchUsers, handleRoleChange } = useUsers();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter users based on search term and role filter
  const filteredUsers = useMemo(
    () => filterUsers(users, searchTerm, roleFilter),
    [users, searchTerm, roleFilter]
  );

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Get user statistics
  const userStats = useMemo(() => getUserStats(users), [users]);

  // Pagination calculations
  const totalPages = useMemo(
    () => Math.ceil(filteredUsers.length / itemsPerPage),
    [filteredUsers.length, itemsPerPage]
  );
  
  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );
  
  const endIndex = useMemo(
    () => startIndex + itemsPerPage,
    [startIndex, itemsPerPage]
  );
  
  const paginatedUsers = useMemo(
    () => filteredUsers.slice(startIndex, endIndex),
    [filteredUsers, startIndex, endIndex]
  );
  
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <OneLoader size="large" text="Loading Users..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                <p className="text-gray-500">Manage user roles and permissions</p>
              </div>
            </div>
            <Button 
              onClick={fetchUsers} 
              variant="outline" 
              size="sm"
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{userStats.total}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-md">
                <UsersIcon className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Regular Users</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{userStats.users}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-md">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{userStats.admins}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-md">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Super Admins</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{userStats.superAdmins}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-md">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, address, city, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48 border-gray-300">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="0">Users</SelectItem>
                  <SelectItem value="1">Admins</SelectItem>
                  <SelectItem value="2">Super Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedUsers.map((user, index) => {
                  const { label: roleLabel, color: roleColor } = getRoleLabel(user.role);
                  const isUpdating = updatingRoles[user._id];
                  const isCurrentUser = currentUser?._id === user._id;
                  
                  return (
                    <tr
                      key={user._id || index}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 capitalize">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          {user.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600" title={user.address}>
                                {user.address.length > 40 
                                  ? `${user.address.substring(0, 40)}...` 
                                  : user.address
                                }
                              </span>
                            </div>
                          )}
                          {user.city && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">{user.city}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`${roleColor} flex items-center gap-1.5 w-fit px-2.5 py-1 font-medium border-0`}>
                          {getRoleIcon(user.role)}
                          {roleLabel}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {currentUser?.role === 2 ? (
                            isCurrentUser ? (
                              <span className="text-xs text-amber-600 flex items-center gap-1 font-medium bg-amber-50 px-2 py-1 rounded">
                                <AlertCircle className="h-3 w-3" />
                                Cannot change own role
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={user.role.toString()}
                                  onValueChange={(value) => handleRoleChange(user._id, value)}
                                  disabled={isUpdating}
                                >
                                  <SelectTrigger className="w-36 h-9 text-sm border-gray-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">
                                      <div className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5" />
                                        User
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="1">
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-3.5 w-3.5" />
                                        Admin
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="2">
                                      <div className="flex items-center gap-2">
                                        <Crown className="h-3.5 w-3.5" />
                                        Super Admin
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {isUpdating && (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1 italic">
                              <Shield className="h-3 w-3" />
                              View Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[70px] h-8 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>rows</span>
              </div>

              {/* Page info */}
              <div className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredUsers.length)}</span> of <span className="font-semibold text-gray-900">{filteredUsers.length}</span> users
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...'}
                      className={`h-8 min-w-[2rem] px-2 text-sm font-medium rounded-md transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white shadow-sm'
                          : page === '...'
                          ? 'text-gray-400 cursor-default bg-transparent'
                          : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 && users.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We couldn't find any users matching your search "{searchTerm}" or filter criteria.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {setSearchTerm(''); setRoleFilter('all');}}
              className="mt-4 border-gray-300"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {users.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users registered yet</h3>
            <p className="text-gray-500">There are currently no users in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;