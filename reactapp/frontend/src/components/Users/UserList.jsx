// src/components/User/UserList.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "../../styles/Users.css";

const UserList = () => {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const res = await axiosInstance.get("/users");
      setUsers(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error loading users");
    }
  };

  const deleteUser = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="user-container">
      <h2>User Management</h2>

      {users.length === 0 ? (
        <p className="no-users">No users found.</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>User ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>
                  <span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role}</span>
                </td>
                <td>
                  <code>{u._id}</code>
                </td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => deleteUser(u._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserList;
