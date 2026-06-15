import React, { useContext, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBookOpen,
  FaChartPie,
  FaChevronRight,
  FaClipboardList,
  FaGraduationCap,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/Layout.css";

const menuItems = [
  {
    to: "/dashboard",
    label: "Overview",
    icon: <FaChartPie />,
    roles: ["Admin", "Teacher", "Student"],
  },
  { to: "/users", label: "Users", icon: <FaUsers />, roles: ["Admin"] },
  {
    to: "/quizzes",
    label: "Manage Quizzes",
    icon: <FaBookOpen />,
    roles: ["Admin", "Teacher"],
  },
  {
    to: "/student/quizzes",
    label: "Quiz Library",
    icon: <FaBookOpen />,
    roles: ["Student"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: <FaClipboardList />,
    roles: ["Admin", "Teacher", "Student"],
  },
  {
    to: "/profile",
    label: "Profile",
    icon: <FaUserCircle />,
    roles: ["Admin", "Teacher", "Student"],
  },
];

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const visibleItems = menuItems.filter((item) => item.roles.includes(user?.role));
  const currentItem = visibleItems.find(
    (item) =>
      location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  );
  const initials = user?.username?.slice(0, 2).toUpperCase() || "AT";

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className={`top-navbar ${isCollapsed ? "collapsed-sidebar" : ""}`}>
        <button
          className="hamburger"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          <FaBars />
        </button>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronRight style={{ transform: "rotate(180deg)" }} />}
        </button>
        <div className="topbar-heading">
          <span className="topbar-eyebrow">Workspace</span>
          <h1 className="topbar-title">
            {currentItem?.label || "Assessment Portal"}
          </h1>
        </div>
        <div className="topbar-user">
          <span className="topbar-avatar">{initials}</span>
          <div>
            <strong>{user?.username}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
      </header>

      <aside className={`sidebar ${open ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
        <div>
          <div className="sidebar-brand">
            <span className="brand-mark">
              <FaGraduationCap />
            </span>
            <div>
              <strong>ATS</strong>
              <span>Assessment Suite</span>
            </div>
            <button
              className="sidebar-close"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <FaTimes />
            </button>
          </div>

          <p className="sidebar-section-label">Main menu</p>
          <nav className="sidebar-nav">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "active" : "")}
                title={isCollapsed ? item.label : ""}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                <FaChevronRight className="nav-arrow" />
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar">{initials}</span>
            <div>
              <strong>{user?.username}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title={isCollapsed ? "Sign out" : ""}>
            <FaSignOutAlt />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {open && (
        <button
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </>
  );
};

export default Navbar;
