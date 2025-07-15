"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import { useIngredients } from "../hooks/use-ingredients";
import { useRecipes } from "../hooks/use-recipes";
import { useMeals } from "../hooks/use-meals";

interface IngredientManagerProps {
  token: string;
}

export function IngredientManager({ token }: IngredientManagerProps) {
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    refreshIngredients,
  } = useIngredients(token);
  const { recipes, refreshRecipes } = useRecipes(token);
  const { meals, refreshMeals } = useMeals(token);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    category: "",
    quantity: "",
    minQuantity: "",
    expiryDate: "",
  });

  useEffect(() => {
    refreshIngredients();
    refreshRecipes();
    refreshMeals();
  }, [refreshIngredients, refreshRecipes, refreshMeals]);

  const resetForm = () => {
    setFormData({
      name: "",
      unit: "",
      category: "",
      quantity: "",
      minQuantity: "",
      expiryDate: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      quantity: Number.parseFloat(formData.quantity),
      minQuantity: Number.parseFloat(formData.minQuantity),
    };

    try {
      if (editingId) {
        await updateIngredient(editingId, data);
      } else {
        await addIngredient(data);
      }

      setOpen(false);
      resetForm();
      await refreshIngredients();
    } catch (error) {
      console.error("Error saving ingredient:", error);
    }
  };

  const handleEdit = (ingredient: any) => {
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      category: ingredient.category,
      quantity: ingredient.quantity.toString(),
      minQuantity: ingredient.minQuantity.toString(),
      expiryDate: ingredient.expiryDate || "",
    });
    setEditingId(ingredient.id);
    setOpen(true);
  };

  const checkIngredientDependencies = (ingredientId: string) => {
    const affectedRecipes = recipes.filter((recipe) =>
      recipe.ingredients?.some((ing: any) => ing.ingredientId === ingredientId)
    );
    const affectedMeals = meals.filter((meal) =>
      affectedRecipes.some((recipe) => recipe.id === meal.recipeId)
    );
    return { affectedRecipes, affectedMeals };
  };

  const handleDeleteClick = (ingredient: any) => {
    setIngredientToDelete(ingredient);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ingredientToDelete) return;

    try {
      await deleteIngredient(ingredientToDelete.id);
      await refreshIngredients();
      await refreshRecipes();
      await refreshMeals();
    } catch (error) {
      console.error("Error deleting ingredient:", error);
    } finally {
      setDeleteDialogOpen(false);
      setIngredientToDelete(null);
    }
  };

  const getIngredientCombinedStatus = (ingredient: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = ingredient.expiryDate
      ? new Date(ingredient.expiryDate)
      : null;
    const isExpired = expiryDate ? expiryDate < today : false;

    let stockLabel = "In Stock";
    let stockColor: "default" | "secondary" | "destructive" = "default";

    if (ingredient.quantity <= 0) {
      stockLabel = "Out of Stock";
      stockColor = "destructive";
    } else if (ingredient.quantity < ingredient.minQuantity) {
      stockLabel = "Low Stock";
      stockColor = "secondary";
    }

    return {
      stockLabel,
      stockColor,
      isExpired,
      expiryLabel: isExpired ? "Expired" : undefined,
    };
  };

  // Filtered and sorted ingredients
  const filteredAndSortedIngredients = useMemo(() => {
    const filtered = ingredients.filter((ingredient) => {
      // Search filter
      const matchesSearch =
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory =
        filterCategory === "all" || ingredient.category === filterCategory;

      // Status filter
      let matchesStatus = true;
      if (filterStatus !== "all") {
        const status = getIngredientCombinedStatus(ingredient);
        switch (filterStatus) {
          case "in-stock":
            matchesStatus = status.stockLabel === "In Stock";
            break;
          case "low-stock":
            matchesStatus = status.stockLabel === "Low Stock";
            break;
          case "out-of-stock":
            matchesStatus = status.stockLabel === "Out of Stock";
            break;
          case "expired":
            matchesStatus = status.isExpired;
            break;
        }
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort ingredients
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return a.category.localeCompare(b.category);
        case "quantity":
          return b.quantity - a.quantity;
        case "expiry":
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return (
            new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          );
        case "status":
          const statusA = getIngredientCombinedStatus(a);
          const statusB = getIngredientCombinedStatus(b);
          const statusOrder = {
            "Out of Stock": 0,
            "Low Stock": 1,
            "In Stock": 2,
          };
          return (
            statusOrder[statusA.stockLabel as keyof typeof statusOrder] -
            statusOrder[statusB.stockLabel as keyof typeof statusOrder]
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [ingredients, searchTerm, sortBy, filterCategory, filterStatus]);

  const dependencies = ingredientToDelete
    ? checkIngredientDependencies(ingredientToDelete.id)
    : { affectedRecipes: [], affectedMeals: [] };

  // Get unique categories for filter dropdown
  const categories = Array.from(
    new Set(ingredients.map((ing) => ing.category))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-brown-900">
            Ingredients
          </h2>
          <p className="text-bakery-700">Manage your ingredient inventory</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Ingredient</DialogTitle>
              <DialogDescription>
                {editingId ? "Update" : "Add a new"} ingredient to your
                inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="focus:ring-pink-400 focus:border-pink-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="meat">Meat</SelectItem>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="fruits">Fruits</SelectItem>
                      <SelectItem value="grains">Grains</SelectItem>
                      <SelectItem value="spices">Spices</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    required
                    className="focus:ring-pink-400 focus:border-pink-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Min Quantity</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    step="0.1"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minQuantity: e.target.value,
                      }))
                    }
                    required
                    className="focus:ring-pink-400 focus:border-pink-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, unit: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="l">l</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="cups">cups</SelectItem>
                      <SelectItem value="tbsp">tbsp</SelectItem>
                      <SelectItem value="tsp">tsp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiryDate: e.target.value,
                    }))
                  }
                  className="focus:ring-pink-400 focus:border-pink-400"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
              >
                {editingId ? "Update" : "Add"} Ingredient
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bakery-700 h-4 w-4" />
                <Input
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 focus:ring-pink-400 focus:border-pink-400"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="w-full md:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="quantity">Quantity (High-Low)</SelectItem>
                  <SelectItem value="expiry">Expiry Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-48">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="capitalize"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-bakery-700">
            Showing {filteredAndSortedIngredients.length} of{" "}
            {ingredients.length} ingredients
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-soft-pink-600">
              <AlertTriangle className="h-5 w-5 text-soft-pink-600" />
              <span>Delete Ingredient</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-bakery-700">
              Are you sure you want to delete{" "}
              <strong>{ingredientToDelete?.name}</strong>?
              {dependencies.affectedRecipes.length > 0 && (
                <div className="bg-wheat-50 border border-wheat-200 rounded-md p-3">
                    ⚠️ This will also delete{" "}
                    {dependencies.affectedRecipes.length} recipe(s):
                  <ul className="text-sm text-wheat-700 space-y-1">
                    {dependencies.affectedRecipes.slice(0, 3).map((recipe) => (
                      <li key={recipe.id}>• {recipe.name}</li>
                    ))}
                    {dependencies.affectedRecipes.length > 3 && (
                      <li>
                        • +{dependencies.affectedRecipes.length - 3} more
                        recipes
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {dependencies.affectedMeals.length > 0 && (
                <div className="bg-soft-pink-50 border border-soft-pink-200 rounded-md p-3">
                  <p className="font-medium text-soft-pink-800 mb-2">
                    🗑️ This will also delete {dependencies.affectedMeals.length}{" "}
                    planned meal(s):
                  </p>
                  <ul className="text-sm text-soft-pink-700 space-y-1">
                    {dependencies.affectedMeals.slice(0, 3).map((meal) => (
                      <li key={meal.id}>
                        • {meal.date} - {meal.time}
                      </li>
                    ))}
                    {dependencies.affectedMeals.length > 3 && (
                      <li>
                        • +{dependencies.affectedMeals.length - 3} more meals
                      </li>
                    )}
                  </ul>
                </div>
              )}
                This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-soft-pink-600 hover:bg-soft-pink-700 text-white"
            >
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedIngredients.map((ingredient) => {
          const status = getIngredientCombinedStatus(ingredient);
          return (
            <Card
              key={ingredient.id}
              className="border-wheat-200 bg-bakery-50 shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-dark-brown-800">
                      {ingredient.name}
                    </CardTitle>
                    <CardDescription className="capitalize text-bakery-700">
                      {ingredient.category}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {status.isExpired && (
                      <Badge
                        variant="destructive"
                        className="bg-soft-pink-500 text-soft-pink-50"
                      >
                        {status.expiryLabel}
                      </Badge>
                    )}
                    {status.stockLabel === "In Stock" && (
                      <Badge
                        variant="default"
                        className="bg-bakery-100 text-bakery-800 border-bakery-200"
                      >
                        {status.stockLabel}
                      </Badge>
                    )}
                    {status.stockLabel === "Low Stock" && (
                      <Badge
                        variant="secondary"
                        className="bg-wheat-200 text-wheat-800 border-wheat-300"
                      >
                        {status.stockLabel}
                      </Badge>
                    )}
                    {status.stockLabel === "Out of Stock" && (
                      <Badge
                        variant="destructive"
                        className="bg-soft-pink-500 text-soft-pink-50"
                      >
                        {status.stockLabel}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm text-dark-brown-800">
                  <span>Current Stock:</span>
                  <span className="font-medium">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-dark-brown-800">
                  <span>Min Required:</span>
                  <span>
                    {ingredient.minQuantity} {ingredient.unit}
                  </span>
                </div>
                {ingredient.expiryDate && (
                  <div className="flex justify-between text-sm text-dark-brown-800">
                    <span>Expires:</span>
                    <span>{ingredient.expiryDate}</span>
                  </div>
                )}
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(ingredient)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(ingredient)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAndSortedIngredients.length === 0 && ingredients.length > 0 && (
        <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-bakery-700 mb-4" />
            <h3 className="text-lg font-medium text-dark-brown-900 mb-2">
              No ingredients match your filters
            </h3>
            <p className="text-bakery-700 text-center mb-4">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("all");
                setFilterStatus("all");
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {ingredients.length === 0 && (
        <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-bakery-700 mb-4" />
            <h3 className="text-lg font-medium text-dark-brown-900 mb-2">
              No ingredients yet
            </h3>
            <p className="text-bakery-700 text-center mb-4">
              Start by adding some ingredients to your inventory.
            </p>
            <Button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Ingredient
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
