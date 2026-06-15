import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "../utils/PrivateRoute";
import AppLayout from "../components/Layout/AppLayout";

// Pages
import Home from "../pages/Home";
import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile"; 

// Admin/Teacher
import QuizList from "../components/Quiz/QuizList";
import QuizReport from "../components/Quiz/QuizReport";
import UserList from "../components/Users/UserList";

// Student
import StudentQuizList from "../components/Quiz/StudentQuizList";
import TakeQuiz from "../components/Quiz/TakeQuiz";

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes inside AppLayout */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </PrivateRoute>
        }
      />

      {/* Admin & Teacher */}
      <Route
        path="/quizzes"
        element={
          <PrivateRoute allowedRoles={["Admin", "Teacher"]}>
            <AppLayout>
              <QuizList />
            </AppLayout>
          </PrivateRoute>
        }
      />

      {/* Student quiz list */}
      <Route
        path="/student/quizzes"
        element={
          <PrivateRoute allowedRoles={["Student"]}>
            <AppLayout>
              <StudentQuizList />
            </AppLayout>
          </PrivateRoute>
        }
      />

      {/* Student takes a quiz */}
      <Route
        path="/take-quiz/:id"
        element={
          <PrivateRoute allowedRoles={["Student"]}>
            <AppLayout>
              <TakeQuiz />
            </AppLayout>
          </PrivateRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <AppLayout>
              <QuizReport />
            </AppLayout>
          </PrivateRoute>
        }
      />

      {/* Users */}
      <Route
        path="/users"
        element={
          <PrivateRoute allowedRoles={["Admin"]}>
            <AppLayout>
              <UserList />
            </AppLayout>
          </PrivateRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
