import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [screen, setScreen] = useState('main'); // 'main', 'trick', 'treat'
  const [knockPattern, setKnockPattern] = useState([]);
  const [knockIndex, setKnockIndex] = useState(0);
  const [lastKnockTime, setLastKnockTime] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);

  const videoRef = useRef(null);
  const secretPattern = [1, 1, 1, 2, 2]; // 3 quick knocks, pause, 2 knocks
  const videoFiles = ['download.MP4', 'the.MP4'];

  const handleTrick = () => {
    setScreen('trick');
    const randomVideo = videoFiles[Math.floor(Math.random() * videoFiles.length)];

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = `/${randomVideo}`;

        // Detect mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        videoRef.current.muted = isMobile;
        setIsMuted(isMobile);

        videoRef.current.load();
        videoRef.current.play().catch(e => {
          // If fails, try muted
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(err => console.error('Playback failed:', err));
        });
      }
    }, 100);
  };

  const handleTreat = () => {
    setScreen('treat');
    resetKnockGame();
  };

  const goBack = () => {
    setScreen('main');
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
  };

  const registerKnock = () => {
    const currentTime = Date.now();
    const timeSinceLastKnock = currentTime - lastKnockTime;

    let knockType;
    if (knockIndex < 3) {
      knockType = 1; // Quick knock
    } else {
      knockType = timeSinceLastKnock > 600 ? 2 : 1; // After pause
    }

    const newPattern = [...knockPattern, knockType];
    setKnockPattern(newPattern);
    setLastKnockTime(currentTime);
    setKnockIndex(knockIndex + 1);

    // Check pattern when complete
    if (newPattern.length === 5) {
      const isCorrect = newPattern.every((val, index) => val === secretPattern[index]);
      if (isCorrect) {
        setShowSuccess(true);
        createCandyRain();
      } else {
        // Wrong pattern - shake and reset
        setTimeout(resetKnockGame, 1000);
      }
    }
  };

  const resetKnockGame = () => {
    setKnockPattern([]);
    setKnockIndex(0);
    setLastKnockTime(Date.now());
    setShowSuccess(false);
  };

  const createCandyRain = () => {
    const candies = ['🍬', '🍭', '🍫', '🍪', '🍩', '🧁'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(container);

    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const candy = document.createElement('div');
        candy.textContent = candies[Math.floor(Math.random() * candies.length)];
        candy.style.cssText = `
          position:absolute;
          left:${Math.random() * 100}%;
          top:-50px;
          font-size:${20 + Math.random() * 20}px;
          animation: fall ${2 + Math.random()}s linear forwards;
        `;
        container.appendChild(candy);

        setTimeout(() => candy.remove(), 3000);
      }, i * 100);
    }

    setTimeout(() => container.remove(), 3500);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  return (
    <div className="container">
      {/* Main Screen */}
      {screen === 'main' && (
        <div className="main-screen">
          <h1>🎃 TRICK OR TREAT? 🎃</h1>
          <div className="buttons">
            <button className="btn btn-trick" onClick={handleTrick}>👻 TRICK</button>
            <button className="btn btn-treat" onClick={handleTreat}>🍬 TREAT</button>
          </div>
        </div>
      )}

      {/* Scare/Trick Screen */}
      {screen === 'trick' && (
        <div className="scare-screen">
          <div className="scare-container">
            <button className="close-btn" onClick={goBack}>✕ Close</button>
            <div className="video-container">
              <video
                ref={videoRef}
                className="scare-video"
                controls
                playsInline
              />
              <div className="volume-control">
                <button className="volume-btn" onClick={toggleMute}>
                  {isMuted ? '🔇' : '🔊'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Treat/Knock Screen */}
      {screen === 'treat' && (
        <div className="knock-game">
          <h2 className="knock-text">🚪 Knock the Secret Pattern! 🚪</h2>
          <p className="knock-instructions">Knock 3 times, pause, then knock 2 times</p>

          <div className="knock-pattern">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`knock-dot ${i <= knockIndex ? 'active' : ''}`}
              />
            ))}
          </div>

          {!showSuccess ? (
            <div className="knock-area" onClick={registerKnock}>
              <p>👊 KNOCK HERE 👊</p>
            </div>
          ) : (
            <div className="success-message">
              🎉 BONUS CANDY UNLOCKED! 🎉
            </div>
          )}

          <button className="back-btn" onClick={goBack}>← Back</button>
        </div>
      )}
    </div>
  );
}

export default App;
