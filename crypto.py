import hashlib
import uuid

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def generate_token(user_id: str) -> str:
    return f"{user_id}:{uuid.uuid4().hex}"

def extract_user_id(token: str | None) -> str | None:
    if not token:
        return None

    # Strip 'Bearer ' prefix if present
    if token.startswith("Bearer "):
        token = token[len("Bearer "):]

    if ":" in token:
        user_id, token_part = token.split(":", 1)
        try:
            uuid.UUID(token_part)
            return user_id
        except ValueError:
            return None
    return None



