const express = require("express");
const router = express.Router();

const {
  addQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getReports,
  getAllReports,
  deleteReport,
  getUserStats,
  filterQuizzes,
  searchQuizzes,
} = require("../controllers/quizController");

const { verifyToken } = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");

/**
 * @swagger
 * tags:
 *   - name: Quizzes
 *     description: Quiz management (Admin & Teacher)
 *   - name: Submissions
 *     description: Quiz submission and reports (Student, Teacher, Admin)
 */

// -------------------------------------------------------
// ⚡ FIXED ROUTE ORDER — all static routes come first
// -------------------------------------------------------

// ------------------ FILTER & SEARCH ------------------

/**
 * @swagger
 * /api/quizzes/filter/query:
 *   get:
 *     summary: Filter quizzes by query parameters
 *     tags: [Quizzes]
 */
router.get(
  "/filter/query",
  verifyToken,
  authorizeRole(["Admin", "Teacher", "Student"]),
  filterQuizzes
);

/**
 * @swagger
 * /api/quizzes/search/query:
 *   get:
 *     summary: Search quizzes by title or subject
 *     tags: [Quizzes]
 */
router.get(
  "/search/query",
  verifyToken,
  authorizeRole(["Admin", "Teacher", "Student"]),
  searchQuizzes
);

// ------------------ USER STATS ------------------

/**
 * @swagger
 * /api/quizzes/stats/{userId}:
 *   get:
 *     summary: Get user quiz statistics
 *     tags: [Submissions]
 */
router.get(
  "/stats/:userId",
  verifyToken,
  authorizeRole(["Student"]),
  getUserStats
);

// ------------------ REPORTS ------------------

/**
 * @swagger
 * /api/quizzes/reports:
 *   get:
 *     summary: Get all quiz reports
 *     tags: [Submissions]
 */
router.get(
  "/reports",
  verifyToken,
  authorizeRole(["Admin", "Teacher"]),
  getAllReports
);

/**
 * @swagger
 * /api/quizzes/reports/{studentName}:
 *   get:
 *     summary: Get quiz reports for a specific student
 *     tags: [Submissions]
 */
router.get(
  "/reports/:studentName",
  verifyToken,
  authorizeRole(["Admin", "Teacher", "Student"]),
  getReports
);

/**
 * @swagger
 * /api/quizzes/reports/{id}:
 *   delete:
 *     summary: Delete a specific quiz report
 *     tags: [Submissions]
 */
router.delete(
  "/reports/:id",
  verifyToken,
  authorizeRole(["Admin", "Teacher"]),
  deleteReport
);

// ------------------ QUIZ CRUD ------------------

/**
 * @swagger
 * /api/quizzes:
 *   get:
 *     summary: Get all quizzes
 *     tags: [Quizzes]
 */
router.get(
  "/",
  verifyToken,
  authorizeRole(["Admin", "Teacher", "Student"]),
  getQuizzes
);

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Create a new quiz
 *     tags: [Quizzes]
 */
router.post(
  "/",
  verifyToken,
  authorizeRole(["Admin", "Teacher"]),
  addQuiz
);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   get:
 *     summary: Get a quiz by ID
 *     tags: [Quizzes]
 */
router.get(
  "/:id",
  verifyToken,
  authorizeRole(["Admin", "Teacher", "Student"]),
  getQuizById
);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   put:
 *     summary: Update a quiz
 *     tags: [Quizzes]
 */
router.put(
  "/:id",
  verifyToken,
  authorizeRole(["Admin", "Teacher"]),
  updateQuiz
);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   delete:
 *     summary: Delete a quiz
 *     tags: [Quizzes]
 */
router.delete(
  "/:id",
  verifyToken,
  authorizeRole(["Admin", "Teacher"]),
  deleteQuiz
);

// ------------------ QUIZ SUBMISSION ------------------

/**
 * @swagger
 * /api/quizzes/{id}/submit:
 *   post:
 *     summary: Submit quiz answers
 *     tags: [Submissions]
 */
router.post(
  "/:id/submit",
  verifyToken,
  authorizeRole(["Student", "Teacher", "Admin"]),
  submitQuiz
);

module.exports = router;
