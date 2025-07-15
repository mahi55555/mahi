"use client";

import { useState, useCallback } from "react";

export function useIngredients(token: string | null) {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [expired, setExpired] = useState<any[]>([]);

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

  const refreshIngredients = useCallback(async () => {
    if (!token) return;

    try {
      const [ingredientsRes, lowStockRes, expiredRes] = await Promise.all([
        apiCall("ingredients"),
        apiCall("ingredients/low-stock"),
        apiCall("ingredients/expired"),
      ]);

      if (ingredientsRes?.success) setIngredients(ingredientsRes.data || []);
      if (lowStockRes?.success) setLowStock(lowStockRes.data || []);
      if (expiredRes?.success) setExpired(expiredRes.data || []);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      // Set empty arrays on error to prevent undefined issues
      setIngredients([]);
      setLowStock([]);
      setExpired([]);
    }
  }, [token]);

  const addIngredient = async (ingredient: any) => {
    return await apiCall("ingredients", {
      method: "POST",
      body: JSON.stringify(ingredient),
    });
  };

  const updateIngredient = async (id: string, updates: any) => {
    return await apiCall(`ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  };

  const deleteIngredient = async (id: string) => {
    return await apiCall(`ingredients/${id}`, {
      method: "DELETE",
    });
  };

  return {
    ingredients,
    lowStock,
    expired,
    refreshIngredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
  };
}
