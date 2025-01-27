import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { api } from "../../../api/apiClient";
import "./CinemaSeats.css";
import LoadingSpinner from "../CinemaManagement/LoadingSpinner/LoadingSpinner";
import SeatInitialization from "./SeatInitialization/SeatInitialization";

const SEAT_TYPES = {
  [-1]: { name: "Not Placeable", color: "#424242" },
  0: { name: "Placeable", color: "#4CAFEB" },
  1: { name: "Standard", color: "#C0C0C0" },
  2: { name: "VIP", color: "#FFD700" },
  3: { name: "Lovers", color: "#FF4081", size: { rows: 1, cols: 2 } },
  4: { name: "Bed", color: "#6A0DAD", size: { rows: 2, cols: 2 } },
};

const CinemaSeats = () => {
  const { screenId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [screenInfo, setScreenInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showInitModal, setShowInitModal] = useState(false);
  const [hasInitializedSeats, setHasInitializedSeats] = useState(false);

  const transformSeatsToMatrix = useCallback((seatsData) => {
    if (!seatsData || seatsData.length === 0) {
      return [];
    }

    const matrix = Array(15)
      .fill()
      .map(() => Array(10).fill(null));

    seatsData.forEach((seat) => {
      matrix[seat.row][seat.col] = {
        ...seat,
        type: SEAT_TYPES[seat.typeId] || SEAT_TYPES[0],
      };
    });

    return matrix;
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [screenData, seatsData] = await Promise.all([
        api.screens.getById(screenId),
        api.seats.getAllByScreenId(screenId),
      ]);

      setScreenInfo(screenData);
      if (seatsData.length === 0) {
        setShowInitModal(true);
        setHasInitializedSeats(false);
        setSeats([]);
      } else {
        setHasInitializedSeats(true);
        const seatsMatrix = transformSeatsToMatrix(seatsData);
        setSeats(seatsMatrix);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [screenId, transformSeatsToMatrix]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeatClick = (seat, row, col) => {
    if (!seat || seat.typeId === -1) {
      setWarningMessage("Cannot edit Not Placeable seats");
      setTimeout(() => setWarningMessage(""), 3000);
      return;
    }
    setSelectedSeat({ ...seat, row, col });
    setShowEditModal(true);
  };

  const handleSeatUpdate = async (newTypeId) => {
    setIsUpdating(true);
    try {
      const updatePayload = [];
      const currentSeats = seats.flat().filter((seat) => seat); // Get all non-null seats

      // For Bed seats (typeId = 4), we need to check if we have enough space
      if (newTypeId === 4) {
        // Check if we're too close to the bottom or right edge
        if (
          selectedSeat.row >= seats.length - 1 ||
          selectedSeat.col >= seats[0].length - 1
        ) {
          setWarningMessage("Not enough space for a bed seat here");
          setIsUpdating(false);
          return;
        }

        // Check if all four positions are available
        const positions = [
          [selectedSeat.row, selectedSeat.col],
          [selectedSeat.row, selectedSeat.col + 1],
          [selectedSeat.row + 1, selectedSeat.col],
          [selectedSeat.row + 1, selectedSeat.col + 1],
        ];

        for (const [row, col] of positions) {
          const targetSeat = seats[row][col];
          if (targetSeat?.typeId === -1) {
            setWarningMessage("Cannot place bed seat here - blocked positions");
            setIsUpdating(false);
            return;
          }
        }

        // Add all four positions for the bed seat
        positions.forEach(([row, col]) => {
          updatePayload.push({
            row: row,
            col: col,
            typeId: newTypeId,
            rootRow: selectedSeat.row,
            rootCol: selectedSeat.col,
          });
        });

        // Set other related seats to placeable
        const relatedSeats = currentSeats.filter(
          (seat) =>
            seat.rootRow === selectedSeat.rootRow &&
            seat.rootCol === selectedSeat.rootCol &&
            !positions.some(
              ([row, col]) => seat.row === row && seat.col === col
            )
        );

        relatedSeats.forEach((seat) => {
          updatePayload.push({
            row: seat.row,
            col: seat.col,
            typeId: 0, // Placeable
            rootRow: seat.row,
            rootCol: seat.col,
          });
        });
      } else {
        // Original logic for other seat types
        if (newTypeId <= 2) {
          // For single seats (Standard, VIP)
          updatePayload.push({
            row: selectedSeat.row,
            col: selectedSeat.col,
            typeId: newTypeId,
            rootRow: selectedSeat.row,
            rootCol: selectedSeat.col,
          });

          // Mark other related positions as placeable
          const relatedSeats = currentSeats.filter(
            (seat) =>
              seat.rootRow === selectedSeat.rootRow &&
              seat.rootCol === selectedSeat.rootCol &&
              (seat.row !== selectedSeat.row || seat.col !== selectedSeat.col)
          );

          relatedSeats.forEach((seat) => {
            updatePayload.push({
              row: seat.row,
              col: seat.col,
              typeId: 0, // Placeable
              rootRow: seat.row,
              rootCol: seat.col,
            });
          });
        } else if (newTypeId === 3) {
          // For Lovers seats (1x2)
          if (selectedSeat.col >= seats[0].length - 1) {
            setWarningMessage("Not enough space for a lovers seat here");
            setIsUpdating(false);
            return;
          }

          const positions = [
            [selectedSeat.row, selectedSeat.col],
            [selectedSeat.row, selectedSeat.col + 1],
          ];

          positions.forEach(([row, col]) => {
            updatePayload.push({
              row: row,
              col: col,
              typeId: newTypeId,
              rootRow: selectedSeat.row,
              rootCol: selectedSeat.col,
            });
          });
        }
      }

      // Add remaining unchanged seats to payload
      seats.forEach((row, rowIndex) => {
        row.forEach((seat, colIndex) => {
          const isUpdated = updatePayload.some(
            (update) => update.row === rowIndex && update.col === colIndex
          );
          if (!isUpdated && seat) {
            updatePayload.push({
              row: rowIndex,
              col: colIndex,
              typeId: seat.typeId,
              rootRow: seat.rootRow,
              rootCol: seat.rootCol,
            });
          }
        });
      });

      await api.seats.updateSeat(screenId, updatePayload);
      await fetchData();
      setShowEditModal(false);
      setSelectedSeat(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="cinema-seats-container">
      {warningMessage && (
        <div className="warning-message">{warningMessage}</div>
      )}

      <div className="seats-header">
        <button
          className="back-button"
          onClick={() => navigate(`/cinema/${screenInfo?.cinema?.id}/screens`)}
        >
          <ArrowLeft size={16} />
          <span>Back to Screens</span>
        </button>
        <div className="screen-info">
          <h1>Cinema: {screenInfo?.cinema?.name}</h1>
          <h1>Screen: {screenInfo?.name}</h1>
          <p>Screen Type: {screenInfo?.screenType?.name}</p>
        </div>
      </div>

      {hasInitializedSeats && (
        <div className="seats-layout">
          <div className="screen">
            <div className="screen-curve">Screen</div>
          </div>

          <div className="seats-matrix">
            {seats.map((row, rowIndex) => (
              <div key={rowIndex} className="seat-row">
                {row.map((seat, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`seat ${
                      seat?.typeId === -1 ? "not-placeable" : ""
                    }`}
                    style={{
                      backgroundColor: seat
                        ? seat.type.color
                        : SEAT_TYPES[0].color,
                      border: `1px solid ${
                        seat ? seat.type.color : SEAT_TYPES[0].color
                      }`,
                      cursor: seat?.typeId === -1 ? "not-allowed" : "pointer",
                    }}
                    onClick={() => handleSeatClick(seat, rowIndex, colIndex)}
                    title={
                      seat
                        ? `${seat.name || ""} (${seat.type.name})`
                        : "Placeable"
                    }
                  >
                    {seat && <span className="seat-name">{seat.name}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="seats-legend">
            {Object.entries(SEAT_TYPES).map(([typeId, type]) => (
              <div key={typeId} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: type.color }}
                ></div>
                <span>{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEditModal && selectedSeat && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                Edit Seat:{" "}
                {selectedSeat.name ||
                  `Row ${selectedSeat.row + 1}, Col ${selectedSeat.col + 1}`}
              </h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSeat(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select New Seat Type</label>
                <div className="seat-type-options">
                  {Object.entries(SEAT_TYPES).map(([typeId, type]) => {
                    if (parseInt(typeId) === -1) return null;

                    return (
                      <button
                        key={typeId}
                        className={`seat-type-button ${
                          selectedSeat.typeId === parseInt(typeId)
                            ? "active"
                            : ""
                        }`}
                        style={{
                          backgroundColor: type.color,
                          opacity: isUpdating ? 0.5 : 1,
                        }}
                        onClick={() => handleSeatUpdate(parseInt(typeId))}
                        disabled={isUpdating}
                      >
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInitModal && (
        <SeatInitialization
          screenId={screenId}
          onClose={() => setShowInitModal(false)}
          onSuccess={() => {
            setShowInitModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default CinemaSeats;
