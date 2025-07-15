"use client";

import { useState, useCallback } from "react";

export function useMeals(token: string | null) {
  const [meals, setMeals] = useState<any[]>([]);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) return null;

    const response = await fetch(`/api/${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    return response.json();
  };

  const refreshMeals = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiCall("meals");
      if (response?.success) {
        setMeals(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
      setMeals([]);
    }
  }, [token]);

  const addMeal = async (meal: any) => {
    return await apiCall("meals", {
      method: "POST",
      body: JSON.stringify(meal),
    });
  };

  const updateMeal = async (id: string, updates: any) => {
    return await apiCall(`meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  };

  const deleteMeal = async (id: string) => {
    return await apiCall(`meals/${id}`, {
      method: "DELETE",
    });
  };

  const markMealDone = async (id: string) => {
    return await apiCall(`meals/${id}/done`, {
      method: "PUT",
    });
  };

  return {
    meals,
    refreshMeals,
    addMeal,
    updateMeal,
    deleteMeal,
    markMealDone,
  };
}
