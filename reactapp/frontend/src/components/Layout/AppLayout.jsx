import React, { useState } from "react";
import Navbar from "./Navbar";

const AppLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`app-main ${isCollapsed ? "collapsed-sidebar" : ""}`}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
