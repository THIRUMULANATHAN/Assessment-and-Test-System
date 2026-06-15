import React from "react";
import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import "../styles/NotFound.css";

const NotFound = () => (
  <div className="notfound-container">
    <div className="notfound-card">
      <div className="notfound-icon" aria-hidden="true">
        <FaExclamationTriangle />
      </div>
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
      <Link to="/" className="btn">
        <FaArrowLeft /> Return Home
      </Link>
    </div>
  </div>
);

export default NotFound;
