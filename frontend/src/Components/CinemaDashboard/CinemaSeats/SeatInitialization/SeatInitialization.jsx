import React, { useState } from "react";
import { X } from "lucide-react";
import "./SeatInitialization.css";
import { api } from "../../../../api/apiClient";

const SEAT_TYPES = {
  NOT_PLACEABLE: { name: "Not Placeable", color: "#424242" },
  PLACEABLE: { name: "Placeable", color: "#4CAFEB" },
  STANDARD: { name: "Standard", color: "#C0C0C0" },
  VIP: { name: "VIP", color: "#FFD700" },
  LOVERS: { name: "Lovers", color: "#FF4081" },
  BED: { name: "Bed", color: "#6A0DAD" },
};

const SeatInitialization = ({ screenId, onClose, onSuccess }) => {
  const [grid, setGrid] = useState(
    Array(15)
      .fill()
      .map(() => Array(10).fill("PLACEABLE"))
  );
  const [selectedType, setSelectedType] = useState("PLACEABLE");
  const [isInitializing, setIsInitializing] = useState(false);

  const handleCellClick = (row, col) => {
    const seatType = SEAT_TYPES[selectedType];
    const seatSize = seatType?.size || { rows: 1, cols: 1 };

    // For multi-seat types
    if (["LOVERS", "BED"].includes(selectedType)) {
      const maxRow = row + seatSize.rows - 1;
      const maxCol = col + seatSize.cols - 1;

      // Check boundaries
      if (maxRow >= grid.length || maxCol >= grid[0].length) {
        return; // Cannot place seat here
      }

      // Create new grid with multi-seat placement
      const newGrid = grid.map((r) => [...r]);
      for (let r = row; r <= maxRow; r++) {
        for (let c = col; c <= maxCol; c++) {
          newGrid[r][c] = selectedType;
        }
      }
      setGrid(newGrid);
    } else {
      // Single seat placement
      const newGrid = grid.map((r, i) =>
        i === row ? r.map((cell, j) => (j === col ? selectedType : cell)) : r
      );
      setGrid(newGrid);
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const seatLayout = [];
      grid.forEach((row, rowIndex) => {
        row.forEach((typeId, colIndex) => {
          const seatType = SEAT_TYPES[typeId];
          if (seatType) {
            // For multi-seat types, check if this is the root position
            const isRoot = ["LOVERS", "BED"].includes(typeId)
              ? isRootPosition(grid, rowIndex, colIndex, typeId)
              : true;
            if (isRoot || !["LOVERS", "BED"].includes(typeId)) {
              seatLayout.push({
                row: rowIndex,
                col: colIndex,
                typeId: typeId,
                rootRow: rowIndex,
                rootCol: colIndex,
              });
            }
          }
        });
      });

      await api.seats.initializeSeats(screenId, seatLayout);
      onSuccess();
    } catch (error) {
      console.error("Failed to initialize seats:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Helper function to check if a position is the root position for a multi-seat type
  const isRootPosition = (grid, row, col, typeId) => {
    const seatType = SEAT_TYPES[typeId];
    const seatSize = seatType?.size || { rows: 1, cols: 1 };

    // Check if any position above or to the left has the same typeId
    for (let r = row - seatSize.rows + 1; r <= row; r++) {
      for (let c = col - seatSize.cols + 1; c <= col; c++) {
        if (r >= 0 && c >= 0 && grid[r][c] === typeId) {
          if (r < row || c < col) {
            return false; // This is not the root position
          }
        }
      }
    }
    return true;
  };

  return (
    <div className="init-modal-overlay">
      <div className="init-modal-content">
        <div className="init-modal-header">
          <h2>Initialize Screen Seats</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="init-legend">
          {Object.entries(SEAT_TYPES).map(([typeId, type]) => (
            <div
              key={typeId}
              className={`init-legend-item ${
                selectedType === typeId ? "active" : ""
              }`}
              onClick={() => setSelectedType(typeId)}
            >
              <div
                className="init-legend-color"
                style={{ backgroundColor: type.color }}
              />
              <span>{type.name}</span>
            </div>
          ))}
        </div>

        <div className="init-preview-grid">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="init-preview-row">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="init-preview-cell"
                  style={{ backgroundColor: SEAT_TYPES[cell].color }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="init-controls">
          <button
            className="init-button secondary"
            onClick={onClose}
            disabled={isInitializing}
          >
            Cancel
          </button>
          <button
            className="init-button primary"
            onClick={handleInitialize}
            disabled={isInitializing}
          >
            {isInitializing ? "Initializing..." : "Initialize Seats"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatInitialization;
