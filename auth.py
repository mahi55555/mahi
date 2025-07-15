from bottle import request, response
from utils.json_os import read_json, write_json
from utils.crypto import hash_password, verify_password, generate_token
import uuid

USER_FILE = "data/users.json"

# --- Signup ---
def signup():
    user = request.json
    if not user:
        response.status = 400
        return {"success": False, "message": "Invalid JSON body"}

    required = ["name", "email", "password"]
    if not all(k in user and user[k].strip() for k in required):
        response.status = 400
        return {"success": False, "message": "Name, email, and password are required"}

    users = read_json(USER_FILE)
    if any(u["email"].lower() == user["email"].lower() for u in users):
        response.status = 400
        return {"success": False, "message": "Email already registered"}

    new_user = {
        "id": str(uuid.uuid4()),
        "name": user["name"].strip(),
        "email": user["email"].strip().lower(),
        "password": hash_password(user["password"].strip())
    }

    users.append(new_user)
    write_json(USER_FILE, users)

    return {"success": True, "message": "Signup successful"}

# --- Login ---
def login():
    creds = request.json
    if not creds:
        response.status = 400
        return {"success": False, "message": "Invalid JSON body"}

    if "email" not in creds or "password" not in creds:
        response.status = 400
        return {"success": False, "message": "Email and password required"}

    users = read_json(USER_FILE)
    user = next((u for u in users if u["email"].lower() == creds["email"].strip().lower()), None)

    if not user or not verify_password(creds["password"].strip(), user["password"]):
        response.status = 401
        return {"success": False, "message": "Invalid email or password"}

    token = generate_token(user["id"])
    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "name": user["name"]
    }

# --- update forgot Password ---    
def forgot_password():
    data = request.json
    if not data:
        response.status = 400
        return {"success": False, "message": "Invalid JSON body"}

    required = ["email", "new_password"]
    if not all(k in data and data[k].strip() for k in required):
        response.status = 400
        return {"success": False, "message": "Email and new password are required"}

    users = read_json(USER_FILE)
    user = next((u for u in users if u["email"].lower() == data["email"].strip().lower()), None)

    if not user:
        response.status = 404
        return {"success": False, "message": "User not found"}

    user["password"] = hash_password(data["new_password"].strip())
    write_json(USER_FILE, users)

    return {"success": True, "message": "Password updated successfully"}
