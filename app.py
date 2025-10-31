# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import os
import base64
from io import BytesIO
from dotenv import load_dotenv
from werkzeug.security import check_password_hash
# Import the functions from your database.py file
from database import init_db, add_user, get_user

load_dotenv()
app = Flask(__name__)
CORS(app)

# MODEL CONFIGURATION 
try:
    MODEL_PATH = "rafdb_cnn_model.h5"
    model = tf.keras.models.load_model(MODEL_PATH)
    print(" Model loaded successfully!")
except Exception as e:
    print(f" Error loading model: {e}")
    model = None

class_labels = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]

# --- SPOTIFY API CONFIGURATION ---
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)) if CLIENT_ID and CLIENT_SECRET else None
if sp:
    print(" Authenticated with Spotify successfully!")
else:
    print(" Spotify credentials not found. Recommendations will not work.")

emotion_genre_map = {
    "happy": "pop", "sad": "acoustic", "angry": "rock", "fear": "ambient",
    "neutral": "classical", "surprise": "electronic", "disgust": "metal"
}

# AUTHENTICATION ENDPOINTS 
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Use the add_user function from database.py
    if add_user(username, password):
        return jsonify({"message": "Registration successful!"}), 201
    else:
        return jsonify({"error": "Username already exists"}), 409

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Use the get_user function from database.py
    user = get_user(username)
    
    # Check password against the stored hash
    if user and check_password_hash(user['password_hash'], password):
        return jsonify({"message": "Login successful!"})
    else:
        return jsonify({"error": "Invalid username or password"}), 401

# CORE APP ENDPOINTS 
@app.route("/detect-emotion", methods=["POST"])
def detect_emotion():
    if not model:
        return jsonify({"error": "Model is not loaded"}), 500

    image_data = None
    # Handle both file upload and base64 JSON from camera
    if 'image' in request.files:
        image_data = request.files['image'].read()
    elif request.is_json and 'image' in request.json:
        base64_str = request.json['image'].split(',')[1]
        image_data = base64.b64decode(base64_str)
    
    if not image_data:
        return jsonify({"error": "No image data provided"}), 400

    try:
        image = Image.open(BytesIO(image_data)).convert("L").resize((48, 48))
        image_array = np.expand_dims(np.array(image) / 255.0, axis=(0, -1))
        prediction = model.predict(image_array)
        emotion_idx = np.argmax(prediction)
        return jsonify({
            "emotion": class_labels[emotion_idx],
            "confidence": float(prediction[0][emotion_idx])
        })
    except Exception as e:
        return jsonify({"error": f"Processing failed: {e}"}), 500

@app.route("/recommendations/<emotion>/<language>", methods=["GET"])
def recommendations(emotion, language):
    if not sp:
        return jsonify({"error": "Spotify service not available"}), 500
    try:
        lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu"}
        market_map = {"en": "US", "hi": "IN", "ta": "IN", "te": "IN"}
        lang_name = lang_map.get(language, "English")
        market = market_map.get(language, "US")
        genre = emotion_genre_map.get(emotion.lower(), "pop")
        query = f"{lang_name} songs genre:{genre}"
        results = sp.search(q=query, type="track", limit=10, market=market)
        music_list = [{"name": t["name"], "artist": t["artists"][0]["name"], "spotify_url": t["external_urls"]["spotify"], "embed_url": f"https://open.spotify.com/embed/track/{t['id']}"} for t in results["tracks"]["items"]]
        return jsonify({"genre": genre, "tracks": music_list})
    except Exception as e:
        return jsonify({"error": f"Spotify error: {e}"}), 500

#  RUN THE APPLICATION 
if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)


