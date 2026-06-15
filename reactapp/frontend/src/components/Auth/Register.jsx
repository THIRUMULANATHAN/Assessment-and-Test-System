import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock, FaLinkedin, FaGithub, FaEnvelope, FaUserGraduate, FaChalkboardTeacher, FaUserShield } from "react-icons/fa";
import "../../styles/Auth.css";

const quotes = [
  "Success is not final; failure is not fatal: It is the courage to continue that counts.",
  "The only limit to our realization of tomorrow is our doubts of today.",
  "Do something today that your future self will thank you for.",
  "Great things never come from comfort zones."
];

const roleOptions = [
  { value: "Student", label: "Student", icon: <FaUserGraduate /> },
  { value: "Teacher", label: "Teacher", icon: <FaChalkboardTeacher /> },
  { value: "Admin", label: "Admin", icon: <FaUserShield /> },
];

const Register = () => {
  const [form, setForm] = useState({ username: "", password: "", role: "Student" });
  const [quote, setQuote] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/auth/register", form);
      alert("Registered successfully!");
      navigate("/login");
    } catch (err) {
      console.error("Registration failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">

        {/* Left column: Welcome message */}
        <div className="welcome-section">
          <h1>Welcome to ATS!</h1>
          <p className="quote">"{quote}"</p>
          <div className="social-links">
            <a href="https://www.linkedin.com/in/thirumulanathan/" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            <a href="https://github.com/THIRUMULANATHAN" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
            <a href="mailto:thiru2005v@gmail.com"><FaEnvelope /></a>
          </div>
        </div>

        {/* Right column: Register form */}
        <div className="auth-container">
          <h2>Register</h2>
          <form onSubmit={handleSubmit}>
            {/* Username */}
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

            {/* Password */}
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

            {/* Role dropdown */}
            <div className="input-icon select-wrapper">
              {roleOptions.map((role) => (
                <label key={role.value} className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={form.role === role.value}
                    onChange={() => setForm({ ...form, role: role.value })}
                  />
                  <span className="role-label">
                    {role.icon} {role.label}
                  </span>
                </label>
              ))}
            </div>

            <button type="submit">Register</button>
          </form>

          <p className="register-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
