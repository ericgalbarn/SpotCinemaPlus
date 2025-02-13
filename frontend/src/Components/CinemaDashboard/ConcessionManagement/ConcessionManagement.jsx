import React, { useState, useEffect } from "react";
import { Plus, Search, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CinemaHeader from "../CinemaHeader/CinemaHeader";
import CinemaSideBar from "../CinemaSideBar/CinemaSideBar";
import ConcessionModal from "./ConcessionModal/ConcessionModal";
import LoadingSpinner from "../../CinemaDashboard/CinemaManagement/LoadingSpinner/LoadingSpinner";
import { api } from "../../../api/apiClient";
import "./ConcessionManagement.css";

const ConcessionManagement = () => {
  const [concessions, setConcessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConcession, setEditingConcession] = useState(null);
  const navigate = useNavigate();

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Fetch concessions data
  useEffect(() => {
    const fetchConcessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.concessions.getAll();
        setConcessions(data);
      } catch (err) {
        if (err.message.includes("Authentication required")) {
          navigate("/login");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConcessions();
  }, [navigate]);

  // Filter concessions with null checks
  const filteredConcessions = concessions.filter((concession) => {
    const matchesSearch =
      concession.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      concession.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      concession.foods?.some(
        (food) =>
          food.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          food.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      concession.drinks?.some(
        (drink) =>
          drink.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          drink.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCinema =
      !selectedCinema || concession.cinemaId === parseInt(selectedCinema);
    return matchesSearch && matchesCinema;
  });

  // Handle concession creation
  const handleAddConcession = async (concessionData) => {
    try {
      setLoading(true);
      // Remove the data:image/jpeg;base64, prefix if it exists
      const imageBase64 = concessionData.imageBase64.includes("base64,")
        ? concessionData.imageBase64.split("base64,")[1]
        : concessionData.imageBase64;

      const payload = {
        name: concessionData.name,
        description: concessionData.description,
        imageBase64: imageBase64,
        cinemaId: parseInt(selectedCinema || "1"), // Default to 1 if not selected
        foods: concessionData.foods.map((food) => ({
          name: food.name,
          description: food.description,
          price: parseFloat(food.price),
        })),
        drinks: concessionData.drinks.map((drink) => ({
          name: drink.name,
          description: drink.description,
          price: parseFloat(drink.price),
        })),
        comboPrice: parseFloat(concessionData.comboPrice),
      };

      await api.concessions.create(payload);
      const updatedConcessions = await api.concessions.getAll();
      setConcessions(updatedConcessions);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating concession:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle concession update
  const handleUpdateConcession = async (concessionData) => {
    try {
      setLoading(true);
      // Only process the image if it's new or changed
      let imageBase64 = concessionData.imageBase64;
      if (imageBase64 && imageBase64.includes("base64,")) {
        imageBase64 = imageBase64.split("base64,")[1];
      }

      const payload = {
        name: concessionData.name,
        description: concessionData.description,
        imageBase64: imageBase64,
        cinemaId: parseInt(selectedCinema || editingConcession.cinemaId),
        foods: concessionData.foods.map((food) => ({
          name: food.name,
          description: food.description,
          price: parseFloat(food.price),
        })),
        drinks: concessionData.drinks.map((drink) => ({
          name: drink.name,
          description: drink.description,
          price: parseFloat(drink.price),
        })),
        comboPrice: parseFloat(concessionData.comboPrice),
      };

      await api.concessions.update(editingConcession.id, payload);
      const updatedConcessions = await api.concessions.getAll();
      setConcessions(updatedConcessions);
      setIsModalOpen(false);
      setEditingConcession(null);
    } catch (err) {
      console.error("Error updating concession:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Modified image display in the card
  const getImageUrl = (imageBase64) => {
    if (!imageBase64) return "/api/placeholder/120/120";
    return imageBase64.includes("data:image")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
  };

  // Rest of the component (UI rendering) remains mostly the same
  if (loading)
    return (
      <div className="page-container">
        <CinemaHeader />
        <div className="dashboard-content">
          <CinemaSideBar />
          <div className="main-content">
            <div className="loading">
              <LoadingSpinner />
            </div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="page-container">
        <CinemaHeader />
        <div className="dashboard-content">
          <CinemaSideBar />
          <div className="main-content">
            <div className="error">{error}</div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="page-container">
      <CinemaHeader />
      <div className="dashboard-content">
        <CinemaSideBar />
        <div className="main-content">
          <div className="concession-container">
            <div className="concession-header">
              <div className="header-title">
                <h1>Concessions</h1>
                <p>Manage cinema concessions</p>
              </div>
              <button
                className="add-button"
                onClick={() => {
                  setEditingConcession(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={20} />
                Add Concession
              </button>
            </div>

            <div className="filters">
              <div className="search-container">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search concessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="cinema-select"
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
              >
                <option value="">All Cinemas</option>
                <option value="1">Cinema 1</option>
                <option value="2">Cinema 2</option>
              </select>
            </div>

            <div className="concessions-grid">
              {filteredConcessions.map((concession) => (
                <div key={concession.id} className="concession-card">
                  <div className="card-content">
                    <img
                      src={getImageUrl(concession.imageBase64)}
                      alt={concession.name}
                      className="concession-image"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/120/120";
                      }}
                    />
                    <div className="concession-details">
                      <div className="card-header">
                        <h3 className="concession-name">{concession.name}</h3>
                        <div className="action-buttons">
                          <button
                            className="action-button"
                            onClick={() => {
                              setEditingConcession(concession);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="description">
                        <p>{concession.description}</p>
                      </div>

                      <div className="items-list">
                        {concession.foods?.length > 0 && (
                          <div className="food-items">
                            <strong>Foods:</strong>
                            {concession.foods.map((food, index) => (
                              <div key={index}>
                                {food.name} - ${food.price}
                              </div>
                            ))}
                          </div>
                        )}
                        {concession.drinks?.length > 0 && (
                          <div className="drink-items">
                            <strong>Drinks:</strong>
                            {concession.drinks.map((drink, index) => (
                              <div key={index}>
                                {drink.name} - ${drink.price}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="total-section">
                        <span>Total:</span>
                        <span>${concession.comboPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ConcessionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingConcession(null);
        }}
        onSubmit={
          editingConcession ? handleUpdateConcession : handleAddConcession
        }
        editData={editingConcession}
      />
    </div>
  );
};

export default ConcessionManagement;
