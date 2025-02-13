import React, { useState, useEffect } from "react";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/style.css";
import CinemaHeader from "../CinemaHeader/CinemaHeader";
import CinemaSideBar from "../CinemaSideBar/CinemaSideBar";
import LoadingSpinner from "../../CinemaDashboard/CinemaManagement/LoadingSpinner/LoadingSpinner";
import { api } from "../../../api/apiClient";
import "./CinemaSchedules.css";
import moment from "moment";

const CinemaSchedules = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timelineItems, setTimelineItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  // Fetch schedules for the cinema

  const fetchSchedules = async (cinemaId) => {
    try {
      setIsLoading(true);
      const { groups: fetchedGroups, items: fetchedItems } =
        await api.schedules.getByCinema(cinemaId);
      setGroups(fetchedGroups);
      setTimelineItems(fetchedItems);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch schedules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Replace '1' with actual cinemaId from your app's state or URL params
    fetchSchedules(1);
  }, []);

  const handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const roundToNearest15Min = (time) => {
      const minutes = time.minutes();
      const roundedMinutes = Math.round(minutes / 15) * 15;
      return time.clone().minutes(roundedMinutes).seconds(0);
    };

    setTimelineItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const snappedStartTime = roundToNearest15Min(moment(dragTime));
          const movieLength = moment
            .duration(item.end_time.diff(item.start_time))
            .asMinutes();

          return {
            ...item,
            start_time: snappedStartTime,
            end_time: moment(snappedStartTime).add(movieLength, "minutes"),
            group: groups[newGroupOrder].id,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="cinema-management-container">
      {isLoading && <LoadingSpinner />}
      <CinemaHeader />
      <div className="dashboard-content">
        <CinemaSideBar />
        <div className="main-content">
          <div className="cinema-management">
            <div className="cinema-header">
              <div className="header-title">
                <h1>Movie Schedules</h1>
                <p>Manage your movie schedules</p>
              </div>
            </div>
            {error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="schedule-timeline">
                <Timeline
                  groups={groups}
                  items={timelineItems}
                  defaultTimeStart={moment().startOf("day")}
                  defaultTimeEnd={moment().endOf("day")}
                  lineHeight={50}
                  itemHeightRatio={0.75}
                  sidebarWidth={150}
                  canMove={true}
                  canResize={false}
                  stackItems
                  traditionalZoom
                  onItemMove={handleItemMove}
                  timeSteps={{
                    second: 0,
                    minute: 15,
                    hour: 1,
                    day: 1,
                    month: 1,
                    year: 1,
                  }}
                  dragSnap={15 * 60 * 1000} // Snap to 15-minute intervals
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinemaSchedules;
