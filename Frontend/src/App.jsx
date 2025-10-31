import React, { useState, useRef } from 'react';
import axios from 'axios';

// STYLES COMPONENT 
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
    :root {
      --primary-color: #2e7d32;
      --bg-color: #f7f9fc;
      --card-bg: #ffffff;
      --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    body {
      margin: 0;
      font-family: 'Poppins', sans-serif;
      background-color: var(--bg-color);
    }
    .app {
      max-width: 800px;
      margin: 2rem auto;
      padding: 1rem;
      text-align: center;
    }
    header h1 { color: var(--primary-color); font-weight: 600; }
    .controls, .actions {
      margin: 1.5rem 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    button, select, input[type="file"]::file-selector-button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-family: 'Poppins', sans-serif;
      transition: background-color 0.3s ease;
    }
    button:hover, select:hover, input[type="file"]::file-selector-button:hover { background-color: #1b5e20; }
    button:disabled { background-color: #9e9e9e; cursor: not-allowed; }
    .preview {
      margin: 1rem auto;
      width: 100%;
      max-width: 480px;
      min-height: 240px;
      background-color: #e0e0e0;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .preview img, .preview video { max-width: 100%; max-height: 360px; border-radius: 12px; }
    .results { margin: 2rem 0; font-size: 1.5rem; }
    .results span { font-weight: 600; color: var(--primary-color); }
    .tracks { margin-top: 2rem; }
    .song-card { background-color: var(--card-bg); border-radius: 12px; margin: 1rem 0; box-shadow: var(--shadow); overflow: hidden; }
    .login-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .login-form { background-color: var(--card-bg); padding: 2.5rem; border-radius: 12px; box-shadow: var(--shadow); width: 100%; max-width: 400px; text-align: center; }
    .login-form h2 { color: var(--primary-color); margin-top: 0; }
    .input-group { text-align: left; margin-bottom: 1.5rem; }
    .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
    .input-group input { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; font-size: 1rem; }
    .login-button { width: 100%; padding: 14px; font-size: 1.1rem; }
    .logout-button { position: absolute; top: 1rem; right: 1rem; background-color: #f44336; }
    .logout-button:hover { background-color: #d32f2f; }
    .form-switcher { margin-top: 1.5rem; font-size: 0.9rem; }
    .form-switcher span { color: var(--primary-color); text-decoration: underline; cursor: pointer; }
  `}</style>
);

// LOGIN PAGE COMPONENT
function LoginPage({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please enter a username and password.");
      return;
    }
    onLogin(username, password);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Welcome Back!</h2>
        <p>Log in to get your music recommendations.</p>
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username"/>
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password"/>
        </div>
        <button type="submit" className="login-button">Login</button>
        <p className="form-switcher">
          Don't have an account? <span onClick={onSwitchToRegister}>Register here</span>
        </p>
      </form>
    </div>
  );
}

// REGISTER PAGE COMPONENT 
function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please enter a username and password.");
      return;
    }
    onRegister(username, password);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        <p>Sign up to start your musical journey.</p>
        <div className="input-group">
          <label htmlFor="new-username">Username</label>
          <input type="text" id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username"/>
        </div>
        <div className="input-group">
          <label htmlFor="new-password">Password</label>
          <input type="password" id="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password"/>
        </div>
        <button type="submit" className="login-button">Register</button>
        <p className="form-switcher">
          Already have an account? <span onClick={onSwitchToLogin}>Login here</span>
        </p>
      </form>
    </div>
  );
}

//EMOTION RECOMMENDER COMPONENT 
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
    } catch (err) { alert("Camera error: " + err.message); }
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

    if (file) { imageData = file; }
    else if (cameraOn) {
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
      <header><h1>Emotion-Based Music Recommender</h1></header>
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
          <button onClick={handleAnalyze} disabled={isLoading}>{isLoading ? "Processing..." : "Analyze Emotion"}</button>
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
                <iframe src={song.embed_url} width="100%" height="80" frameBorder="0" allow="encrypted-media" title={song.name}></iframe>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


//  MAIN APP CONTROLLER 
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([{ username: 'user', password: 'password' }]);
  const [currentView, setCurrentView] = useState('login'); // Can be 'login' or 'register'

  const handleLogin = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setIsAuthenticated(true);
    } else {
      alert('Invalid credentials!');
    }
  };

  const handleRegister = (username, password) => {
    if (users.some(u => u.username === username)) {
      alert('Username already exists!');
      return;
    }
    setUsers([...users, { username, password }]);
    alert('Registration successful! Please log in.');
    setCurrentView('login');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('login');
  };
  
  const renderContent = () => {
    if (isAuthenticated) {
      return <EmotionApp onLogout={handleLogout} />;
    }
    
    if (currentView === 'login') {
      return <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setCurrentView('register')} />;
    } else {
      return <RegisterPage onRegister={handleRegister} onSwitchToLogin={() => setCurrentView('login')} />;
    }
  };

  return (
    <div>
      <GlobalStyles />
      {renderContent()}
    </div>
  );
}

export default App;

