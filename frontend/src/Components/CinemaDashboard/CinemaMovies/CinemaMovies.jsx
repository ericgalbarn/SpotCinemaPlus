import React, { useState, useEffect } from "react";
import { Film, Play, Clock, Plus } from "lucide-react";
import CinemaHeader from "../CinemaHeader/CinemaHeader";
import CinemaSideBar from "../CinemaSideBar/CinemaSideBar";
import { api } from "../../../api/apiClient";
import "./CinemaMovies.css";

const MovieCard = ({ movie }) => (
  <div className="movie-card">
    <div className="relative group">
      <div className="movie-poster">
        <img
          src={movie.image}
          alt={movie.title}
          className="group-hover:scale-105"
          onError={(e) => {
            e.target.src = "/api/placeholder/240/360";
          }}
        />
        <span
          className={`movie-status-badge ${
            movie.status === "Now Showing"
              ? "bg-green-900/60 text-green-400 border border-green-700"
              : "bg-yellow-900/60 text-yellow-400 border border-yellow-700"
          }`}
        >
          {movie.status}
        </span>
      </div>

      <div className="movie-info">
        <h3 className="movie-title text-white group-hover:text-[#e50914] transition-colors">
          {movie.title}
        </h3>
        <div className="movie-metadata">
          <span className="movie-duration">
            <Clock className="w-3 h-3" />
            {movie.duration}
          </span>
          <span className="metadata-separator"></span>
          <span>{movie.release}</span>
        </div>
      </div>
    </div>
  </div>
);

const MovieCardSkeleton = () => (
  <div className="movie-card">
    <div className="relative">
      <div className="movie-poster skeleton"></div>
      <div className="movie-info">
        <div className="h-6 w-3/4 mb-2 skeleton rounded"></div>
        <div className="h-4 w-1/2 skeleton rounded"></div>
      </div>
    </div>
  </div>
);

const CinemaMovies = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    nowShowing: 0,
    comingSoon: 0,
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const moviesData = await api.movies.getAll();
      setMovies(moviesData);

      const nowShowing = moviesData.filter(
        (m) => m.status === "Now Showing"
      ).length;
      const comingSoon = moviesData.filter(
        (m) => m.status === "Coming Soon"
      ).length;

      setStats({
        total: moviesData.length,
        nowShowing,
        comingSoon,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = movies.filter((movie) => {
    if (selectedFilter !== "all") {
      const statusMatch =
        selectedFilter === "showing"
          ? movie.status === "Now Showing"
          : movie.status === "Coming Soon";
      if (!statusMatch) return false;
    }
    return true;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">
            Error Loading Movies
          </h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <CinemaHeader />
      <div className="dashboard-content">
        <CinemaSideBar />
        <div className="main-content">
          {/* Movies Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Movies Management</h1>
            <button className="add-movie">
              <Plus className="add-icon" />
              <span>Add New Movie</span>
            </button>
          </div>

          {/* Movies Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <p className="stat-label">Total Movies</p>
                  <h3 className="stat-value">{stats.total}</h3>
                </div>
                <div className="stat-icon">
                  <Film />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <p className="stat-label">Now Showing</p>
                  <h3 className="stat-value">{stats.nowShowing}</h3>
                </div>
                <div className="stat-icon">
                  <Play />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <p className="stat-label">Coming Soon</p>
                  <h3 className="stat-value">{stats.comingSoon}</h3>
                </div>
                <div className="stat-icon">
                  <Clock />
                </div>
              </div>
            </div>
          </div>

          {/* Movies List */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <h2 className="text-xl font-semibold">All Movies</h2>
              </div>
            </div>

            {/* Movies Grid */}
            <div className="movies-grid">
              {loading
                ? Array(8)
                    .fill(0)
                    .map((_, index) => <MovieCardSkeleton key={index} />)
                : filteredMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinemaMovies;
