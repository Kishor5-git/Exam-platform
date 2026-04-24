import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/";

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120s discovery timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Neural Sync Error:", error.response?.data?.error || error.message);
    
    // Auto-logout on 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
