"use client";

import { useState, useCallback } from "react";

export function useRecipes(token: string | null) {
  const [recipes, setRecipes] = useState<any[]>([]);

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

  const refreshRecipes = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiCall("recipes");
      if (response?.success) {
        setRecipes(response.data);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }, [token]);

  const addRecipe = async (recipe: any) => {
    return await apiCall("recipes", {
      method: "POST",
      body: JSON.stringify(recipe),
    });
  };

  const updateRecipe = async (id: string, updates: any) => {
    return await apiCall(`recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  };

  const deleteRecipe = async (id: string) => {
    return await apiCall(`recipes/${id}`, {
      method: "DELETE",
    });
  };

  return {
    recipes,
    refreshRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  };
}
