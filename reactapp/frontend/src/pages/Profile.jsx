import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import "../styles/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    role: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  // ✅ Load user data from backend
  const loadUserProfile = async () => {
    try {
      const res = await axiosInstance.get("/users/profile");
      setUser(res.data);
      setFormData({
        username: res.data.username,
        role: res.data.role,
        password: "",
      });
    } catch (err) {
      console.error("Error loading profile:", err);
      setMessage("Failed to load profile");
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axiosInstance.put(`/users/${user._id}`, formData);
      setMessage(res.data.message || "Profile updated successfully");
      loadUserProfile(); // refresh
    } catch (err) {
      console.error(err);
      setMessage("Update failed");
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <div className="profile-avatar-section">
        <div className="profile-avatar-circle">
          {user.username?.slice(0, 2).toUpperCase() || "US"}
        </div>
        <span>{user.role}</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <input type="text" name="role" value={formData.role} disabled />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter new password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn" style={{ width: "100%", marginTop: "10px" }}>
          Update Profile
        </button>
      </form>

      {message && <p className="profile-message">{message}</p>}
    </div>
  );
};

export default Profile;
