import React, { useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaGraduationCap, FaArrowRight, FaShieldAlt, FaChartLine, FaClipboardList } from "react-icons/fa";
import "../styles/Home.css";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-icon"><FaGraduationCap /></span>
          <strong>ATS Suite</strong>
        </div>
        <div className="landing-nav">
          <Link to="/login" className="landing-btn-text">Sign In</Link>
          <Link to="/register" className="landing-btn-solid">Get Started</Link>
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-hero-content">
          <span className="hero-badge">Smart Assessment Portal</span>
          <h1>Empower Learning With Secured Testing</h1>
          <p>
            ATS is a state-of-the-art assessment portal built to streamline testing, verify integrity with real-time video proctoring, and provide detailed analytics for learners and teachers.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="hero-btn-primary">
              Take a Test <FaArrowRight />
            </Link>
            <Link to="/register" className="hero-btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
        <div className="landing-visual" aria-hidden="true">
          <div className="floating-card c1">
            <span className="fc-icon"><FaShieldAlt /></span>
            <div>
              <strong>Secure Proctoring</strong>
              <p>Camera and tab security</p>
            </div>
          </div>
          <div className="floating-card c2">
            <span className="fc-icon"><FaChartLine /></span>
            <div>
              <strong>Live Reports</strong>
              <p>Granular performance analytics</p>
            </div>
          </div>
          <div className="floating-card c3">
            <span className="fc-icon"><FaClipboardList /></span>
            <div>
              <strong>Smart Quizzes</strong>
              <p>Easy-to-build questions</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
