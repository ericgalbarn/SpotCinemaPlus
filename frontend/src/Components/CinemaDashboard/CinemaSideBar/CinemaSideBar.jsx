import React, { useState } from "react";
import { Home, Building2, Film, Calendar, Coffee } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const CinemaSideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.slice(1) || "home"
  );

  const handleNavigation = (route) => {
    setActiveTab(route);
    navigate(`/${route}`);
  };

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <button
          onClick={() => handleNavigation("home")}
          className={`nav-button ${activeTab === "home" ? "active" : ""}`}
        >
          <Home className="nav-icon" />
          <span>Home</span>
        </button>
        <button
          onClick={() => handleNavigation("cinema")}
          className={`nav-button ${activeTab === "cinema" ? "active" : ""}`}
        >
          <Building2 className="nav-icon" />
          <span>Cinema</span>
        </button>
        <button
          onClick={() => handleNavigation("movies")}
          className={`nav-button ${activeTab === "movies" ? "active" : ""}`}
        >
          <Film className="nav-icon" />
          <span>Movies</span>
        </button>
        <button
          onClick={() => handleNavigation("schedules")}
          className={`nav-button ${activeTab === "schedules" ? "active" : ""}`}
        >
          <Calendar className="nav-icon" />
          <span>Schedule</span>
        </button>

        <button
          onClick={() => handleNavigation("concession-management")}
          className={`nav-button ${
            activeTab === "concession-management" ? "active" : ""
          }`}
        >
          <Coffee className="nav-icon" />
          <span>Concessions</span>
        </button>
      </nav>
    </div>
  );
};

export default CinemaSideBar;
