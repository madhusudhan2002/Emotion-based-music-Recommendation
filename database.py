import sqlite3
from werkzeug.security import generate_password_hash
import os  # Import the os module

#  MODIFICATION START 
# Get the absolute path of the directory where this script (database.py) is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Create the full, absolute path for the database file
DATABASE_NAME = os.path.join(BASE_DIR, 'users.db')
# MODIFICATION END 

def get_db_connection():
    """Establishes a connection to the database."""
    # This now uses the full, absolute path to your database file
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database and creates the 'users' table if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print(f" Database initialized successfully at {DATABASE_NAME}")

def add_user(username, password):
    """Adds a new user to the database with a hashed password."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if username already exists
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        conn.close()
        return False  # User already exists

    # Hash the password for security
    password_hash = generate_password_hash(password)
    cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash))
    
    conn.commit()
    conn.close()
    return True  # User successfully added

def get_user(username):
    """Retrieves a user by their username."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user

