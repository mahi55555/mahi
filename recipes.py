from bottle import request, response
import uuid
from utils.json_os import read_json, write_json
from routes.meals import remove_meals_with_recipe

FILE_PATH = "data/recipes.json"
INGREDIENT_FILE = "data/ingredients.json"

# --- Helpers ---
def _load_recipes():
    return read_json(FILE_PATH)

def _save_recipes(data):
    write_json(FILE_PATH, data)

def _load_ingredients():
    return read_json(INGREDIENT_FILE)

def validate_ingredient_ownership(ingredients, user_id):
    all_ingredients = _load_ingredients()
    owned_keys = {(i["userId"], i["id"]) for i in all_ingredients}
    
    return [
        ing["ingredientId"]
        for ing in ingredients
        if (user_id, ing["ingredientId"]) not in owned_keys
    ]

def remove_recipes_with_ingredient(ingredient_id, user_id):
    recipes = _load_recipes()
    new_recipes = []
    removed_recipe_ids = []

    for recipe in recipes:
        if recipe.get("userId") == user_id and any(ing["ingredientId"] == ingredient_id for ing in recipe.get("ingredients", [])):
            removed_recipe_ids.append(recipe["id"])
        else:
            new_recipes.append(recipe)

    _save_recipes(new_recipes)
    return removed_recipe_ids

# --- CREATE ---
def add_recipe():
    recipe = request.json
    if not recipe:
        response.status = 400
        return {"success": False, "message": "Invalid JSON"}

    user_id = request.user_id
    unauthorized = validate_ingredient_ownership(recipe.get("ingredients", []), user_id)

    if unauthorized:
        response.status = 403
        return {
            "success": False,
            "message": f"You don't own the following ingredients: {', '.join(unauthorized)}"
        }

    recipe_id = f"rec{uuid.uuid4().hex[:8]}"
    recipe.update({"id": recipe_id, "userId": user_id})

    recipes = _load_recipes()
    recipes.append(recipe)
    _save_recipes(recipes)

    response.status = 201
    return {"success": True, "message": "Recipe added", "id": recipe_id}

# --- READ ALL ---
def get_recipes():
    user_id = request.user_id
    recipes = _load_recipes()
    user_recipes = [r for r in recipes if r.get("userId") == user_id]
    return {"success": True, "data": user_recipes}

# --- READ ONE ---
def get_recipe(id):
    user_id = request.user_id
    recipes = _load_recipes()
    for r in recipes:
        if r["id"] == id and r.get("userId") == user_id:
            return {"success": True, "data": r}
    response.status = 404
    return {"success": False, "message": "Recipe not found"}

# --- UPDATE ---
def update_recipe(id):
    updates = request.json
    if not updates:
        response.status = 400
        return {"success": False, "message": "Invalid JSON"}

    user_id = request.user_id
    recipes = _load_recipes()

    for i, r in enumerate(recipes):
        if r["id"] == id and r.get("userId") == user_id:
            unauthorized = validate_ingredient_ownership(updates.get("ingredients", []), user_id)
            if unauthorized:
                response.status = 403
                return {
                    "success": False,
                    "message": f"You don't own the following ingredients: {', '.join(unauthorized)}"
                    }

            updates.pop("id", None)
            updates.pop("userId", None)
            recipes[i].update(updates)
            _save_recipes(recipes)
            return {"success": True, "message": "Recipe updated"}

    response.status = 404
    return {"success": False, "message": "Recipe not found or unauthorized"}

# --- DELETE ---
def delete_recipe(id):
    user_id = request.user_id
    recipes = _load_recipes()
    new_recipes = [r for r in recipes if not (r["id"] == id and r["userId"] == user_id)]

    if len(new_recipes) == len(recipes):
        response.status = 404
        return {"success": False, "message": "Recipe not found or unauthorized"}

    _save_recipes(new_recipes)

    # Also delete meals using this recipe
    remove_meals_with_recipe(user_id, id)

    return {"success": True, "message": "Recipe and associated meals deleted"}