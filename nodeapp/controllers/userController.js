// nodeapp/controllers/userController.js
const User = require("../models/User");
const { Result } = require("../models/Quiz");
const bcrypt = require("bcryptjs"); 

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const { username, role, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (role) user.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get user stats
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await Result.find({ user: userId });

    const attempted = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalMarks = results.reduce((sum, r) => sum + r.totalMarks, 0);

    const avgScore = attempted > 0 ? (totalScore / attempted).toFixed(1) : 0;
    const accuracy =
      totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(1) : 0;

    res.status(200).json({
      attempted,
      avgScore,
      accuracy,
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ error: "Server Error" });
  }
};
