import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { AuthContext } from "../../context/AuthContext";
import { FaUser, FaLock, FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import "../../styles/Auth.css";

const quotes = [
  "Success is not final; failure is not fatal: It is the courage to continue that counts.",
  "The only limit to our realization of tomorrow is our doubts of today.",
  "Do something today that your future self will thank you for.",
  "Great things never come from comfort zones."
];

const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [quote, setQuote] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/auth/login", {
        username: form.username,
        password: form.password
      });
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        {/* Left column: Welcome, quote, social */}
        <div className="welcome-section">
          <h1>Welcome Back!</h1>
          <p className="quote">"{quote}"</p>
          <div className="social-links">
            <a href="https://www.linkedin.com/in/thirumulanathan/" target="_blank" rel="noopener noreferrer">
              <FaLinkedin />
            </a>
            <a href="https://github.com/THIRUMULANATHAN" target="_blank" rel="noopener noreferrer">
              <FaGithub />
            </a>
            <a href="mailto:thiru2005v@gmail.com">
              <FaEnvelope />
            </a>
          </div>
        </div>

        {/* Right column: Login form */}
        <div className="auth-container">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-icon">
              <FaUser className="icon" />
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div className="input-icon">
              <FaLock className="icon" />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button type="submit">Login</button>
          </form>

          <p className="register-link">
            New user? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
