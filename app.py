from bottle import Bottle, run, request, response, abort
from routes import home, auth, ingredients, recipes, meals
from utils.crypto import extract_user_id  

app = Bottle()

# Public Routes
PUBLIC_ROUTES = [
    "/", 
    "/api/signup", 
    "/api/login",
    "/api/forgot-password"
]

# --- Auth Middleware Route ---
@app.hook('before_request')
def protect_routes():
    path = request.path
    if path in PUBLIC_ROUTES:
        return

    token = request.headers.get('Authorization')
    user_id = extract_user_id(token)

    if not token or not user_id:
        abort(401, {"success": False, "message": "Unauthorized: Missing or invalid token"})
    request.user_id = user_id

# --- Public Routes ---
app.get("/")(home.home)

# Auth Routes
app.get("/api/signup")(lambda: {"message": "Use POST to Sign Up"})
app.get("/api/login")(lambda: {"message": "Use POST to Log In"})
app.get("/api/forgot-password")(lambda: {"message": "Use POST to Reset Password"})
app.post("/api/signup")(auth.signup)
app.post("/api/login")(auth.login)
app.post("/api/forgot-password")(auth.forgot_password)
# --- Protected Routes ---

# Ingredient Routes
app.post("/api/ingredients")(ingredients.add_ingredient)
app.get("/api/ingredients/<id>")(ingredients.get_ingredient)
app.get("/api/ingredients")(ingredients.get_ingredients)
app.put("/api/ingredients/<id>")(ingredients.update_ingredient)
app.delete("/api/ingredients/<id>")(ingredients.delete_ingredient)
app.get("/api/ingredients/low-stock")(ingredients.get_low_stock_ingredients)
app.get("/api/ingredients/expired")(ingredients.get_expired_ingredients)

# Recipe Routes
app.post("/api/recipes")(recipes.add_recipe)
app.get("/api/recipes/<id>")(recipes.get_recipe)
app.get("/api/recipes")(recipes.get_recipes)
app.put("/api/recipes/<id>")(recipes.update_recipe)
app.delete("/api/recipes/<id>")(recipes.delete_recipe)

# Meal Routes
app.post("/api/meals")(meals.add_meal)              
app.get("/api/meals/<meal_id>")(meals.get_meal)     
app.get("/api/meals")(meals.get_meals)              
app.put("/api/meals/<meal_id>")(meals.update_meal)  
app.put("/api/meals/<meal_id>/done")(meals.mark_meal_done)
app.delete("/api/meals/<meal_id>")(meals.delete_meal)

# --- CORS Hook ---
@app.hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, Authorization'

# --- CORS Preflight Handler ---
@app.route('/<:re:.*>', method='OPTIONS')
def options_handler():
    response.status = 200
    return ""

# --- Run Server ---
if __name__ == "__main__":
    run(app, host='localhost', port=8000, debug=True, reloader=True)
