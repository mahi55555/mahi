from bottle import request, response
from utils.json_os import read_json, write_json
import uuid
from datetime import datetime

# --- Constants ---
MEAL_FILE = "data/meals.json"
RECIPE_FILE = "data/recipes.json"
INGREDIENT_FILE = "data/ingredients.json"

# --- Composite Helpers ---
def get_user_recipe(user_id, recipe_id):
    recipes = read_json(RECIPE_FILE)
    return next((r for r in recipes if r["id"] == recipe_id and r["userId"] == user_id), None)

def get_user_ingredients(user_id):
    return [i for i in read_json(INGREDIENT_FILE) if i["userId"] == user_id]

def get_user_ingredient_map(user_id):
    return {i["id"]: i for i in get_user_ingredients(user_id)}

def save_ingredients(all_ingredients, updated_map, user_id):
    new_data = []
    for ing in all_ingredients:
        if ing["userId"] == user_id and ing["id"] in updated_map:
            new_data.append(updated_map[ing["id"]])
        else:
            new_data.append(ing)
    write_json(INGREDIENT_FILE, new_data)

def remove_meals_with_recipes(user_id, recipe_ids):
    meals = read_json(MEAL_FILE)
    new_meals = [m for m in meals if not (m["userId"] == user_id and m["recipeId"] in recipe_ids)]
    write_json(MEAL_FILE, new_meals)

def remove_meals_with_recipe(user_id, recipe_id):
    remove_meals_with_recipes(user_id, [recipe_id])


# --- Ingredient Management ---
def validate_and_deduct_ingredients(user_id, recipe_id):
    recipe = get_user_recipe(user_id, recipe_id)
    if not recipe:
        return False, "Recipe not found"

    all_ingredients = read_json(INGREDIENT_FILE)
    user_ing_map = get_user_ingredient_map(user_id)

    for ri in recipe["ingredients"]:
        ing = user_ing_map.get(ri["ingredientId"])
        if not ing:
            return False, f"Missing ingredient: {ri['ingredientId']}"
        if ing["quantity"] < ri["quantity"]:
            return False, f"Not enough {ing['name']} (required {ri['quantity']}, available {ing['quantity']})"

    for ri in recipe["ingredients"]:
        user_ing_map[ri["ingredientId"]]["quantity"] -= ri["quantity"]

    save_ingredients(all_ingredients, user_ing_map, user_id)
    return True, None

def restore_ingredients(user_id, recipe_id):
    recipe = get_user_recipe(user_id, recipe_id)
    if not recipe:
        return

    all_ingredients = read_json(INGREDIENT_FILE)
    user_ing_map = get_user_ingredient_map(user_id)

    for ri in recipe["ingredients"]:
        if ri["ingredientId"] in user_ing_map:
            user_ing_map[ri["ingredientId"]]["quantity"] += ri["quantity"]

    save_ingredients(all_ingredients, user_ing_map, user_id)

# --- Routes ---
def add_meal():
    user_id = request.user_id
    body = request.json
    date = body.get("date")
    time = body.get("time", "").strip().lower()
    recipe_id = body.get("recipeId")

    if not (date and time and recipe_id):
        response.status = 400
        return {"success": False, "message": "Missing fields (date, time, recipeId)"}

    valid, error = validate_and_deduct_ingredients(user_id, recipe_id)
    if not valid:
        response.status = 400
        return {"success": False, "message": error}

    meals = read_json(MEAL_FILE)
    if any(m["date"] == date and m["time"] == time and m["userId"] == user_id for m in meals):
        response.status = 400
        return {"success": False, "message": f"Meal already exists for {time} on {date}"}

    meal_id = f"meal{uuid.uuid4().hex[:8]}"
    new_meal = {
        "id": meal_id,
        "userId": user_id,
        "date": date,
        "time": time,
        "recipeId": recipe_id,
        "done": False
    }

    meals.append(new_meal)
    write_json(MEAL_FILE, meals)
    response.status = 201
    return {"success": True, "message": "Meal added", "mealId": meal_id, "data": new_meal}

def get_meals():
    user_id = request.user_id
    meals = [m for m in read_json(MEAL_FILE) if m["userId"] == user_id]
    return {"success": True, "data": meals}

def get_meal(meal_id):
    user_id = request.user_id
    meals = read_json(MEAL_FILE)
    meal = next((m for m in meals if m["id"] == meal_id and m["userId"] == user_id), None)

    if not meal:
        response.status = 404
        return {"success": False, "message": "Meal not found"}
    return {"success": True, "data": meal}

def update_meal(meal_id):
    user_id = request.user_id
    updates = request.json
    new_recipe_id = updates.get("recipeId")

    if not new_recipe_id:
        response.status = 400
        return {"success": False, "message": "Missing recipeId"}

    meals = read_json(MEAL_FILE)
    for meal in meals:
        if meal["id"] == meal_id and meal["userId"] == user_id:
            # Restore old ingredients if not done
            if not meal.get("done"):
                restore_ingredients(user_id, meal["recipeId"])

            valid, error = validate_and_deduct_ingredients(user_id, new_recipe_id)
            if not valid:
                response.status = 400
                return {"success": False, "message": error}

            meal["recipeId"] = new_recipe_id
            write_json(MEAL_FILE, meals)
            return {"success": True, "message": "Meal updated", "data": meal}

    response.status = 404
    return {"success": False, "message": "Meal not found"}

def mark_meal_done(meal_id):
    user_id = request.user_id
    meals = read_json(MEAL_FILE)
    for meal in meals:
        if meal["id"] == meal_id and meal["userId"] == user_id:
            meal["done"] = True
            write_json(MEAL_FILE, meals)
            return {"success": True, "message": "Meal marked as done"}

    response.status = 404
    return {"success": False, "message": "Meal not found"}

def delete_meal(meal_id):
    user_id = request.user_id
    meals = read_json(MEAL_FILE)
    for i, meal in enumerate(meals):
        if meal["id"] == meal_id and meal["userId"] == user_id:
            if not meal.get("done"):
                restore_ingredients(user_id, meal["recipeId"])
            meals.pop(i)
            write_json(MEAL_FILE, meals)
            return {"success": True, "message": "Meal deleted"}

    response.status = 404
    return {"success": False, "message": "Meal not found"}