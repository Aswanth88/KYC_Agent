import { useState, useEffect } from "react";
import { User } from "../types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Export getAuthHeaders as a separate function
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({ user, token, loading: false });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        setAuthState({ user: null, token: null, loading: false });
      }
    } else {
      setAuthState({ user: null, token: null, loading: false });
    }
  }, []);

  // ----------------------------
  // LOGIN
  // ----------------------------
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      const user = data.user || { 
        username: email, 
        email, 
        role: data.role,
        firstName: data.user?.firstName,
        lastName: data.user?.lastName
      };

      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(user));
      localStorage.setItem("role", data.role);

      setAuthState({ user, token: data.access_token, loading: false });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // ----------------------------
  // SIGNUP
  // ----------------------------
  const signup = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      return true;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // ----------------------------
  // LOGOUT
  // ----------------------------
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("role");
    setAuthState({ user: null, token: null, loading: false });
    window.location.href = "/";
  };

  return {
    user: authState.user,
    token: authState.token,
    loading: authState.loading,
    login,
    signup,
    logout,
    isAuthenticated: !!authState.user,
    getAuthHeaders: () => {
    const token = localStorage.getItem("auth_token");
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  },
};
};