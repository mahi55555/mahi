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
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  ChefHat,
  X,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import { useRecipes } from "../hooks/use-recipes";
import { useIngredients } from "../hooks/use-ingredients";
import { useMeals } from "../hooks/use-meals";

interface RecipeManagerProps {
  token: string;
}

export function RecipeManager({ token }: RecipeManagerProps) {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, refreshRecipes } =
    useRecipes(token);
  const { ingredients, refreshIngredients } = useIngredients(token);
  const { meals, refreshMeals } = useMeals(token);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterTime, setFilterTime] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    servings: "",
    prepTime: "",
    cookTime: "",
    ingredients: [] as Array<{ ingredientId: string; quantity: number }>,
  });

  useEffect(() => {
    refreshRecipes();
    refreshIngredients();
    refreshMeals();
  }, [refreshRecipes, refreshIngredients, refreshMeals]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      instructions: "",
      servings: "",
      prepTime: "",
      cookTime: "",
      ingredients: [],
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      servings: Number.parseInt(formData.servings),
      prepTime: Number.parseInt(formData.prepTime),
      cookTime: Number.parseInt(formData.cookTime),
    };

    if (editingId) {
      await updateRecipe(editingId, data);
    } else {
      await addRecipe(data);
    }

    setOpen(false);
    resetForm();
    refreshRecipes();
  };

  const handleEdit = (recipe: any) => {
    setFormData({
      name: recipe.name,
      description: recipe.description || "",
      instructions: recipe.instructions || "",
      servings: recipe.servings?.toString() || "",
      prepTime: recipe.prepTime?.toString() || "",
      cookTime: recipe.cookTime?.toString() || "",
      ingredients: recipe.ingredients || [],
    });
    setEditingId(recipe.id);
    setOpen(true);
  };

  const checkRecipeDependencies = (recipeId: string) => {
    const affectedMeals = meals.filter((meal) => meal.recipeId === recipeId);
    return { affectedMeals };
  };

  const handleDeleteClick = (recipe: any) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;

    try {
      await deleteRecipe(recipeToDelete.id);
      await refreshRecipes();
      await refreshMeals();
    } catch (error) {
      console.error("Error deleting recipe:", error);
    } finally {
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
    }
  };

  const addIngredientToRecipe = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: "", quantity: 0 }],
    }));
  };

  const updateRecipeIngredient = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const removeRecipeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((ing) => ing.id === ingredientId);
    return ingredient ? `${ingredient.name} (${ingredient.unit})` : "Unknown";
  };

  // Filtered and sorted recipes
  const filteredAndSortedRecipes = useMemo(() => {
    const filtered = recipes.filter((recipe) => {
      // Search filter
      const matchesSearch =
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipe.description &&
          recipe.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Time filter
      let matchesTime = true;
      if (filterTime !== "all") {
        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
        switch (filterTime) {
          case "quick":
            matchesTime = totalTime <= 30;
            break;
          case "medium":
            matchesTime = totalTime > 30 && totalTime <= 60;
            break;
          case "long":
            matchesTime = totalTime > 60;
            break;
        }
      }

      return matchesSearch && matchesTime;
    });

    // Sort recipes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "servings":
          return (b.servings || 0) - (a.servings || 0);
        case "prepTime":
          return (a.prepTime || 0) - (b.prepTime || 0);
        case "totalTime":
          const totalA = (a.prepTime || 0) + (a.cookTime || 0);
          const totalB = (b.prepTime || 0) + (b.cookTime || 0);
          return totalA - totalB;
        case "ingredients":
          return (b.ingredients?.length || 0) - (a.ingredients?.length || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [recipes, searchTerm, sortBy, filterTime]);

  const dependencies = recipeToDelete
    ? checkRecipeDependencies(recipeToDelete.id)
    : { affectedMeals: [] };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-brown-900">Recipes</h2>
          <p className="text-bakery-700">Create and manage your recipes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Recipe</DialogTitle>
              <DialogDescription>
                {editingId ? "Update" : "Create a new"} recipe with ingredients
                and instructions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Recipe Name</Label>
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
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={formData.servings}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        servings: e.target.value,
                      }))
                    }
                    className="focus:ring-pink-400 focus:border-pink-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={formData.prepTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prepTime: e.target.value,
                      }))
                    }
                    className="focus:ring-pink-400 focus:border-pink-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cookTime">Cook Time (minutes)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    value={formData.cookTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cookTime: e.target.value,
                      }))
                    }
                    className="focus:ring-pink-400 focus:border-pink-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="focus:ring-pink-400 focus:border-pink-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  rows={4}
                  className="focus:ring-pink-400 focus:border-pink-400"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Ingredients</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredientToRecipe}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ingredient
                  </Button>
                </div>

                {formData.ingredients.map((recipeIng, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select
                        value={recipeIng.ingredientId}
                        onValueChange={(value) =>
                          updateRecipeIngredient(index, "ingredientId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Qty"
                        value={recipeIng.quantity}
                        onChange={(e) =>
                          updateRecipeIngredient(
                            index,
                            "quantity",
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        className="focus:ring-pink-400 focus:border-pink-400"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRecipeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
              >
                {editingId ? "Update" : "Create"} Recipe
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls - Recipe Manager Specific Design */}
      <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bakery-700 h-4 w-4" />
                <Input
                  placeholder="Search recipes by name or description..."
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
                  <SelectItem value="servings">Servings (High-Low)</SelectItem>
                  <SelectItem value="prepTime">Prep Time (Low-High)</SelectItem>
                  <SelectItem value="totalTime">
                    Total Time (Low-High)
                  </SelectItem>
                  <SelectItem value="ingredients">
                    Ingredients (Most-Least)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Filter */}
            <div className="w-full md:w-48">
              <Select value={filterTime} onValueChange={setFilterTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recipes</SelectItem>
                  <SelectItem value="quick">Quick (&lt;=30 min)</SelectItem>
                  <SelectItem value="medium">Medium (30-60 min)</SelectItem>
                  <SelectItem value="long">Long (&gt;60 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-bakery-700">
            Showing {filteredAndSortedRecipes.length} of {recipes.length}{" "}
            recipes
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-soft-pink-600">
              <AlertTriangle className="h-5 w-5 text-soft-pink-600" />
              <span>Delete Recipe</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-bakery-700">
              Are you sure you want to delete{" "}
              <strong>{recipeToDelete?.name}</strong>?
              {dependencies.affectedMeals.length > 0 && (
                <div className="bg-soft-pink-50 border border-soft-pink-200 rounded-md p-3">
              
                    🗑️ This will also delete {dependencies.affectedMeals.length}{" "}
                    planned meal(s):
                  <ul className="text-sm text-soft-pink-700 space-y-1">
                    {dependencies.affectedMeals.slice(0, 5).map((meal) => (
                      <li key={meal.id}>
                        • {meal.date} - {meal.time}
                      </li>
                    ))}
                    {dependencies.affectedMeals.length > 5 && (
                      <li>
                        • +{dependencies.affectedMeals.length - 5} more meals
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <p className="text-sm text-bakery-700">
                This action cannot be undone.
              </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedRecipes.map((recipe) => (
          <Card
            key={recipe.id}
            className="border-wheat-200 bg-bakery-50 shadow-sm"
          >
            <CardHeader>
              <CardTitle className="text-lg text-dark-brown-800">
                {recipe.name}
              </CardTitle>
              {recipe.description && (
                <CardDescription className="text-bakery-700">
                  {recipe.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {recipe.servings && (
                  <Badge className="bg-bakery-100 text-bakery-800 border-bakery-200">
                    {recipe.servings} servings
                  </Badge>
                )}
                {recipe.prepTime && (
                  <Badge className="bg-bakery-100 text-bakery-800 border-bakery-200">
                    {recipe.prepTime}min prep
                  </Badge>
                )}
                {recipe.cookTime && (
                  <Badge className="bg-bakery-100 text-bakery-800 border-bakery-200">
                    {recipe.cookTime}min cook
                  </Badge>
                )}
              </div>

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-dark-brown-800">
                    Ingredients:
                  </h4>
                  <div className="space-y-1">
                    {recipe.ingredients
                      .slice(0, 3)
                      .map((ing: any, index: number) => (
                        <div key={index} className="text-sm text-bakery-700">
                          {ing.quantity} × {getIngredientName(ing.ingredientId)}
                        </div>
                      ))}
                    {recipe.ingredients.length > 3 && (
                      <div className="text-xs text-bakery-700">
                        +{recipe.ingredients.length - 3} more ingredients
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(recipe)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(recipe)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedRecipes.length === 0 && recipes.length > 0 && (
        <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-bakery-700 mb-4" />
            <h3 className="text-lg font-medium text-dark-brown-900 mb-2">
              No recipes match your filters
            </h3>
            <p className="text-bakery-700 text-center mb-4">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setFilterTime("all");
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {recipes.length === 0 && (
        <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-bakery-700 mb-4" />
            <h3 className="text-lg font-medium text-dark-brown-900 mb-2">
              No recipes yet
            </h3>
            <p className="text-bakery-700 text-center mb-4">
              Create your first recipe to start meal planning.
            </p>
            <Button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Recipe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
