from bottle import request, response
import uuid
from datetime import datetime
from utils.json_os import read_json, write_json
from routes.recipes import remove_recipes_with_ingredient
from routes.meals import remove_meals_with_recipes

FILE_PATH = 'data/ingredients.json'

# --- Helpers ---
def _load_data():
    return read_json(FILE_PATH)

def _save_data(data):
    write_json(FILE_PATH, data)

def _validate_fields(ingredient):
    required = ["name", "unit", "category", "quantity", "minQuantity"]
    return [f for f in required if f not in ingredient]

def _is_expired(ingredient):
    date_str = ingredient.get("expiryDate")
    if not date_str:
        return False
    try:
        expiry = datetime.strptime(date_str, "%Y-%m-%d").date()
        return expiry < datetime.today().date()
    except Exception:
        return False

# --- CREATE ---
def add_ingredient():
    new = request.json
    if not new:
        response.status = 400
        return {"success": False, "message": "Invalid JSON"}

    missing = _validate_fields(new)
    if missing:
        response.status = 400
        return {"success": False, "message": f"Missing fields: {', '.join(missing)}"}

    user_id = request.user_id
    new_id = f"ing{uuid.uuid4().hex[:8]}"
    new.update({"id": new_id, "userId": user_id})

    data = _load_data()
    data.append(new)
    _save_data(data)

    response.status = 201
    return {"success": True, "message": "Ingredient added", "id": new_id}

# --- READ ALL ---
def get_ingredients():
    user_id = request.user_id
    data = _load_data()
    user_ingredients = [item for item in data if item.get("userId") == user_id]
    user_ingredients.sort(key=lambda x: x["name"].lower())
    return {"success": True, "data": user_ingredients}

# --- READ ONE ---
def get_ingredient(id):
    user_id = request.user_id
    data = _load_data()
    for item in data:
        if item["id"] == id and item.get("userId") == user_id:
            return {"success": True, "data": item}
    response.status = 404
    return {"success": False, "message": "Ingredient not found"}

# --- UPDATE ---
def update_ingredient(id):
    updates = request.json
    if not updates:
        response.status = 400
        return {"success": False, "message": "Invalid JSON"}

    user_id = request.user_id
    data = _load_data()
    for i, item in enumerate(data):
        if item["id"] == id and item.get("userId") == user_id:
            updates.pop("id", None)
            updates.pop("userId", None)
            data[i].update(updates)
            _save_data(data)
            return {"success": True, "message": "Ingredient updated"}

    response.status = 404
    return {"success": False, "message": "Ingredient not found or unauthorized"}

# --- DELETE ---
def delete_ingredient(id):
    user_id = request.user_id
    data = _load_data()
    new_data = [item for item in data if not (item["id"] == id and item.get("userId") == user_id)]

    if len(new_data) == len(data):
        response.status = 404
        return {"success": False, "message": "Ingredient not found or unauthorized"}

    # Remove dependent recipes and meals
    removed_recipe_ids = remove_recipes_with_ingredient(id, user_id)
    if removed_recipe_ids:
        remove_meals_with_recipes(user_id, removed_recipe_ids)

    _save_data(new_data)
    return {
        "success": True,
        "message": f"Ingredient deleted. Also removed {len(removed_recipe_ids)} recipe(s) and associated meal(s)."
    }

# --- LOW STOCK ---
def get_low_stock_ingredients():
    user_id = request.user_id
    data = _load_data()
    low_stock = [
        item for item in data
        if item.get("userId") == user_id and item.get("quantity", 0) < item.get("minQuantity", 0)
    ]
    return {"success": True, "data": low_stock}

# --- EXPIRED ---
def get_expired_ingredients():
    user_id = request.user_id
    data = _load_data()
    expired = [item for item in data if item.get("userId") == user_id and _is_expired(item)]
    return {"success": True, "data": expired}
