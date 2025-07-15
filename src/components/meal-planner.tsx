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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Calendar,
  Check,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMeals } from "../hooks/use-meals";
import { useRecipes } from "../hooks/use-recipes";
import { useIngredients } from "../hooks/use-ingredients";

interface MealPlannerProps {
  token: string;
}

// Helper to format date for display
const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Helper to get the first day of the month
const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Helper to get the number of days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// NEW HELPER: Formats a Date object to YYYY-MM-DD string using local date components
const toYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function MealPlanner({ token }: MealPlannerProps) {
  const { meals, addMeal, updateMeal, deleteMeal, markMealDone, refreshMeals } =
    useMeals(token);
  const { recipes, refreshRecipes } = useRecipes(token);
  const { ingredients, refreshIngredients } = useIngredients(token);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar state for monthly view
  const [currentMonth, setCurrentMonth] = useState(
    getFirstDayOfMonth(new Date())
  );

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date"); // Default sort by date for calendar view
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTime, setFilterTime] = useState("all");

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    recipeId: "",
  });

  useEffect(() => {
    refreshMeals();
    refreshRecipes();
    refreshIngredients();
  }, [refreshMeals, refreshRecipes, refreshIngredients]);

  const resetForm = () => {
    setFormData({
      date: "",
      time: "",
      recipeId: "",
    });
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (editingId) {
        // When editing, send all relevant fields
        result = await updateMeal(editingId, {
          date: formData.date,
          time: formData.time,
          recipeId: formData.recipeId,
        });
      } else {
        result = await addMeal(formData);
      }

      if (result && !result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      setOpen(false);
      resetForm();
      await refreshMeals();
      await refreshIngredients();
    } catch (error) {
      console.error("Error saving meal:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (meal: any) => {
    setFormData({
      date: meal.date,
      time: meal.time,
      recipeId: meal.recipeId,
    });
    setEditingId(meal.id);
    setError(null);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this meal?")) {
      try {
        await deleteMeal(id);
        await refreshMeals();
        await refreshIngredients();
      } catch (error) {
        console.error("Error deleting meal:", error);
      }
    }
  };

  const handleMarkDone = async (id: string) => {
    try {
      await markMealDone(id);
      await refreshMeals();
    } catch (error) {
      console.error("Error marking meal as done:", error);
    }
  };

  const getRecipeName = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    return recipe ? recipe.name : "Unknown Recipe";
  };

  const getRecipeIngredients = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    return recipe?.ingredients || [];
  };

  const checkIngredientAvailability = (recipeId: string) => {
    if (!recipeId) return { canMake: true, issues: [] };

    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe || !recipe.ingredients) return { canMake: true, issues: [] };

    const issues: string[] = [];

    recipe.ingredients.forEach((recipeIng: any) => {
      const ingredient = ingredients.find(
        (ing) => ing.id === recipeIng.ingredientId
      );
      if (!ingredient) {
        issues.push(`Missing ingredient: ${recipeIng.ingredientId}`);
      } else if (ingredient.quantity < recipeIng.quantity) {
        issues.push(
          `Not enough ${ingredient.name} (required ${recipeIng.quantity}, available ${ingredient.quantity})`
        );
      }
    });

    return { canMake: issues.length === 0, issues };
  };

  const availabilityCheck = checkIngredientAvailability(formData.recipeId);

  // Filtered and sorted meals
  const filteredAndSortedMeals = useMemo(() => {
    const filtered = meals.filter((meal) => {
      // Search filter
      const recipeName = getRecipeName(meal.recipeId);
      const matchesSearch =
        recipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.time.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.date.includes(searchTerm);

      // Status filter
      let matchesStatus = true;
      if (filterStatus !== "all") {
        switch (filterStatus) {
          case "completed":
            matchesStatus = meal.done;
            break;
          case "pending":
            matchesStatus = !meal.done;
            break;
        }
      }

      // Time filter
      let matchesTime = true;
      if (filterTime !== "all") {
        matchesTime = meal.time === filterTime;
      }

      return matchesSearch && matchesStatus && matchesTime;
    });

    // Sort meals (primarily by date, then time)
    filtered.sort((a, b) => {
      const dateCompare =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare === 0) {
        const timeOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
        return (
          (timeOrder[a.time as keyof typeof timeOrder] || 5) -
          (timeOrder[b.time as keyof typeof timeOrder] || 5)
        );
      }
      return dateCompare;
    });

    return filtered;
  }, [meals, searchTerm, sortBy, filterStatus, filterTime, recipes]);

  // Monthly calendar view logic
  const getMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();

    const days = [];

    // Add leading empty cells for days before the 1st of the month (Sunday is 0, Monday is 1)
    const startDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday...
    const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Adjust to make Monday the first day of the week (offset 0)

    for (let i = 0; i < offset; i++) {
      days.push(null); // Placeholder for empty cells
    }

    // Add days of the current month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }

    // Add trailing empty cells to fill the last week
    const remainingCells = 7 - (days.length % 7);
    if (remainingCells < 7) {
      // Only add if not a full week already
      for (let i = 0; i < remainingCells; i++) {
        days.push(null);
      }
    }

    return days;
  };

  const monthDays = getMonthDays(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const getMealsForDay = (date: Date | null) => {
    // Updated to accept null
    if (!date) return [];
    // Use the new toYYYYMMDD helper for consistent local date string comparison
    const dateString = toYYYYMMDD(date);
    return filteredAndSortedMeals.filter((meal) => meal.date === dateString);
  };

  const currentMonthDisplay = currentMonth.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-brown-900">
            Meal Planner
          </h2>
          <p className="text-bakery-700">
            Plan your meals and track your cooking
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Plan Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Plan"} Meal</DialogTitle>
              <DialogDescription>
                {editingId ? "Update" : "Schedule a new"} meal for your
                calendar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                  className="focus:ring-pink-400 focus:border-pink-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Meal Time</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, time: value }))
                  }
                >
                  <SelectTrigger className="focus:ring-pink-400 focus:border-pink-400">
                    <SelectValue placeholder="Select meal time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe">Recipe</Label>
                <Select
                  value={formData.recipeId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, recipeId: value }))
                  }
                >
                  <SelectTrigger className="focus:ring-pink-400 focus:border-pink-400">
                    <SelectValue placeholder="Select recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.recipeId && !availabilityCheck.canMake && (
                <Alert className="bg-wheat-50 border-wheat-200 text-wheat-800">
                  <AlertTriangle className="h-4 w-4 text-wheat-700" />
                  <AlertDescription className="text-wheat-800">
                    <div className="font-medium mb-1">
                      Insufficient Ingredients:
                    </div>
                    <ul className="text-sm space-y-1">
                      {availabilityCheck.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {formData.recipeId && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Required Ingredients:
                  </Label>
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-bakery-100 rounded-md">
                    {getRecipeIngredients(formData.recipeId).map(
                      (recipeIng: any, index: number) => {
                        const ingredient = ingredients.find(
                          (ing) => ing.id === recipeIng.ingredientId
                        );
                        const hasEnough =
                          ingredient &&
                          ingredient.quantity >= recipeIng.quantity;

                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm"
                          >
                            <span
                              className={
                                hasEnough
                                  ? "text-dark-brown-800"
                                  : "text-soft-pink-600"
                              }
                            >
                              {ingredient?.name || "Unknown"} (
                              {recipeIng.quantity} {ingredient?.unit || ""})
                            </span>
                            <Badge
                              variant={hasEnough ? "default" : "destructive"}
                              className={
                                hasEnough
                                  ? "bg-bakery-200 text-bakery-800"
                                  : "bg-soft-pink-500 text-soft-pink-50"
                              }
                            >
                              {hasEnough
                                ? "✓"
                                : `Only ${ingredient?.quantity || 0}`}
                            </Badge>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {error && (
                <Alert className="bg-soft-pink-50 border-soft-pink-200 text-soft-pink-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-soft-pink-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
                disabled={loading || (!availabilityCheck.canMake && !editingId)}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update" : "Plan"} Meal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls - Meal Planner Specific Design */}
      <Card className="border-wheat-200 bg-wheat-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative col-span-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bakery-700 h-4 w-4" />
              <Input
                placeholder="Search meals, recipes, or dates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 focus:ring-pink-400 focus:border-pink-400"
              />
            </div>

            {/* Sort */}
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="recipe">Recipe Name</SelectItem>
                  <SelectItem value="time">Meal Time</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meals</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Filter */}
            <div>
              <Select value={filterTime} onValueChange={setFilterTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by meal time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-bakery-700">
            Showing {filteredAndSortedMeals.length} of {meals.length} meals
          </div>
        </CardContent>
      </Card>

      {/* Monthly Calendar View */}
      <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Month</span>
          </Button>
          <CardTitle className="text-lg font-semibold text-pink-700">
            {currentMonthDisplay}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Month</span>
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 text-center text-sm font-medium text-dark-brown-800 mb-2">
            {dayNames.map((dayName) => (
              <div key={dayName}>{dayName}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, index) => {
              const dayMeals = getMealsForDay(day);
              const isToday =
                day && day.toDateString() === new Date().toDateString();
              const isCurrentMonth =
                day && day.getMonth() === currentMonth.getMonth();

              return (
                <Card
                  key={index} // Use index for key as day can be null
                  className={`border-wheat-200 bg-bakery-50 shadow-sm h-32 sm:h-40 md:h-48 lg:h-56 flex flex-col ${
                    isToday
                      ? "border-pink-400 ring-1 ring-pink-400"
                      : ""
                  } ${!isCurrentMonth ? "opacity-50 bg-wheat-100" : ""}`}
                >
                  <CardHeader className="pb-1 pt-2 px-2">
                    <CardDescription
                      className={`text-center text-lg font-bold ${
                        isCurrentMonth ? "text-pink-700" : "text-bakery-400"
                      }`}
                    >
                      {day ? day.getDate() : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 p-2 flex-1 overflow-y-auto">
                    {dayMeals.length === 0
                      ? day &&
                        isCurrentMonth && (
                          <p className="text-xs text-bakery-700 text-center">
                            No meals
                          </p>
                        )
                      : dayMeals.map((meal) => (
                          <div
                            key={meal.id}
                            className={`flex flex-col p-1 rounded-md ${
                              meal.done
                                ? "bg-bakery-100 text-bakery-800"
                                : "bg-wheat-50 text-pink-800"
                            } border border-wheat-200`}
                          >
                            <span className="text-xs font-semibold capitalize">
                              {meal.time}
                            </span>
                            <span className="text-sm leading-tight text-dark-brown-800">
                              {getRecipeName(meal.recipeId)}
                            </span>
                            <div className="flex space-x-1 mt-1">
                              {!meal.done && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleMarkDone(meal.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                    <span className="sr-only">Mark Done</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleEdit(meal)}
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span className="sr-only">Edit Meal</span>
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDelete(meal.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">Delete Meal</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedMeals.length === 0 && meals.length > 0 && (
        <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-bakery-700 mb-4" />
            <h3 className="text-lg font-medium text-dark-brown-900 mb-2">
              No meals match your filters for this month
            </h3>
            <p className="text-bakery-700 text-center mb-4">
              Try adjusting your search or filter criteria, or navigate to a
              different month.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterTime("all");
                setCurrentMonth(getFirstDayOfMonth(new Date())); // Go back to current month
              }}
              variant="outline"
            >
              Clear Filters & Go to Current Month
            </Button>
          </CardContent>
        </Card>
      )}

      {meals.length === 0 && (
        <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-bakery-700 mb-4" />
            <h3 className="text-lg font-medium text-dark-brown-900 mb-2">
              No meals planned
            </h3>
            <p className="text-bakery-700 text-center mb-4">
              Start planning your meals to keep track of your cooking schedule.
            </p>
            <Button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Plan Your First Meal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
