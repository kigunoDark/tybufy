import { createContext, useContext, useState, useEffect } from "react";
import JWTService from "../components/utils/jwt";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("authToken");

    if (token && JWTService.isTokenExpired(token)) {
      await logout();
      throw new Error("Token expired");
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (response.status === 401) {
        await logout();
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setLoading(false);
        return;
      }

      if (JWTService.isTokenExpired(token)) {
        JWTService.clearAuth();
        setLoading(false);
        return;
      }

      try {
        const response = await apiCall("/api/auth/me");

        if (response.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          localStorage.setItem("userData", JSON.stringify(response.data.user));
          JWTService.setupTokenRefresh(refreshToken, token);
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
          JWTService.clearAuth();
        }
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        JWTService.clearAuth();
      } finally {
        setLoading(false);
      }
    };
    checkPaymentSuccess();
    checkAuth();
  }, []);

  const refreshToken = async () => {
    try {
      const response = await apiCall("/api/auth/refresh", {
        method: "POST",
      });

      if (response.success && response.data.token) {
        const newToken = response.data.token;
        localStorage.setItem("authToken", newToken);

        JWTService.setupTokenRefresh(refreshToken, newToken);
      }
    } catch (error) {
      await logout();
    }
  };

  const checkPaymentSuccess = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      const success = urlParams.get("success");

      if (sessionId && success === "true") {
        const token = localStorage.getItem("authToken");

        if (!token) {
          return;
        }

        try {
          const response = await apiCall(`/api/payments/session/${sessionId}`);

          if (response.success && response.data.user) {
            setUser(response.data.user);
            localStorage.setItem(
              "userData",
              JSON.stringify(response.data.user)
            );
          }
        } catch (error) {
          console.error("❌ Payment verification failed:", error);
        }
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    } catch (error) {
      console.error("❌ Payment check error:", error);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);

      const response = await apiCall("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      if (response.success) {
        const { user: userData, token } = response.data;

        localStorage.setItem("authToken", token);
        localStorage.setItem("userData", JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        JWTService.setupTokenRefresh(refreshToken, token);
        return { success: true, user: userData };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);

      const response = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        const { user: userData, token } = response.data;

        localStorage.setItem("authToken", token);
        localStorage.setItem("userData", JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);

        JWTService.setupTokenRefresh(refreshToken, token);
        return { success: true, user: userData };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiCall("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  const generateScript = async (
    topic,
    duration = "medium",
    keyPoints = [],
    contentType = "Лайфстайл"
  ) => {
    try {
      const response = await apiCall("/api/script/generate", {
        method: "POST",
        body: JSON.stringify({ topic, duration, keyPoints, contentType }),
      });

      if (response.success) {
        return { success: true, script: response.data.script };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Script generation error:", error);
      return {
        success: false,
        error: error.message || "Script generation failed. Please try again.",
      };
    }
  };

  const generateKeyPoints = async (topic, contentType = "Лайфстайл") => {
    try {
      const response = await apiCall("/api/script/key-points", {
        method: "POST",
        body: JSON.stringify({ topic, contentType }),
      });

      if (response.success) {
        return { success: true, points: response.data.points };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Key points generation error:", error);
      return {
        success: false,
        error:
          error.message || "Key points generation failed. Please try again.",
      };
    }
  };

  const improveScript = async (selectedText, improvementCommand, script) => {
    try {
      const response = await apiCall("/api/script/improve", {
        method: "POST",
        body: JSON.stringify({ selectedText, improvementCommand, script }),
      });

      if (response.success) {
        return { success: true, improvedText: response.data.improvedText };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Script improvement error:", error);
      return {
        success: false,
        error: error.message || "Script improvement failed. Please try again.",
      };
    }
  };

  const analyzeScriptQuality = async (script) => {
    try {
      const response = await apiCall("/api/script/quality", {
        method: "POST",
        body: JSON.stringify({ script }),
      });

      if (response.success) {
        return { success: true, quality: response.data.quality };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Script quality analysis error:", error);
      return {
        success: false,
        error:
          error.message || "Script quality analysis failed. Please try again.",
      };
    }
  };

  const extendScript = async (script, topic, contentType = "Лайфстайл") => {
    try {
      const response = await apiCall("/api/script/extend", {
        method: "POST",
        body: JSON.stringify({ script, topic, contentType }),
      });

      if (response.success) {
        return { success: true, extension: response.data.extension };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Script extension error:", error);
      return {
        success: false,
        error: error.message || "Script extension failed. Please try again.",
      };
    }
  };

  const generateAudio = async (text, voiceId = "JBFqnCBsd6RMkjVDRZzb") => {
    try {
      const response = await apiCall("/api/audio/generate", {
        method: "POST",
        body: JSON.stringify({ text, voiceId }),
      });

      if (response.success) {
        return { success: true, audio: response.data };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Audio generation error:", error);
      return {
        success: false,
        error: error.message || "Audio generation failed. Please try again.",
      };
    }
  };

  const getAvailableVoices = async () => {
    try {
      const response = await apiCall("/api/audio/voices");

      if (response.success) {
        return { success: true, voices: response.data.voices };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Get voices error:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch available voices.",
      };
    }
  };

  const createProject = async (projectData) => {
    try {
      const response = await apiCall("/api/projects", {
        method: "POST",
        body: JSON.stringify(projectData),
      });

      if (response.success) {
        return { success: true, project: response.data.project };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Create project error:", error);
      return {
        success: false,
        error: error.message || "Failed to create project.",
      };
    }
  };

  const getProjects = async () => {
    try {
      const response = await apiCall("/api/projects");

      if (response.success) {
        return { success: true, projects: response.data.projects };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Get projects error:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch projects.",
      };
    }
  };

  const updateProject = async (projectId, updateData) => {
    try {
      const response = await apiCall(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (response.success) {
        return { success: true, project: response.data.project };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Update project error:", error);
      return {
        success: false,
        error: error.message || "Failed to update project.",
      };
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const response = await apiCall(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.success) {
        return { success: true, message: response.message };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Delete project error:", error);
      return {
        success: false,
        error: error.message || "Failed to delete project.",
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiCall("/api/auth/me");

      if (response.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }

      return { success: false, error: response.error };
    } catch (error) {
      console.error("Refresh user error:", error);
      return {
        success: false,
        error: error.message || "Failed to refresh user data.",
      };
    }
  };

  const getTokenInfo = () => {
    return JWTService.getTokenInfo();
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    refreshToken,
    getTokenInfo,
    generateScript,
    generateKeyPoints,
    improveScript,
    analyzeScriptQuality,
    extendScript,
    generateAudio,
    getAvailableVoices,
    createProject,
    getProjects,
    updateProject,
    deleteProject,
    refreshUser,
    apiCall,
    API_BASE_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
