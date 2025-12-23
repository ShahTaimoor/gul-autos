import React from 'react';
import { User, Shield, Crown } from 'lucide-react';

/**
 * Get role label and styling
 * @param {number} role - User role (0: User, 1: Admin, 2: Super Admin)
 * @returns {Object} Role label, color, and icon
 */
export const getRoleLabel = (role) => {
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

/**
 * Get role icon component
 * @param {number} role - User role
 * @returns {JSX.Element} Icon component
 */
export const getRoleIcon = (role) => {
  const { icon: Icon } = getRoleLabel(role);
  return <Icon className="h-4 w-4" />;
};

/**
 * Filter users by search term and role
 * @param {Array} users - Array of users
 * @param {string} searchTerm - Search term
 * @param {string} roleFilter - Role filter ('all' or role number as string)
 * @returns {Array} Filtered users
 */
export const filterUsers = (users, searchTerm, roleFilter) => {
  return users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesRole = roleFilter === 'all' || user.role.toString() === roleFilter;

    return matchesSearch && matchesRole;
  });
};

/**
 * Calculate user statistics
 * @param {Array} users - Array of users
 * @returns {Object} User statistics
 */
export const getUserStats = (users) => {
  return {
    total: users.length,
    users: users.filter((u) => u.role === 0).length,
    admins: users.filter((u) => u.role === 1).length,
    superAdmins: users.filter((u) => u.role === 2).length,
  };
};

/**
 * Generate page numbers for pagination
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisiblePages - Maximum visible page numbers
 * @returns {Array} Array of page numbers (may include '...' for ellipsis)
 */
export const getPageNumbers = (currentPage, totalPages, maxVisiblePages = 5) => {
  const pages = [];

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
  }

  return pages;
};

