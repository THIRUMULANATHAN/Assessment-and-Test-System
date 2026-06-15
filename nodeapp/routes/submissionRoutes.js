const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");
const { submitQuiz } = require("../controllers/quizController");

// Student submits a quiz
router.post("/:id/submit", verifyToken, authorizeRole(["Student"]), submitQuiz);

module.exports = router;
