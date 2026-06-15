import React, { useContext, useEffect, useState } from "react";
import {
  FaBookOpen,
  FaBullseye,
  FaChartLine,
  FaClipboardCheck,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    attempted: 0,
    avgScore: 0,
    accuracy: 0,
  });
  const [adminData, setAdminData] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalReports: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        if (user.role === "Student") {
          const response = await axiosInstance.get("/users/stats");
          setStats(response.data);
          return;
        }

        const requests = [
          axiosInstance.get("/quizzes"),
          axiosInstance.get("/quizzes/reports"),
        ];

        if (user.role === "Admin") {
          requests.unshift(axiosInstance.get("/users"));
        }

        const responses = await Promise.all(requests);
        const usersResponse = user.role === "Admin" ? responses[0] : null;
        const quizzesResponse = responses[user.role === "Admin" ? 1 : 0];
        const reportsResponse = responses[user.role === "Admin" ? 2 : 1];

        setAdminData({
          totalUsers: Array.isArray(usersResponse?.data)
            ? usersResponse.data.length
            : 0,
          totalQuizzes: Array.isArray(quizzesResponse.data)
            ? quizzesResponse.data.length
            : 0,
          totalReports: Array.isArray(reportsResponse.data)
            ? reportsResponse.data.length
            : Object.keys(reportsResponse.data || {}).length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const isStudent = user?.role === "Student";
  const cards = isStudent
    ? [
        {
          label: "Quizzes attempted",
          value: stats.attempted,
          icon: <FaClipboardCheck />,
          tone: "teal",
        },
        {
          label: "Average score",
          value: stats.avgScore,
          icon: <FaChartLine />,
          tone: "blue",
        },
        {
          label: "Accuracy",
          value: `${stats.accuracy}%`,
          icon: <FaBullseye />,
          tone: "amber",
        },
      ]
    : [
        ...(user?.role === "Admin"
          ? [
              {
                label: "Registered users",
                value: adminData.totalUsers,
                icon: <FaUsers />,
                tone: "teal",
              },
            ]
          : []),
        {
          label: "Published quizzes",
          value: adminData.totalQuizzes,
          icon: <FaBookOpen />,
          tone: "blue",
        },
        {
          label: "Student reports",
          value: adminData.totalReports,
          icon: <FaFileAlt />,
          tone: "amber",
        },
      ];

  const initials = user?.username?.slice(0, 2).toUpperCase() || "AT";

  return (
    <section className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-kicker">Assessment workspace</span>
          <h2>Welcome back, {user?.username}</h2>
          <p>
            {isStudent
              ? "Track your progress, continue practicing, and improve with every assessment."
              : "Monitor assessments, manage quiz content, and review learner performance."}
          </p>
          <span className="role-pill">{user?.role}</span>
        </div>
        <div className="hero-profile" aria-hidden="true">
          <div className="hero-avatar">{initials}</div>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
        </div>
      </div>

      <div className="dashboard-heading">
        <div>
          <span>At a glance</span>
          <h3>{isStudent ? "Your performance" : `${user?.role} overview`}</h3>
        </div>
        <p>Live data from your assessment workspace</p>
      </div>

      <div className={`stats-container stats-${cards.length}`}>
        {cards.map((card) => (
          <article className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.tone}`}>{card.icon}</div>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-note">
        <div className="note-icon">
          <FaBookOpen />
        </div>
        <div>
          <strong>{isStudent ? "Ready for your next quiz?" : "Keep content current"}</strong>
          <p>
            {isStudent
              ? "Open the quiz library from the sidebar and choose a subject to begin."
              : "Use the navigation to manage quizzes and review assessment reports."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
