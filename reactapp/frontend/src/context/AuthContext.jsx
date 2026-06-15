import React, { createContext, useState } from "react";

const AuthContext = createContext();

const getStoredSession = () => {
  const token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (!token || !savedUser || savedUser === "undefined") {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredSession);

  const login = (data) => {
    if (!data.user || !data.token) return false;

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
