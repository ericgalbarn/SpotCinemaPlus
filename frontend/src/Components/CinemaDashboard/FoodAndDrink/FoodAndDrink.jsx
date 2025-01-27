import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Coffee, Pizza } from "lucide-react";
import CinemaHeader from "../CinemaHeader/CinemaHeader";
import CinemaSideBar from "../CinemaSideBar/CinemaSideBar";
import { api } from "../../../api/apiClient";
import "./FoodAndDrink.css";

const FoodAndDrink = () => {
  // State management
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    sort: ["lastModifiedDate,desc"],
  });

  // Stats state
  const [stats, setStats] = useState({
    totalFood: 0,
    totalDrink: 0,
    outOfStock: 0,
  });

  // Fetch data function using useCallback to memoize
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const [foodItems, drinkItems] = await Promise.all([
        api.foodAndDrink.getAllFood(
          filterValue,
          pagination.page,
          pagination.size,
          pagination.sort
        ),
        api.foodAndDrink.getAllDrink(
          filterValue,
          pagination.page,
          pagination.size,
          pagination.sort
        ),
      ]);

      // Transform and combine the items
      const transformedItems = [
        ...foodItems.map((food) => ({
          id: food.id,
          name: food.name,
          category: "Food",
          description: food.description,
          price: food.price,
          size: food.size,
          status: food.status === 1 ? "available" : "out_of_stock",
          lastModified: new Date(food.lastModifiedDate).toLocaleDateString(),
          lastModifiedBy: food.lastModifiedBy,
          imageBase64: food.imageBase64,
        })),
        ...drinkItems.map((drink) => ({
          id: drink.id,
          name: drink.name,
          category: "Drink",
          description: drink.description,
          price: drink.price,
          size: drink.size,
          volume: drink.volume,
          status: drink.status === 1 ? "available" : "out_of_stock",
          lastModified: new Date(drink.lastModifiedDate).toLocaleDateString(),
          lastModifiedBy: drink.lastModifiedBy,
          imageBase64: drink.imageBase64,
        })),
      ];

      setItems(transformedItems);

      // Update stats
      setStats({
        totalFood: foodItems.length,
        totalDrink: drinkItems.length,
        outOfStock: transformedItems.filter(
          (item) => item.status === "out_of_stock"
        ).length,
      });

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterValue, pagination.page, pagination.size, pagination.sort]); // Add all dependencies

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]); // fetchItems is now memoized with useCallback

  // Filter function
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(filterValue.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" ||
      item.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Selection handlers
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedItems(event.target.checked ? items.map((item) => item.id) : []);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handlePageSizeChange = (newSize) => {
    setPagination((prev) => ({
      ...prev,
      size: newSize,
      page: 0, // Reset to first page when changing page size
    }));
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <CinemaHeader />
      <div className="dashboard-content">
        <CinemaSideBar />
        <div className="main-content">
          <div className="fnb-management">
            {/* Header Section */}
            <div className="fnb-header">
              <div className="header-title">
                <h1>Food & Drink</h1>
                <p>Manage concessions and refreshments</p>
              </div>
              <div className="header-actions">
                <button
                  className="delete-button"
                  disabled={selectedItems.length === 0}
                >
                  <Trash2 size={16} />
                  Delete Selected
                </button>
                <button className="add-button">
                  <Plus size={16} />
                  Add New Item
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="fnb-stats">
              <div className="stat-card">
                <div className="stat-icon food">
                  <Pizza size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Total Food Items</p>
                  <h3 className="stat-value">{stats.totalFood}</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon drink">
                  <Coffee size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Total Drink Items</p>
                  <h3 className="stat-value">{stats.totalDrink}</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon out-of-stock">
                  <Trash2 size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Out of Stock</p>
                  <h3 className="stat-value">{stats.outOfStock}</h3>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="filters">
              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <select
                value={pagination.size}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            {/* Items Table */}
            <div className="fnb-table">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedItems.length === items.length}
                      />
                    </th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Last Modified</th>
                    <th>Modified By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>
                        <span
                          className={`category-badge ${item.category.toLowerCase()}`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td>{item.size}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>{item.lastModified}</td>
                      <td>{item.lastModifiedBy}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button">
                            <Edit size={16} />
                          </button>
                          <button className="action-button">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
              >
                Previous
              </button>
              <span>Page {pagination.page + 1}</span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={filteredItems.length < pagination.size}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodAndDrink;
