import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { FaUserShield } from "react-icons/fa";
import "../../styles/StudentQuiz.css";

const StudentQuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);

  const loadQuizzes = async () => {
    try {
      const res = await axiosInstance.get("/quizzes");
      setQuizzes(res.data);

      // Extract unique subjects for dropdown
      const uniqueSubjects = [...new Set(res.data.map((q) => q.subject))];
      setSubjects(uniqueSubjects);
      window.history.replaceState(null, "", "/student/quizzes");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load quizzes");
    }
  };

  const handleFilter = async (subj) => {
    setSubject(subj);

    if (!subj) {
      // Reset to all quizzes if "All Subjects" is selected
      return loadQuizzes();
    }

    try {
      const res = await axiosInstance.get(
        `/quizzes/filter/query?subject=${encodeURIComponent(subj)}`
      );

      const filtered = res.data.filter(
        (quiz) => quiz.subject.toLowerCase() === subj.toLowerCase()
      );
      setQuizzes(filtered);
    } catch (err) {
      alert("Failed to filter quizzes");
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return loadQuizzes();

    try {
      const res = await axiosInstance.get(
        `/quizzes/search/query?keyword=${encodeURIComponent(search)}`
      );
      setQuizzes(res.data);
    } catch (err) {
      alert("No quizzes found for the given keyword");
      console.error(err);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  return (
    <div className="quiz-page">
      <h2 className="quiz-title">Available Quizzes</h2>

      <div className="quiz-controls">
        <select
          className="filter-dropdown"
          value={subject}
          onChange={(e) => handleFilter(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map((subj, index) => (
            <option key={index} value={subj}>
              {subj}
            </option>
          ))}
        </select>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>
      </div>

      {/* 📚 Quiz Grid */}
      <div className="quiz-grid">
        {quizzes.length === 0 ? (
          <p className="no-quiz">No quizzes available</p>
        ) : (
          quizzes.map((q) => (
            <div key={q._id} className="quiz-card">
              <div className="quiz-img-container">
                <img
                  src={q.imgUrl || "/placeholder.jpg"}
                  alt={q.title}
                  className="quiz-img"
                />
              </div>
              {q.isProtected && (
                <span className="proctored-badge">
                  <FaUserShield /> Proctored
                </span>
              )}
              <div className="quiz-info">
                <h3>{q.title}</h3>
                <p>
                  <strong>Subject:</strong> {q.subject}
                </p>
                <p>
                  <strong>Questions:</strong> {q.questions.length}
                </p>
                <Link to={`/take-quiz/${q._id}`} className="take-btn">
                  Take Quiz
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentQuizList;
