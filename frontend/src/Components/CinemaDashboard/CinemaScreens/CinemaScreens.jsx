import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Edit,
  Plus,
  Search,
  ToggleLeft,
  Monitor,
  X,
  ArrowLeft,
} from "lucide-react";
import CinemaHeader from "../CinemaHeader/CinemaHeader";
import CinemaSideBar from "../CinemaSideBar/CinemaSideBar";
import { api } from "../../../api/apiClient";
import "./CinemaScreens.css";
import LoadingSpinner from "../CinemaManagement/LoadingSpinner/LoadingSpinner";

const CinemaScreens = () => {
  const { cinemaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [togglingScreenId, setTogglingScreenId] = useState(null);
  const [screens, setScreens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    typeId: 0,
    status: 1,
  });
  // Add new state for Add Screen modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    typeId: 1, // Default to first screen type
    status: 1, // Default to active
  });

  // Screen types
  const screenTypes = [
    { id: 3, name: "Standard" },
    { id: 2, name: "3D" },
    { id: 1, name: "IMAX" },
  ];

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Make API call to add new screen
      await api.screens.create(cinemaId, addFormData);
      await fetchScreens(); // Refresh the screens list
      setShowAddModal(false);
      setAddFormData({
        name: "",
        typeId: 1,
        status: 1,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScreens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.screens.getAll(cinemaId);
      const transformedData = data.map((screen) => ({
        id: screen.id,
        name: screen.name,
        type: screen.screenType.name,
        typeId: screen.screenType.id,
        status: screen.status === 1 ? "active" : "inactive",
        lastModifiedBy: screen.lastModifiedBy,
        lastModifiedDate: new Intl.DateTimeFormat("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(screen.lastModifiedDate)),
      }));
      setScreens(transformedData);
    } catch (error) {
      setError(error.message);
      if (error.message.includes("Authentication required")) {
        navigate("/login", {
          state: { from: location.pathname }, // Using React Router's location
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [cinemaId, navigate, location]);

  useEffect(() => {
    fetchScreens();
  }, [fetchScreens]);

  const handleStatusToggle = async (screenId) => {
    setTogglingScreenId(screenId);
    setError(null);
    try {
      await api.screens.toggleStatus(screenId);
      setScreens((prevScreens) =>
        prevScreens.map((screen) =>
          screen.id === screenId
            ? {
                ...screen,
                status: screen.status === "active" ? "inactive" : "active",
              }
            : screen
        )
      );
    } catch (error) {
      setError(error.message);
      await fetchScreens(); // Refresh the data in case of error
    } finally {
      setTogglingScreenId(null);
    }
  };

  const handleEditClick = (screen) => {
    setEditingScreen(screen);
    // Map the screen type name to the correct typeId
    const typeId =
      screenTypes.find((type) => type.name === screen.type)?.id ||
      screen.typeId;
    setEditFormData({
      name: screen.name,
      typeId: typeId, // Use the mapped typeId
      status: screen.status === "active" ? 1 : 0,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Make sure we're sending all required fields
      const updateData = {
        name: editFormData.name,
        typeId: editFormData.typeId,
        status: editFormData.status,
      };

      await api.screens.update(editingScreen.id, updateData);
      await fetchScreens();
      setShowEditModal(false);
      setEditingScreen(null);
      setEditFormData({
        name: "",
        typeId: 0,
        status: 1,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScreens = screens.filter(
    (screen) =>
      (statusFilter === "all" || screen.status === statusFilter) &&
      screen.name.toLowerCase().includes(filterValue.toLowerCase())
  );

  return (
    <div className="cinema-screens-container">
      <CinemaHeader />
      <div className="dashboard-content">
        <CinemaSideBar />
        <div className="main-content">
          <div className="cinema-screens">
            {error && <div className="error-message">{error}</div>}

            <div className="screens-header">
              <div className="header-title">
                <button
                  className="back-button"
                  onClick={() => navigate("/cinema")}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Cinemas</span>
                </button>
                <h1>Cinema Screens</h1>
                <p>Manage screens for this cinema</p>
              </div>
              <div className="header-actions">
                <button
                  className="add-button"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={16} />
                  <span>Add New Screen</span>
                </button>
              </div>
            </div>

            <div className="filters">
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search screens by name"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="screens-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Last Modified By</th>
                    <th>Last Modified Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="loading-cell">
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : filteredScreens.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data-message">
                        No screens found
                      </td>
                    </tr>
                  ) : (
                    filteredScreens.map((screen) => (
                      <tr key={screen.id}>
                        <td>{screen.name}</td>
                        <td>{screen.type}</td>
                        <td>{screen.lastModifiedBy}</td>
                        <td>{screen.lastModifiedDate}</td>
                        <td>
                          <span className={`status-badge ${screen.status}`}>
                            {screen.status}
                          </span>
                        </td>
                        <td className="actions">
                          <button
                            className={`action-button toggle-button ${screen.status}`}
                            onClick={() => handleStatusToggle(screen.id)}
                            disabled={togglingScreenId === screen.id}
                            title={`Click to ${
                              screen.status === "active"
                                ? "deactivate"
                                : "activate"
                            } screen`}
                          >
                            {togglingScreenId === screen.id ? (
                              <span className="loading-spinner">...</span>
                            ) : (
                              <ToggleLeft
                                size={16}
                                style={{
                                  color:
                                    screen.status === "active"
                                      ? "#2ecc71"
                                      : "#e50914",
                                }}
                              />
                            )}
                          </button>
                          <button
                            className="action-button"
                            onClick={() => handleEditClick(screen)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-button"
                            onClick={() =>
                              navigate(`/cinema/${screen.id}/seats`)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <Monitor size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add New Screen Modal */}
            {showAddModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Add New Screen</h2>
                    <button
                      className="close-button"
                      onClick={() => setShowAddModal(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleAddSubmit}>
                    <div className="form-group">
                      <label>Screen Name</label>
                      <input
                        type="text"
                        required
                        value={addFormData.name}
                        onChange={(e) =>
                          setAddFormData({
                            ...addFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter screen name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Screen Type</label>
                      <select
                        value={addFormData.typeId}
                        onChange={(e) =>
                          setAddFormData({
                            ...addFormData,
                            typeId: parseInt(e.target.value),
                          })
                        }
                      >
                        {screenTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={addFormData.status}
                        onChange={(e) =>
                          setAddFormData({
                            ...addFormData,
                            status: parseInt(e.target.value),
                          })
                        }
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => setShowAddModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading}
                      >
                        {isLoading ? "Adding..." : "Add Screen"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showEditModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Edit Screen</h2>
                    <button
                      className="close-button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingScreen(null);
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleEditSubmit}>
                    <div className="form-group">
                      <label>Screen Name</label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter screen name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Screen Type</label>
                      <select
                        value={editFormData.typeId}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            typeId: parseInt(e.target.value),
                          })
                        }
                      >
                        {screenTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            status: parseInt(e.target.value),
                          })
                        }
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingScreen(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Update Screen"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinemaScreens;
