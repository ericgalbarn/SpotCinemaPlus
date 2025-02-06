import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://10.147.17.110:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a function to check if token exists and is valid
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  return token;
};

// List of endpoints that don't require authentication
const publicEndpoints = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
];

apiClient.interceptors.request.use(
  (config) => {
    // Skip authentication for public endpoints
    if (publicEndpoints.some((endpoint) => config.url.includes(endpoint))) {
      return config;
    }

    try {
      const token = getAuthToken();
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Request config:", {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
      });
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("Response error:", {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });

    if (error.response?.status === 403) {
      console.log("Authentication failed - token might be invalid or expired");
      // Optionally clear the invalid token
      localStorage.removeItem("token");
      // You might want to redirect to login here
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Add wrapper functions for common API calls
const api = {
  screens: {
    getAll: async (cinemaId) => {
      try {
        // Use the correct endpoint to get all screens for a specific cinema
        const response = await apiClient.get(
          `/admin/cinema/${cinemaId}/screen`
        );
        const screens = response.data;

        // Transform the response data to match the structure expected by the component
        return screens.map((screen) => ({
          id: screen.id,
          name: screen.name,
          screenType: {
            // Match the structure expected by the component
            id: 0, // We don't have this in the response, set a default
            name: screen.type, // Use the type field from the response
          },
          status: screen.status,
          lastModifiedBy: screen.lastModifiedBy,
          lastModifiedDate: screen.lastModifiedDate,
          numberOfSeats: screen.numberOfSeats,
        }));
      } catch (error) {
        if (error.response?.status === 403) {
          throw new Error("Authentication required. Please log in again.");
        }
        throw new Error(
          error.response?.data?.message || "Failed to fetch screens"
        );
      }
    },

    getById: async (screenId) => {
      try {
        const response = await apiClient.get(
          `/admin/cinema/screen/${screenId}`
        );
        return response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          throw new Error("Authentication required. Please log in again.");
        }
        throw new Error(
          error.response?.data?.message || "Failed to fetch screen"
        );
      }
    },

    update: async (screenId, data) => {
      try {
        // Make sure all required fields are present
        if (
          !data.name ||
          data.typeId === undefined ||
          data.status === undefined
        ) {
          throw new Error("Missing required fields");
        }

        const response = await apiClient.put(
          `/admin/cinema/screen/${screenId}`,
          data
        );
        return response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error("Screen not found");
        }
        if (error.response?.status === 403) {
          throw new Error("Authentication required. Please log in again.");
        }
        throw new Error(
          error.response?.data?.message || "Failed to update screen"
        );
      }
    },

    toggleStatus: async (screenId) => {
      try {
        const response = await apiClient.patch(
          `/admin/cinema/screen/${screenId}`
        );
        return response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          throw new Error("Authentication required. Please log in again.");
        }
        throw new Error(
          error.response?.data?.message || "Failed to toggle screen status"
        );
      }
    },

    create: async (cinemaId, data) => {
      try {
        const response = await apiClient.post(
          `/admin/cinema/${cinemaId}/screen`,
          data
        );
        return response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          throw new Error("Authentication required. Please log in again.");
        }
        throw new Error(
          error.response?.data?.message || "Failed to create screen"
        );
      }
    },
  },
  // Add new seats object
  seats: {
    getAllByScreenId: async (screenId) => {
      try {
        const response = await apiClient.get(`/admin/screen/${screenId}/seat`);
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token"); // Clear invalid token
          window.location.href = "/login"; // Redirect to login
          throw new Error("Authentication required. Please log in again.");
        }
        throw new Error(
          error.response?.data?.message || "Failed to fetch seats"
        );
      }
    },
    updateSeat: async (screenId, seatUpdates) => {
      try {
        // Ensure token is present
        const token = getAuthToken();

        const response = await apiClient.put(
          `/admin/screen/${screenId}/seat`,
          seatUpdates,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token"); // Clear invalid token
          window.location.href = "/login"; // Redirect to login
          throw new Error("Authentication required. Please log in again.");
        }
        throw new Error(
          error.response?.data?.message || "Failed to update seats"
        );
      }
    },
    initializeSeats: async (screenId, seatLayout) => {
      try {
        // Ensure token is present
        const token = getAuthToken();

        const response = await apiClient.post(
          `/admin/screen/${screenId}/seat`,
          seatLayout,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token"); // Clear invalid token
          window.location.href = "/login"; // Redirect to login
          throw new Error("Authentication required. Please log in again.");
        }
        throw new Error(
          error.response?.data?.message || "Failed to initialize seats"
        );
      }
    },
  },
};

export { api };
export default apiClient;
