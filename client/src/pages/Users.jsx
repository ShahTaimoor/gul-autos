import axios from 'axios'
import React, { useEffect, useState } from 'react'

const Users = () => {
  const [users, setUsers] = useState([])

  const getAllUsers = () => {
    axios
      .get(import.meta.env.VITE_API_URL + '/all-users', {
        withCredentials: true,
        headers: { "Content-Type": "application/json" }
      })
      .then((response) => {
        console.log('API Response:', response.data);
        setUsers(Array.isArray(response.data) ? response.data : response.data?.users || [])
      })
      .catch((error) => {
        console.error('Error fetching users:', error)
      })
  }

  useEffect(() => {
    getAllUsers()
  }, [])

  return (
    <div className="overflow-x-auto p-4">
      <h1 className="text-xl font-semibold mb-4 text-center">User List</h1>
      <table className="min-w-full bg-white border rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
            <th className="py-3 px-4 border-b">No</th>
            <th className="py-3 px-4 border-b"> Shop Name</th>
          
            <th className="py-3 px-4 border-b">Address</th>
            <th className="py-3 px-4 border-b">City</th>
            <th className="py-3 px-4 border-b">Mobile</th>
            <th className="py-3 px-4 border-b">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr
              key={user._id || index}
              className="hover:bg-gray-50 text-sm text-gray-700"
            >
              <td className="py-2 px-4 border-b">{index + 1}</td>
              <td className="py-2 px-4 border-b capitalize">{user.name}</td>
              <td className="py-2 px-4 border-b">
                {user.address ? `${user.address.substring(0, 100)}${user.address.length > 100 ? '...' : ''}` : 'N/A'}
              </td>
              <td className="py-2 px-4 border-b">{user.city}</td>
              <td className="py-2 px-4 border-b">{user.phone}</td>
              <td className="py-2 px-4 border-b">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Users