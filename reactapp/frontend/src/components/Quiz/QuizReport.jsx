import React, { useEffect, useState, useContext } from "react";
import axiosInstance from "../../api/axiosInstance";
import { AuthContext } from "../../context/AuthContext";
import {
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaCalendarAlt,
  FaTrophy,
  FaAward,
  FaBook,
  FaChartPie,
  FaInbox,
  FaSlidersH,
  FaUserGraduate,
  FaCheckCircle,
  FaClipboardList
} from "react-icons/fa";
import "../../styles/QuizReport.css";

const QuizReport = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState(null);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");

  // Accordion state (for Admin/Teacher)
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        let res;
        if (user.role === "Student") {
          res = await axiosInstance.get(`/quizzes/reports/${user.username}`);
          setReports(Array.isArray(res.data) ? res.data : []);
        } else {
          res = await axiosInstance.get("/quizzes/reports");
          setReports(res.data || {});
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports(user.role === "Student" ? [] : {});
      }
    };

    if (user) loadReports();
  }, [user]);

  if (!reports) {
    return <div className="reports-page-container">Loading reports...</div>;
  }

  // ------------------ UTILS & FORMATTERS ------------------
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getScorePercentage = (score, total) => {
    if (!total || total === 0) return 0;
    return Math.round((score / total) * 100);
  };

  const getScoreStatus = (score, total) => {
    const pct = getScorePercentage(score, total);
    if (pct >= 80) return "excellent";
    if (pct >= 60) return "passing";
    return "poor";
  };

  const getScoreBadge = (score, total) => {
    const status = getScoreStatus(score, total);
    if (status === "excellent") {
      return <span className="score-badge excellent"><FaAward /> Excellent ({score}/{total})</span>;
    }
    if (status === "passing") {
      return <span className="score-badge passing"><FaCheckCircle /> Passing ({score}/{total})</span>;
    }
    return <span className="score-badge poor"><FaInbox /> Retake ({score}/{total})</span>;
  };

  const getProgressBar = (score, total) => {
    const pct = getScorePercentage(score, total);
    const status = getScoreStatus(score, total);
    return (
      <div className="score-progress-container">
        <div className="score-progress-bar">
          <div
            className={`score-progress-fill ${status}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="score-pct-text">{pct}%</span>
      </div>
    );
  };

  const toggleAccordion = (studentName) => {
    if (expandedStudent === studentName) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentName);
    }
  };

  // Extract subjects for filtering
  const getSubjects = () => {
    const subjects = new Set();
    if (user.role === "Student") {
      reports.forEach((r) => {
        if (r.subject) subjects.add(r.subject);
      });
    } else {
      Object.values(reports).forEach((studentReports) => {
        studentReports.forEach((r) => {
          if (r.subject) subjects.add(r.subject);
        });
      });
    }
    return Array.from(subjects);
  };

  const allSubjects = getSubjects();

  // ==========================================================================
  // STUDENT VIEW IMPLEMENTATION
  // ==========================================================================
  if (user.role === "Student") {
    // 1. Calculate Metrics
    const totalAttempted = reports.length;
    
    let avgScore = 0;
    let passingRate = 0;
    if (totalAttempted > 0) {
      const totalPct = reports.reduce((sum, r) => sum + getScorePercentage(r.score, r.totalMarks), 0);
      avgScore = Math.round(totalPct / totalAttempted);

      const passedQuizzes = reports.filter(r => getScorePercentage(r.score, r.totalMarks) >= 60).length;
      passingRate = Math.round((passedQuizzes / totalAttempted) * 100);
    }

    // 2. Filter & Sort reports
    const filteredReports = reports
      .filter((r) => {
        const matchesSearch =
          r.quizTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.subject?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = selectedSubject === "All" || r.subject === selectedSubject;
        const matchesStatus =
          selectedStatus === "All" || getScoreStatus(r.score, r.totalMarks) === selectedStatus.toLowerCase();

        return matchesSearch && matchesSubject && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") return new Date(b.date || 0) - new Date(a.date || 0);
        if (sortBy === "date-asc") return new Date(a.date || 0) - new Date(b.date || 0);
        if (sortBy === "score-desc") {
          return getScorePercentage(b.score, b.totalMarks) - getScorePercentage(a.score, a.totalMarks);
        }
        if (sortBy === "score-asc") {
          return getScorePercentage(a.score, a.totalMarks) - getScorePercentage(b.score, b.totalMarks);
        }
        return 0;
      });

    return (
      <div className="reports-page-container">
        {/* Title Section */}
        <header className="reports-header">
          <h2>My Performance Report</h2>
          <p>Review and analyze your quiz progress, scores, and completion timeline.</p>
        </header>

        {/* Dashboard Metrics Cards */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrapper sky">
              <FaClipboardList />
            </div>
            <div className="metric-info">
              <span className="metric-label">Quizzes Taken</span>
              <span className="metric-value">{totalAttempted}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrapper indigo">
              <FaTrophy />
            </div>
            <div className="metric-info">
              <span className="metric-label">Average Accuracy</span>
              <span className="metric-value">{avgScore}%</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrapper emerald">
              <FaChartPie />
            </div>
            <div className="metric-info">
              <span className="metric-label">Passing Rate</span>
              <span className="metric-value">{passingRate}%</span>
            </div>
          </div>
        </section>

        {/* Filters and Search controls */}
        <section className="reports-filter-bar">
          <div className="filter-left">
            <div className="reports-search-wrapper">
              <FaSearch className="reports-search-icon" />
              <input
                type="text"
                placeholder="      Search quiz or subject..."
                className="reports-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="reports-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="All">All Subjects</option>
              {allSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <select
              className="reports-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Excellent">Excellent (80%+)</option>
              <option value="Passing">Passing (60%-79%)</option>
              <option value="Poor">Needs Review (&lt;60%)</option>
            </select>
          </div>

          <div className="filter-right">
            <span className="filter-label"><FaSlidersH /> Sort:</span>
            <select
              className="reports-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>
        </section>

        {/* Results Container */}
        {filteredReports.length === 0 ? (
          <div className="reports-empty-state">
            <FaInbox className="empty-state-icon" />
            <h3>No reports found</h3>
            <p>Try refining your search query or adjusting the filters.</p>
          </div>
        ) : (
          <div className="reports-table-card">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Subject</th>
                  <th>Performance Meter</th>
                  <th>Grade</th>
                  <th>Completion Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r, i) => (
                  <tr key={r.id || i}>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{r.quizTitle}</td>
                    <td>
                      <span className="subject-tag">{r.subject}</span>
                    </td>
                    <td>{getProgressBar(r.score, r.totalMarks)}</td>
                    <td>{getScoreBadge(r.score, r.totalMarks)}</td>
                    <td>
                      <span className="report-date">
                        <FaCalendarAlt /> {formatDate(r.date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // TEACHER / ADMIN VIEW IMPLEMENTATION
  // ==========================================================================
  
  // Calculate Global Admin Metrics
  let totalStudentSubmissions = 0;
  let overallAvgPct = 0;
  const uniqueStudentsList = Object.keys(reports);
  const totalUniqueStudentsCount = uniqueStudentsList.length;

  let totalPctSum = 0;
  uniqueStudentsList.forEach((student) => {
    const studentReports = reports[student];
    totalStudentSubmissions += studentReports.length;
    studentReports.forEach((r) => {
      totalPctSum += getScorePercentage
      (r.score, r.totalMarks);
    });
  });

  if (totalStudentSubmissions > 0) {
    overallAvgPct = Math.round(totalPctSum / totalStudentSubmissions);
  }

  // Filter student accordion entries
  const filteredStudents = Object.entries(reports).filter(([studentUsername, studentReports]) => {
    // Matches student name
    const matchesStudent = studentUsername.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Or matches any of their quiz titles
    const matchesAnyQuiz = studentReports.some(
      (r) =>
        r.quizTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return matchesStudent || matchesAnyQuiz;
  });

  return (
    <div className="reports-page-container">
      {/* Title Section */}
      <header className="reports-header">
        <h2>Student Performance reports</h2>
        <p>Monitor student progress, analyze results, and review assessment metrics.</p>
      </header>

      {/* Admin Metrics Dashboard */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrapper sky">
            <FaUserGraduate />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Students</span>
            <span className="metric-value">{totalUniqueStudentsCount}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper indigo">
            <FaClipboardList />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Submissions</span>
            <span className="metric-value">{totalStudentSubmissions}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper emerald">
            <FaTrophy />
          </div>
          <div className="metric-info">
            <span className="metric-label">Class Average</span>
            <span className="metric-value">{overallAvgPct}%</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Controls */}
      <section className="reports-filter-bar">
        <div className="filter-left" style={{ width: "100%" }}>
          <div className="reports-search-wrapper" style={{ width: "100%", maxWidth: "450px" }}>
            <FaSearch className="reports-search-icon" />
            <input
              type="text"
              placeholder="Search by student name, quiz title, or subject..."
              className="reports-search-input"
              style={{ width: "100%" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="reports-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="All">All Subjects</option>
            {allSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Accordion List of Students */}
      {filteredStudents.length === 0 ? (
        <div className="reports-empty-state">
          <FaInbox className="empty-state-icon" />
          <h3>No student reports found</h3>
          <p>Try typing a different name or expanding search criteria.</p>
        </div>
      ) : (
        <div className="student-accordion">
          {filteredStudents.map(([studentUsername, studentReports]) => {
            // Calculate individual student summary metrics
            const studentAttempts = studentReports.length;
            const studentAvgPct = studentAttempts > 0
              ? Math.round(
                  studentReports.reduce((sum, r) => sum + getScorePercentage(r.score, r.totalMarks), 0) /
                    studentAttempts
                )
              : 0;

            const initials = studentUsername.slice(0, 2).toUpperCase();
            const isExpanded = expandedStudent === studentUsername;

            // Apply subject filter if selected
            const displayedReports = studentReports.filter(
              (r) => selectedSubject === "All" || r.subject === selectedSubject
            );

            if (selectedSubject !== "All" && displayedReports.length === 0) {
              return null; // Hide student if none of their quiz reports match selected subject filter
            }

            return (
              <div
                key={studentUsername}
                className={`student-accordion-item ${isExpanded ? "expanded" : ""}`}
              >
                {/* Accordion Trigger Header */}
                <button
                  className="student-header-trigger"
                  onClick={() => toggleAccordion(studentUsername)}
                  aria-expanded={isExpanded}
                >
                  <div className="student-trigger-left">
                    <div className="student-trigger-avatar">{initials}</div>
                    <div className="student-trigger-info">
                      <h3 className="student-name-text">{studentUsername}</h3>
                      <p className="student-sub-text">Active Learner</p>
                    </div>
                  </div>

                  <div className="student-trigger-right">
                    <div className="student-summary-stat">
                      <span className="student-summary-label">Quizzes Taken</span>
                      <span className="student-summary-val">{studentAttempts}</span>
                    </div>

                    <div className="student-summary-stat">
                      <span className="student-summary-label">Avg Accuracy</span>
                      <span className="student-summary-val" style={{ color: studentAvgPct >= 60 ? "#059669" : "#dc2626" }}>
                        {studentAvgPct}%
                      </span>
                    </div>

                    <FaChevronDown className="accordion-chevron-icon" />
                  </div>
                </button>

                {/* Collapsible Panel */}
                <div className="student-details-panel">
                  <div className="student-panel-content">
                    {displayedReports.length === 0 ? (
                      <p className="student-sub-text" style={{ padding: "10px 0" }}>
                        No reports found for this subject.
                      </p>
                    ) : (
                      <div className="reports-table-card" style={{ margin: 0, border: "none" }}>
                        <table className="reports-table">
                          <thead>
                            <tr>
                              <th>Quiz</th>
                              <th>Score</th>
                              <th>Tab Switch Count</th>
                              <th>Status</th>
                              <th>Recordings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedReports.map((r, idx) => (
                              <tr key={r.id || idx}>
                                <td style={{ fontWeight: 600, color: "#0f172a" }}>
                                  {r.quizTitle}
                                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal", marginTop: "2px" }}>
                                    {r.subject} • {formatDate(r.date)}
                                  </div>
                                </td>
                                <td style={{ fontWeight: "bold" }}>
                                  {r.score} / {r.totalMarks}
                                </td>
                                <td style={{ color: r.tabSwitches >= 3 ? "#dc2626" : "#334155", fontWeight: 600 }}>
                                  {r.tabSwitches}
                                </td>
                                <td>
                                  {r.tabSwitches < 3 ? (
                                    <span className="proctor-status-badge passed">Passed</span>
                                  ) : (
                                    <span className="proctor-status-badge suspicious">Suspicious</span>
                                  )}
                                </td>
                                <td>
                                  {r.isProtected ? (
                                    <div className="proctoring-actions">
                                      {r.cameraRecording ? (
                                        <a
                                          href={r.cameraRecording}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="action-btn webcam-btn"
                                        >
                                          📷 View Webcam
                                        </a>
                                      ) : (
                                        <span className="no-recording-text">No Webcam</span>
                                      )}
                                      {r.screenRecording ? (
                                        <a
                                          href={r.screenRecording}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="action-btn screen-btn"
                                        >
                                          🖥 View Screen
                                        </a>
                                      ) : (
                                        <span className="no-recording-text">No Screen</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="unprotected-tag">Unprotected</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizReport;
