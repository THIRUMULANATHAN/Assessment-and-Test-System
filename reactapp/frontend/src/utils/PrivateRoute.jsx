import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext); 
  if (loading) return <div>Loading...</div>; 

  if (!user) return <Navigate to="/login" replace />; 

  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/dashboard" replace />; 

  return children;
};

export default PrivateRoute;
