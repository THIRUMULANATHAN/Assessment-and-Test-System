import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "../../styles/Quiz.css";

const QuizSubmit = () => {
  const [quizId, setQuizId] = useState("");
  const [answers, setAnswers] = useState({});

  const handleSubmit = async () => {
    try {
      await axiosInstance.post(`/quizzes/${quizId}/submit`, { answers });
      alert("Quiz submitted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  return (
    <div className="quiz-container">
      <h2>Submit Quiz</h2>
      <input
        placeholder="Enter Quiz ID"
        value={quizId}
        onChange={(e) => setQuizId(e.target.value)}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default QuizSubmit;
