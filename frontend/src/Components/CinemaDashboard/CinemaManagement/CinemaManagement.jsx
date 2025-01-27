import React, { useState, useEffect, useCallback } from "react";
import {
  Edit,
  Plus,
  Search,
  ToggleLeft,
  Trash2,
  Monitor,
  X,
} from "lucide-react";
import CinemaHeader from "../CinemaHeader/CinemaHeader";
import CinemaSideBar from "../CinemaSideBar/CinemaSideBar";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import "./CinemaManagement.css";
import LoadingSpinner from "./LoadingSpinner/LoadingSpinner";
import apiClient from "../../../api/apiClient";

const CinemaManagement = () => {
  const navigate = useNavigate();
  // State declarations
  const [cinemas, setCinemas] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCinemas, setSelectedCinemas] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingCinema, setEditingCinema] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    cityId: 1,
    address: "",
    status: 1,
  });

  const [newCinema, setNewCinema] = useState({
    name: "",
    cityId: 1,
    address: "",
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const cities = [
    { id: 1, name: "Ho Chi Minh City" },
    { id: 2, name: "Hanoi" },
    { id: 3, name: "Da Nang" },
  ];

  // Function to handle view screens
  const handleViewScreens = (cinemaId) => {
    navigate(`/cinema/${cinemaId}/screens`);
  };

  // Error handler function
  const handleError = useCallback((error) => {
    console.error("Error:", error);
    setError(error.message || "An error occurred");
    setTimeout(() => setError(null), 5000);
  }, []);

  const searchCinemas = useCallback(
    async (searchTerm) => {
      setIsLoading(true);

      // Create a promise that resolves after 5 seconds
      const delay = new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        // Wait for 1 seconds first
        await delay;

        // Then fetch the data
        const response = await apiClient.get(`/admin/cinema`, {
          params: searchTerm ? { query: searchTerm } : {},
        });

        const data = response.data;

        // Transform data from the backend into UI state
        const transformedData = data.map((cinema) => ({
          id: cinema.id,
          name: cinema.name,
          city: cinema.city,
          address: cinema.address,
          lastModifiedBy: cinema.lastModifiedBy,
          lastModifiedDate: new Intl.DateTimeFormat("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(cinema.lastModifiedDate)),
          status: cinema.status === 1 ? "active" : "inactive",
          numberOfScreens: cinema.numberOfScreens || 0,
        }));

        setCinemas(transformedData);
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Debounced search function
  const debouncedSearch = React.useMemo(
    () => debounce((searchTerm) => searchCinemas(searchTerm), 300),
    [searchCinemas]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilterValue(value);
    debouncedSearch(value);
  };

  // Initial fetch
  useEffect(() => {
    debouncedSearch("");

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Handle edit button click
  const handleEditClick = (cinema) => {
    setEditingCinema(cinema);
    setEditFormData({
      name: cinema.name,
      cityId: cities.find((city) => city.name === cinema.city)?.id || 1, // Map city name to cityId
      address: cinema.address,
      status: cinema.status === "active" ? 1 : 0,
    });
    setShowEditForm(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const delay = new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Wait for 5 seconds first
      await delay;

      const payload = {
        cityId: editFormData.cityId,
        name: editFormData.name,
        address: editFormData.address,
        status: editFormData.status,
      };

      const response = await apiClient.put(
        `/admin/cinema/${editingCinema.id}`,
        payload
      );

      const data = response.data;
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to update cinema");
      }

      await searchCinemas(filterValue);

      setShowEditForm(false);
      setEditingCinema(null);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add cinema form submission
  const handleAddCinema = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Create a promise that resolves after 5 seconds
    const delay = new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Wait for 5 seconds first
      await delay;

      // Then perform the add operation
      const response = await apiClient.post(`/admin/cinema`, newCinema);
      const data = await response.data;

      if (!response.ok) {
        throw new Error(data.message || "Failed to add cinema");
      }

      setCinemas((prevCinemas) => [
        {
          id: data.data.id,
          name: data.data.name,
          city: cities.find((city) => city.id === parseInt(newCinema.cityId))
            ?.name,
          address: data.data.address,
          status: data.data.status ? "active" : "inactive",
          lastModifiedBy: "Admin",
          lastModifiedDate: new Date().toLocaleDateString(),
        },
        ...prevCinemas,
      ]);

      setNewCinema({
        name: "",
        cityId: 1,
        address: "",
      });
      setShowAddForm(false);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cinema selection
  const handleSelectCinema = (cinemaId) => {
    setSelectedCinemas((prev) =>
      prev.includes(cinemaId)
        ? prev.filter((id) => id !== cinemaId)
        : [...prev, cinemaId]
    );
  };

  // Handle select all cinemas
  const handleSelectAll = (event) => {
    setSelectedCinemas(
      event.target.checked ? filteredCinemas.map((cinema) => cinema.id) : []
    );
  };

  // Handle status toggle
  const handleStatusToggle = async (cinemaId) => {
    try {
      const selectedCinema = cinemas.find((cinema) => cinema.id === cinemaId);

      if (!selectedCinema) {
        throw new Error("Cinema not found");
      }

      // Determine new status based on current string representation
      const newStatus = selectedCinema.status === "active" ? 0 : 1;

      // Send the update request
      const response = await apiClient.put(`/admin/cinema/${cinemaId}`, {
        cityId: selectedCinema.cityId,
        name: selectedCinema.name,
        address: selectedCinema.address,
        status: newStatus,
      });

      if (response.data.status !== "success") {
        throw new Error(response.data.message || "Failed to update status");
      }

      // Update UI state
      setCinemas((prevCinemas) =>
        prevCinemas.map((cinema) =>
          cinema.id === cinemaId
            ? {
                ...cinema,
                status: newStatus === 1 ? "active" : "inactive",
              }
            : cinema
        )
      );
    } catch (error) {
      handleError(error);
    }
  };

  // Handle deactivate selected cinemas
  // Updated delete function
  const handleDeactivateSelected = () => {
    if (selectedCinemas.length > 0) {
      setShowDeleteConfirmation(true);
    }
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    setError(null);

    const delay = new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Wait for 5 seconds first
      await delay;

      await apiClient.delete("/admin/cinema", {
        data: selectedCinemas,
      });

      await searchCinemas(filterValue);

      setSelectedCinemas([]);
      setShowDeleteConfirmation(false);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter cinemas based on status
  const filteredCinemas = cinemas.filter((cinema) =>
    statusFilter === "all" ? true : cinema.status === statusFilter
  );

  return (
    <div className="cinema-management-container">
      {isLoading && <LoadingSpinner />}
      <CinemaHeader />
      <div className="dashboard-content">
        <CinemaSideBar />
        <div className="main-content">
          <div className="cinema-management">
            {error && <div className="error-message">{error}</div>}

            <div className="cinema-header">
              <div className="header-title">
                <h1>Cinema Management</h1>
                <p>Manage your cinema branches</p>
              </div>
              <div className="header-actions">
                <button
                  className="deactivate-button"
                  disabled={selectedCinemas.length === 0}
                  onClick={handleDeactivateSelected}
                >
                  <Trash2 size={16} />
                  <span>Deactivate Selected</span>
                </button>
                <button
                  className="add-button"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus size={16} />
                  <span>Add New Cinema</span>
                </button>
              </div>
            </div>

            <div className="filters">
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search cinemas by name"
                  value={filterValue}
                  onChange={handleSearchChange}
                />
                {isLoading && <LoadingSpinner />}
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

            <div className="cinemas-table">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedCinemas.length === filteredCinemas.length &&
                          filteredCinemas.length > 0
                        }
                      />
                    </th>
                    <th>Name</th>
                    <th>City</th>
                    <th>Last Modified By</th>
                    <th>Last Modified Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCinemas.map((cinema) => (
                    <tr key={cinema.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCinemas.includes(cinema.id)}
                          onChange={() => handleSelectCinema(cinema.id)}
                        />
                      </td>
                      <td>{cinema.name}</td>
                      <td>{cinema.city}</td>
                      <td>{cinema.lastModifiedBy}</td>
                      <td>{cinema.lastModifiedDate}</td>
                      <td>
                        <span className={`status-badge ${cinema.status}`}>
                          {cinema.status}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="action-button"
                          onClick={() => handleStatusToggle(cinema.id)}
                          title={`Click to ${
                            cinema.status === "active"
                              ? "deactivate"
                              : "activate"
                          }`}
                        >
                          {cinema.status === "active" ? (
                            <ToggleLeft
                              size={16}
                              style={{ color: "#2ecc71" }}
                            />
                          ) : (
                            <ToggleLeft
                              size={16}
                              style={{ color: "#e50914" }}
                            />
                          )}
                        </button>
                        <button
                          className="action-button"
                          onClick={() => handleEditClick(cinema)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-button"
                          onClick={() => handleViewScreens(cinema.id)}
                        >
                          <Monitor size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Cinema Modal */}
            {showAddForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Add New Cinema</h2>
                    <button
                      className="close-button"
                      onClick={() => setShowAddForm(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleAddCinema}>
                    <div className="form-group">
                      <label>Cinema Name</label>
                      <input
                        type="text"
                        required
                        value={newCinema.name}
                        onChange={(e) =>
                          setNewCinema({ ...newCinema, name: e.target.value })
                        }
                        placeholder="Enter cinema name"
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <select
                        value={newCinema.cityId}
                        onChange={(e) =>
                          setNewCinema({
                            ...newCinema,
                            cityId: parseInt(e.target.value),
                          })
                        }
                      >
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        required
                        value={newCinema.address}
                        onChange={(e) =>
                          setNewCinema({
                            ...newCinema,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter cinema address"
                      />
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading}
                      >
                        {isLoading ? "Adding..." : "Add Cinema"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Cinema Modal */}
            {showEditForm && editingCinema && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Edit Cinema</h2>
                    <button
                      className="close-button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingCinema(null);
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleEditSubmit}>
                    <div className="form-group">
                      <label>Cinema Name</label>
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
                        placeholder="Enter cinema name"
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <select
                        value={editFormData.cityId}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            cityId: parseInt(e.target.value),
                          })
                        }
                      >
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        required
                        value={editFormData.address}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter cinema address"
                      />
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
                          setShowEditForm(false);
                          setEditingCinema(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Update Cinema"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
              <div className="modal-overlay">
                <div className="modal-content confirmation-modal">
                  <div className="modal-header">
                    <h2>Confirm Delete</h2>
                    <button
                      className="close-button"
                      onClick={() => setShowDeleteConfirmation(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="confirmation-content">
                    <p>
                      Are you sure you want to delete{" "}
                      {selectedCinemas.length === 1
                        ? "this cinema"
                        : `these ${selectedCinemas.length} cinemas`}
                      ?
                    </p>
                    <p className="warning-text">
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setShowDeleteConfirmation(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={confirmDelete}
                      disabled={isLoading}
                    >
                      {isLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinemaManagement;
