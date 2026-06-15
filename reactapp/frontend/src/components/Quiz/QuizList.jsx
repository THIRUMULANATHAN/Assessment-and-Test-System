// src/components/Quiz/QuizList.jsx
import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../../api/axiosInstance";
import { AuthContext } from "../../context/AuthContext";
import {
  FaPlus,
  FaTrash,
  FaList,
  FaPlusCircle,
  FaBook,
  FaClock,
  FaGraduationCap,
  FaCheck,
  FaFolder,
  FaUserShield
} from "react-icons/fa";
import "../../styles/TeacherQuiz.css";

const QuizList = () => {
  const { user } = useContext(AuthContext);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState("list"); // "list" or "create"

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    subject: "",
    imgUrl: "",
    category: "Academic",
    difficulty: "Intermediate",
    timeLimit: 10,
    isProtected: false,
    questions: [
      {
        questionText: "",
        options: { op1: "", op2: "", op3: "", op4: "" },
        correctAnswer: "",
        explanation: "",
      },
    ],
  });

  // Load all quizzes
  const loadQuizzes = async () => {
    try {
      const res = await axiosInstance.get("/quizzes");
      setQuizzes(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching quizzes");
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const resetForm = () => {
    setNewQuiz({
      title: "",
      subject: "",
      imgUrl: "",
      category: "Academic",
      difficulty: "Intermediate",
      timeLimit: 10,
      isProtected: false,
      questions: [
        {
          questionText: "",
          options: { op1: "", op2: "", op3: "", op4: "" },
          correctAnswer: "",
          explanation: "",
        },
      ],
    });
  };

  // Create new quiz
  const createQuiz = async () => {
    // Basic validations
    if (!newQuiz.title.trim()) return alert("Quiz Title is required");
    if (!newQuiz.subject.trim()) return alert("Subject is required");
    if (!newQuiz.imgUrl.trim()) return alert("Cover Image URL is required");

    for (let i = 0; i < newQuiz.questions.length; i++) {
      const q = newQuiz.questions[i];
      if (!q.questionText.trim()) return alert(`Question #${i + 1} text is empty`);
      if (!q.options.op1.trim() || !q.options.op2.trim() || !q.options.op3.trim() || !q.options.op4.trim()) {
        return alert(`Question #${i + 1} must have all 4 options filled`);
      }
      if (!q.correctAnswer) return alert(`Question #${i + 1} has no correct answer selected`);
    }

    try {
      await axiosInstance.post("/quizzes", { ...newQuiz, createdBy: user.id });
      alert("Quiz created successfully!");
      resetForm();
      setActiveTab("list");
      loadQuizzes();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating quiz");
    }
  };

  // Delete quiz
  const deleteQuiz = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await axiosInstance.delete(`/quizzes/${id}`);
      loadQuizzes();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting quiz");
    }
  };

  // Update question input safely
  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...newQuiz.questions];
    if (["op1", "op2", "op3", "op4"].includes(field)) {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        options: {
          ...updatedQuestions[index].options,
          [field]: value,
        },
      };
    } else {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value,
      };
    }
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [
        ...newQuiz.questions,
        {
          questionText: "",
          options: { op1: "", op2: "", op3: "", op4: "" },
          correctAnswer: "",
          explanation: "",
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = newQuiz.questions.filter((_, i) => i !== index);
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  return (
    <div className="teacher-workspace-container">
      {/* Workspace Header */}
      <header className="teacher-header">
        <div className="teacher-header-info">
          <h2>Quiz Workspace</h2>
          <p>Publish custom assessments or manage and delete existing quizzes in your library.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="teacher-tabs">
          <button
            className={`teacher-tab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <FaList /> Quiz Library
          </button>
          <button
            className={`teacher-tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("create");
              resetForm();
            }}
          >
            <FaPlusCircle /> Create Quiz
          </button>
        </div>
      </header>

      {/* Tabs Content */}
      {activeTab === "list" ? (
        /* QUIZ LIBRARY GRID */
        quizzes.length === 0 ? (
          <div className="reports-empty-state">
            <FaFolder className="empty-state-icon" style={{ fontSize: "3rem" }} />
            <h3>No quizzes published yet</h3>
            <p>Select the "Create Quiz" tab above to build your first assessment.</p>
          </div>
        ) : (
          <div className="teacher-quiz-grid">
            {quizzes.map((quiz) => (
              <article className="teacher-quiz-card" key={quiz._id}>
                <div className="t-quiz-image-wrapper">
                  <img
                    src={quiz.imgUrl}
                    alt={quiz.title}
                    className="t-quiz-image"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop";
                    }}
                  />
                  <span className="t-quiz-badge-overlay">{quiz.category || "Academic"}</span>
                  {quiz.isProtected && (
                    <span className="t-quiz-proctored-badge">
                      <FaUserShield /> Proctored
                    </span>
                  )}
                </div>
                <div className="t-quiz-body">
                  <span className="t-quiz-subject">{quiz.subject}</span>
                  <h3 className="t-quiz-title">{quiz.title}</h3>
                  
                  <div className="t-quiz-details-row">
                    <span className="t-quiz-detail-badge">
                      <FaGraduationCap /> {quiz.difficulty || "Intermediate"}
                    </span>
                    <span className="t-quiz-detail-badge">
                      <FaClock /> {quiz.timeLimit || 10} mins
                    </span>
                    <span className="t-quiz-detail-badge">
                      <FaList /> {quiz.questions?.length || 0} Qs
                    </span>
                  </div>
                </div>
                <div className="t-quiz-actions">
                  <button
                    className="t-btn-icon"
                    onClick={() => deleteQuiz(quiz._id)}
                    title="Delete Quiz"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        /* QUIZ CREATION WORKSPACE */
        <div className="t-creator-container">
          <form onSubmit={(e) => e.preventDefault()}>
            
            {/* General Info Card */}
            <div className="t-creator-section-card" style={{ marginBottom: "25px" }}>
              <h3 className="t-creator-section-title">
                <FaBook /> Basic Quiz Information
              </h3>
              
              <div className="form-row">
                <div className="form-group col-2">
                  <label>Quiz Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Quantum Mechanics Fundamentals"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  />
                </div>
                <div className="form-group col">
                  <label>Subject</label>
                  <input
                    type="text"
                    placeholder="e.g., Physics"
                    value={newQuiz.subject}
                    onChange={(e) => setNewQuiz({ ...newQuiz, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col">
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Academic, Science, General"
                    value={newQuiz.category}
                    onChange={(e) => setNewQuiz({ ...newQuiz, category: e.target.value })}
                  />
                </div>
                <div className="form-group col">
                  <label>Difficulty Level</label>
                  <select
                    value={newQuiz.difficulty}
                    onChange={(e) => setNewQuiz({ ...newQuiz, difficulty: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group col">
                  <label>Time Limit (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={newQuiz.timeLimit}
                    onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cover Image URL</label>
                <input
                  type="text"
                  placeholder="Paste cover image link (or use local path like /quiz-images/physics.svg)"
                  value={newQuiz.imgUrl}
                  onChange={(e) => setNewQuiz({ ...newQuiz, imgUrl: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: "15px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", color: "#475569" }}>
                  <input
                    type="checkbox"
                    checked={newQuiz.isProtected}
                    onChange={(e) => setNewQuiz({ ...newQuiz, isProtected: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#6366f1", cursor: "pointer" }}
                  />
                  <span>Enable Proctoring (Protected Test)</span>
                </label>
              </div>
            </div>

            {/* Questions Card */}
            <div className="t-creator-section-card">
              <h3 className="t-creator-section-title">
                <FaList /> Questions Builder
              </h3>

              {newQuiz.questions.map((q, idx) => (
                <div key={idx} className="t-question-builder-card">
                  <div className="t-question-header">
                    <span className="t-question-title">
                      <FaPlusCircle style={{ color: "#6366f1" }} /> Question #{idx + 1}
                    </span>
                    {newQuiz.questions.length > 1 && (
                      <button
                        type="button"
                        className="btn danger"
                        style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                        onClick={() => removeQuestion(idx)}
                      >
                        <FaTrash /> Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Question Text</label>
                    <input
                      type="text"
                      placeholder="Enter the question text..."
                      value={q.questionText}
                      onChange={(e) =>
                        updateQuestion(idx, "questionText", e.target.value)
                      }
                    />
                  </div>

                  {/* 2x2 Options Grid */}
                  <div className="t-options-grid">
                    <div className="form-group">
                      <label>Option 1</label>
                      <input
                        type="text"
                        placeholder="Answer Option 1"
                        value={q.options.op1}
                        onChange={(e) => updateQuestion(idx, "op1", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Option 2</label>
                      <input
                        type="text"
                        placeholder="Answer Option 2"
                        value={q.options.op2}
                        onChange={(e) => updateQuestion(idx, "op2", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Option 3</label>
                      <input
                        type="text"
                        placeholder="Answer Option 3"
                        value={q.options.op3}
                        onChange={(e) => updateQuestion(idx, "op3", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Option 4</label>
                      <input
                        type="text"
                        placeholder="Answer Option 4"
                        value={q.options.op4}
                        onChange={(e) => updateQuestion(idx, "op4", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group col">
                      <label>Correct Answer Key</label>
                      <select
                        value={
                          q.correctAnswer === q.options.op1 && q.options.op1 ? "op1" :
                          q.correctAnswer === q.options.op2 && q.options.op2 ? "op2" :
                          q.correctAnswer === q.options.op3 && q.options.op3 ? "op3" :
                          q.correctAnswer === q.options.op4 && q.options.op4 ? "op4" : ""
                        }
                        onChange={(e) => {
                          const opKey = e.target.value;
                          const correctVal = q.options[opKey] || "";
                          updateQuestion(idx, "correctAnswer", correctVal);
                        }}
                      >
                        <option value="">Select correct option...</option>
                        {q.options.op1 && <option value="op1">Option 1 ({q.options.op1})</option>}
                        {q.options.op2 && <option value="op2">Option 2 ({q.options.op2})</option>}
                        {q.options.op3 && <option value="op3">Option 3 ({q.options.op3})</option>}
                        {q.options.op4 && <option value="op4">Option 4 ({q.options.op4})</option>}
                      </select>
                    </div>

                    <div className="form-group col-2">
                      <label>Explanation (Optional)</label>
                      <input
                        type="text"
                        placeholder="Explain why this answer is correct..."
                        value={q.explanation}
                        onChange={(e) =>
                          updateQuestion(idx, "explanation", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Creator Actions Bottom */}
              <div className="t-creator-actions">
                <div className="t-actions-left">
                  <button type="button" className="btn secondary" onClick={addQuestion}>
                    <FaPlus /> Add Question
                  </button>
                </div>
                <div className="t-actions-right">
                  <button type="button" className="btn ghost" onClick={() => setActiveTab("list")}>
                    Cancel
                  </button>
                  <button type="button" className="btn" onClick={createQuiz}>
                    <FaCheck /> Publish Quiz
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default QuizList;
