"use client";

import { useState, useEffect } from "react";

interface User {
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem("baketrack_token");
    const storedUser = localStorage.getItem("baketrack_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const userData = { name: data.name, email };
        setUser(userData);
        setToken(data.token);
        localStorage.setItem("baketrack_token", data.token);
        localStorage.setItem("baketrack_user", JSON.stringify(userData));
        return true;
      } else {
        setError(data.message);
        return false;
      }
    } catch (err) {
      setError("Network error. Please check if the API server is running.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-login after successful signup
        return await login(email, password);
      } else {
        setError(data.message);
        return false;
      }
    } catch (err) {
      setError("Network error. Please check if the API server is running.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, new_password: newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        setError(data.message);
        return { success: false, message: data.message };
      }
    } catch (err) {
      setError("Network error. Please check if the API server is running.");
      return { success: false, message: "Network error. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("baketrack_token");
    localStorage.removeItem("baketrack_user");
  };

  return {
    user,
    token,
    loading,
    error,
    login,
    signup,
    logout,
    forgotPassword,
    setError,
  };
}
