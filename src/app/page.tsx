"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Package, ChefHat } from "lucide-react";
import { AuthDialog } from "@/components/auth-dialog";
import { IngredientManager } from "@/components/ingredient-manager";
import { RecipeManager } from "@/components/recipe-manager";
import { MealPlanner } from "@/components/meal-planner";
import { useAuth } from "../hooks/use-auth";
import { useIngredients } from "../hooks/use-ingredients";
import { useMeals } from "../hooks/use-meals";

export default function BakeTrackDashboard() {
  const { user, token, logout } = useAuth();
  const { ingredients, lowStock, expired, refreshIngredients } =
    useIngredients(token);
  const { meals, refreshMeals } = useMeals(token);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (token) {
      refreshIngredients();
    }
  }, [token, refreshIngredients]);

  const refreshDashboard = async () => {
    if (!token) return;

    try {
      await Promise.all([refreshIngredients(), refreshMeals()]);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard" && token) {
      refreshDashboard();
    }
  }, [activeTab, token]);

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wheat-50 to-bakery-50 flex items-center justify-center p-4 ">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-dark-brown-900">
              BakeTrack
            </h1>
            <p className="text-bakery-700">
              Your intelligent meal planning companion
            </p>
          </div>
          <AuthDialog />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wheat-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-wheat-50 to-bakery-50 shadow-sm border-b border-wheat-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-pink-600" />
              <h1 className="text-2xl font-bold text-dark-brown-900">
                BakeTrack
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-bakery-700">
                Welcome, {user.name}
              </span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 bg-wheat-100 text-pink-700">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-pink-700 rounded-md"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="ingredients"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-pink-700 rounded-md"
            >
              Ingredients
            </TabsTrigger>
            <TabsTrigger
              value="recipes"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-pink-700 rounded-md"
            >
              Recipes
            </TabsTrigger>
            <TabsTrigger
              value="meals"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-pink-700 rounded-md"
            >
              Meal Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-brown-800">
                    Total Ingredients
                  </CardTitle>
                  <Package className="h-4 w-4 text-bakery-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-700">
                    {ingredients.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-brown-800">
                    Total Meals
                  </CardTitle>
                  <ChefHat className="h-4 w-4 text-bakery-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-700">
                    {meals.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-brown-800">
                    Low Stock
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-wheat-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-wheat-700">
                    {lowStock.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-brown-800">
                    Expired Items
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-soft-pink-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-soft-pink-600">
                    {expired.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low Stock Alert */}
              <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-dark-brown-800">
                    <AlertTriangle className="h-5 w-5 text-wheat-700" />
                    <span>Low Stock Items</span>
                  </CardTitle>
                  <CardDescription className="text-bakery-700">
                    Items running low that need restocking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lowStock.length === 0 ? (
                    <p className="text-sm text-bakery-700">
                      All ingredients are well stocked!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {lowStock.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-dark-brown-800">
                            {item.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-wheat-200 text-wheat-800 border-wheat-300"
                          >
                            {item.quantity} {item.unit}
                          </Badge>
                        </div>
                      ))}
                      {lowStock.length > 5 && (
                        <p className="text-xs text-bakery-700">
                          +{lowStock.length - 5} more items
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expired Items Alert */}
              <Card className="border-wheat-200 bg-bakery-50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-dark-brown-800">
                    <AlertTriangle className="h-5 w-5 text-soft-pink-600" />
                    <span>Expired Items</span>
                  </CardTitle>
                  <CardDescription className="text-bakery-700">
                    Items that have passed their expiry date
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {expired.length === 0 ? (
                    <p className="text-sm text-bakery-700">
                      No expired ingredients!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {expired.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-dark-brown-800">
                            {item.name}
                          </span>
                          <Badge
                            variant="destructive"
                            className="bg-soft-pink-500 text-soft-pink-50"
                          >
                            Expired {item.expiryDate}
                          </Badge>
                        </div>
                      ))}
                      {expired.length > 5 && (
                        <p className="text-xs text-bakery-700">
                          +{expired.length - 5} more items
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ingredients">
            <IngredientManager token={token} />
          </TabsContent>

          <TabsContent value="recipes">
            <RecipeManager token={token} />
          </TabsContent>

          <TabsContent value="meals">
            <MealPlanner token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
