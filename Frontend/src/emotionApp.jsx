import React, { useState, useRef } from 'react';
import axios from 'axios';

function EmotionApp({ onLogout }) {
  const [emotion, setEmotion] = useState("—");
  const [confidence, setConfidence] = useState(null);
  const [songs, setSongs] = useState([]);
  const [language, setLanguage] = useState("en");
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL = "http://127.0.0.1:5000";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      if (cameraOn) stopCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraOn(true);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      alert("Camera error: " + err.message);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const handleAnalyze = async () => {
    let imageData;
    const file = fileInputRef.current?.files[0];

    if (file) {
      imageData = file;
    } else if (cameraOn) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      imageData = canvas.toDataURL('image/jpeg');
    } else {
      alert("Please upload an image or start the camera!");
      return;
    }

    setIsLoading(true);
    setEmotion("Analyzing...");
    setSongs([]);

    try {
      let emotionRes;
      if (typeof imageData === 'string') {
        emotionRes = await axios.post(`${API_URL}/detect-emotion`, { image: imageData });
      } else {
        const formData = new FormData();
        formData.append("image", imageData);
        emotionRes = await axios.post(`${API_URL}/detect-emotion`, formData);
      }
      
      const { emotion: detectedEmotion, confidence: conf } = emotionRes.data;
      setEmotion(detectedEmotion);
      setConfidence(conf);

      const songRes = await axios.get(`${API_URL}/recommendations/${detectedEmotion}/${language}`);
      setSongs(songRes.data.tracks || []);

    } catch (err) {
      console.error("Analysis error:", err);
      alert("Error processing your request. Please check the console.");
      setEmotion("Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <button onClick={onLogout} className="logout-button">Logout</button>
      <header>
        <h1>Emotion-Based Music Recommender</h1>
      </header>
      <main>
        <div className="controls">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
          <button onClick={startCamera} disabled={cameraOn}>Start Camera</button>
          <button onClick={stopCamera} disabled={!cameraOn}>Stop Camera</button>
        </div>
        <div className="preview">
          {imagePreview && <img src={imagePreview} alt="Upload Preview" />}
          <video ref={videoRef} style={{ display: cameraOn ? 'block' : 'none' }} autoPlay muted playsInline />
        </div>
        <div className="actions">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isLoading}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
          </select>
          <button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? "Processing..." : "Analyze Emotion"}
          </button>
        </div>
        <div className="results">
          <h2>Detected Emotion: <span>{emotion}</span></h2>
          {confidence !== null && <p>Confidence: <span>{(confidence * 100).toFixed(1)}%</span></p>}
        </div>
        {songs.length > 0 && (
          <div className="tracks">
            <h3>Recommended Songs</h3>
            {songs.map((song, index) => (
              <div key={index} className="song-card">
                <iframe
                  src={song.embed_url}
                  width="100%" height="80"
                  frameBorder="0" allow="encrypted-media"
                  title={song.name}
                ></iframe>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default EmotionApp;
