import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Coffee, Pizza } from "lucide-react";
import CinemaHeader from "../CinemaHeader/CinemaHeader";
import CinemaSideBar from "../CinemaSideBar/CinemaSideBar";
import "./FoodAndDrink.css";

const FoodAndDrink = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Popcorn Large",
      category: "Food",
      price: 8.99,
      status: "available",
      lastModified: "2024-01-02",
      lastModifiedBy: "Admin",
    },
    {
      id: 2,
      name: "Coca Cola 500ml",
      category: "Drink",
      price: 4.99,
      status: "available",
      lastModified: "2024-01-02",
      lastModifiedBy: "Admin",
    },
    {
      id: 3,
      name: "Nachos",
      category: "Food",
      price: 7.99,
      status: "out_of_stock",
      lastModified: "2024-01-02",
      lastModifiedBy: "Admin",
    },
  ]);

  const [selectedItems, setSelectedItems] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(items.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(filterValue.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" ||
      item.category.toLowerCase() === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
                <button
                  className="add-button"
                  onClick={() => setShowAddForm(true)}
                >
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
                  <h3 className="stat-value">15</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon drink">
                  <Coffee size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Total Drink Items</p>
                  <h3 className="stat-value">12</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon out-of-stock">
                  <Trash2 size={24} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Out of Stock</p>
                  <h3 className="stat-value">3</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodAndDrink;
