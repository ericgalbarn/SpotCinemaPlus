import React, { useState, useEffect } from "react";
import "./ConcessionModal.css";

const ConcessionModal = ({ isOpen, onClose, onSubmit, editData }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    comboPrice: 0,
    imageBase64: "",
    foods: [],
    drinks: [],
  });

  const [newItem, setNewItem] = useState({
    type: "food",
    name: "",
    description: "",
    price: 0,
  });

  useEffect(() => {
    if (editData) {
      // Ensure arrays are properly initialized even if they don't exist in editData
      setFormData({
        name: editData.name || "",
        description: editData.description || "",
        comboPrice: editData.comboPrice || 0,
        imageBase64: editData.imageBase64 || "",
        foods: editData.foods || [],
        drinks: editData.drinks || [],
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: "",
        description: "",
        comboPrice: 0,
        imageBase64: "",
        foods: [],
        drinks: [],
      });
    }
  }, [editData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill in both name and price for the item");
      return;
    }

    if (newItem.type === "food") {
      setFormData((prev) => ({
        ...prev,
        foods: [...(prev.foods || []), { ...newItem }],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        drinks: [...(prev.drinks || []), { ...newItem }],
      }));
    }
    setNewItem({ type: "food", name: "", description: "", price: 0 });
  };

  const removeItem = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, i) => i !== index),
    }));
  };

  const calculateTotalPrice = () => {
    const foodsTotal = (formData.foods || []).reduce(
      (sum, item) => sum + Number(item.price),
      0
    );
    const drinksTotal = (formData.drinks || []).reduce(
      (sum, item) => sum + Number(item.price),
      0
    );
    return foodsTotal + drinksTotal;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalPrice = calculateTotalPrice();

    // Prepare the submission data
    const submissionData = {
      ...formData,
      comboPrice: totalPrice,
      foods: formData.foods || [],
      drinks: formData.drinks || [],
    };

    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{editData ? "Edit Concession" : "Add New Concession"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required={!editData}
            />
          </div>

          <div className="items-section">
            <h3>Add Items</h3>
            <div className="add-item-form">
              <select
                value={newItem.type}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
              <input
                type="text"
                placeholder="Name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Description"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
              />
              <button type="button" onClick={addItem}>
                Add
              </button>
            </div>

            <div className="items-list">
              <h4>Foods:</h4>
              {(formData.foods || []).map((food, index) => (
                <div key={index} className="item-row">
                  <span>
                    {food.name} - ${food.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem("foods", index)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <h4>Drinks:</h4>
              {(formData.drinks || []).map((drink, index) => (
                <div key={index} className="item-row">
                  <span>
                    {drink.name} - ${drink.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem("drinks", index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="total-price">
              Total Price: ${calculateTotalPrice().toFixed(2)}
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit">{editData ? "Update" : "Create"}</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConcessionModal;
