// nodeapp/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  deleteUser,
  getUserStats,
  updateUser,
} = require("../controllers/userController");
const User = require("../models/User");

// ------------------ Admin Routes ------------------

// Get all users (Admin only)
router.get("/", verifyToken, getAllUsers);

// Get user stats (Admin only)
router.get("/stats", verifyToken, getUserStats);

// ✅ Get current user profile (for Profile.jsx)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user by ID (Admin + Self)
router.put("/:id", verifyToken, updateUser);

// Delete user by ID (Admin only)
router.delete("/:id", verifyToken, deleteUser);

module.exports = router;
