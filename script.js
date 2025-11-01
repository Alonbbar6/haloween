// DOM Elements
const mainScreen = document.getElementById('mainScreen');
const scareScreen = document.getElementById('scareScreen');
const treatScreen = document.getElementById('treatScreen');
const trickBtn = document.getElementById('trickBtn');
const treatBtn = document.getElementById('treatBtn');
const closeScareBtn = document.getElementById('closeScareBtn');
const backBtn = document.getElementById('backBtn');
const knockArea = document.getElementById('knockArea');
const successMessage = document.getElementById('successMessage');
const scareVideo = document.getElementById('scareVideo');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');

// List of video files (using the actual filenames in the project)
const videoFiles = [
    'download.MP4',  // Using the actual filename from your directory listing
    'the.MP4'
];

// Function to get the correct URL for a video file
function getVideoUrl(filename) {
    // Encode the filename for URLs, replacing spaces with %20
    const encodedName = encodeURIComponent(filename);
    // If the server adds a leading slash, we need to handle that
    if (window.location.hostname !== '') {
        return `/${encodedName}`;  // For server access
    }
    return encodedName;  // For local file access
}

// Function to check if a video exists
async function checkVideoExists(url) {
    try {
        console.log('Checking video URL:', url);
        const response = await fetch(url, { 
            method: 'HEAD',
            cache: 'no-cache' // Prevent caching issues
        });
        console.log('Response status for', url, ':', response.status, response.statusText);
        return response.ok;
    } catch (e) {
        console.error(`Error checking video ${url}:`, e);
        return false;
    }
}

// Safari detection
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Set initial volume
let isMuted = false;
let lastVolume = 1.0; // Set to max volume by default

// Volume control event listeners
if (muteBtn && volumeSlider) {
    // Set initial volume
    if (scareVideo) {
        scareVideo.volume = lastVolume;
        volumeSlider.value = lastVolume;
    }

    // Mute/Unmute button
    muteBtn.addEventListener('click', () => {
        if (!scareVideo) return;
        
        isMuted = !isMuted;
        scareVideo.muted = isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        
        // Restore previous volume when unmuting
        if (!isMuted) {
            scareVideo.volume = lastVolume || 0.7;
            volumeSlider.value = lastVolume || 0.7;
        } else {
            lastVolume = scareVideo.volume;
            volumeSlider.value = 0;
        }
    });

    // Volume slider
    volumeSlider.addEventListener('input', (e) => {
        if (!scareVideo) return;
        
        const volume = parseFloat(e.target.value);
        scareVideo.volume = volume;
        
        // Update mute state based on volume
        if (volume === 0) {
            isMuted = true;
            scareVideo.muted = true;
            muteBtn.textContent = '🔇';
        } else {
            isMuted = false;
            scareVideo.muted = false;
            muteBtn.textContent = '🔊';
            lastVolume = volume;
        }
    });
}

// Add touch event listeners for Safari
if (isSafari) {
    document.documentElement.style.setProperty('--safari-fix', '1');
    
    // Add touch-action to prevent double-tap zoom on buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.touchAction = 'manipulation';
    });
    
    // Ensure viewport is properly set for iOS
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(viewportMeta);
}

// Game state
let knockPattern = [];
let lastKnockTime = 0;
let knockIndex = 0;
const secretPattern = [1, 1, 1, 2, 2]; // 3 quick knocks, pause, 2 knocks

// Add both touch and click events for better mobile support
const registerKnockEvent = (e) => {
    e.preventDefault();
    registerKnock();
};

knockArea.addEventListener('click', registerKnockEvent);
knockArea.addEventListener('touchend', registerKnockEvent, { passive: false });

// Prevent default touch behavior on buttons to avoid zooming
const preventDefaultTouch = (e) => {
    e.preventDefault();
};

document.querySelectorAll('button').forEach(button => {
    button.addEventListener('touchstart', preventDefaultTouch, { passive: false });
});

// Functions
async function showTrick() {
    // Show the scare screen immediately for better UX
    mainScreen.classList.add('hidden');
    scareScreen.classList.remove('hidden');
    
    const videoElement = document.getElementById('scareVideo');
    if (!videoElement) {
        console.error('Video element not found');
        return;
    }
    
    // Show loading state
    videoElement.innerHTML = '<div class="loading">Loading spooky content... 👻</div>';
    
    try {
        // Only use local videos
        const availableVideos = [];
        
        // Check which videos exist in the videoFiles array
        for (const video of videoFiles) {
            try {
                // For local files, we'll assume they exist if they're in the array
                availableVideos.push(video);
            } catch (e) {
                console.warn(`Error with video ${video}:`, e);
            }
        }
        
        if (availableVideos.length > 0) {
            // Select a random video from available local videos
            const randomVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
            console.log('Loading local video:', randomVideo);

            // Configure video element for mobile compatibility
            videoElement.setAttribute('playsinline', '');
            videoElement.controls = true;

            // Set the video source directly on the src attribute
            videoElement.src = randomVideo;

            // Detect if mobile device
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // Start muted on mobile for autoplay to work, unmuted on desktop
            videoElement.muted = isMobile;
            videoElement.volume = 1.0;

            // Load the video
            videoElement.load();

            // Try to play
            const playPromise = videoElement.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video playing successfully');
                    // Update mute button to reflect actual state
                    if (muteBtn) {
                        muteBtn.textContent = videoElement.muted ? '🔇' : '🔊';
                        isMuted = videoElement.muted;
                    }
                    if (volumeSlider) {
                        volumeSlider.value = videoElement.muted ? 0 : 1;
                    }
                }).catch(e => {
                    console.error('Autoplay blocked, retrying muted:', e);
                    // If autoplay fails, try with muted
                    videoElement.muted = true;
                    videoElement.load();
                    videoElement.play().then(() => {
                        console.log('Video playing muted');
                        if (muteBtn) {
                            muteBtn.textContent = '🔇';
                            isMuted = true;
                        }
                    }).catch(err => {
                        console.error('Video playback completely failed:', err);
                        // Show error message
                        videoElement.innerHTML = `
                            <div style="color: white; padding: 20px; text-align: center;">
                                <p>Unable to load video 😱</p>
                                <p>Try refreshing the page</p>
                            </div>
                        `;
                    });
                });
            }
        } else {
            throw new Error('No local videos found');
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        // Fallback to a simple animation or message
        videoElement.innerHTML = `
            <div class="fallback-content" style="
                text-align: center; 
                padding: 20px; 
                color: white;
                background: rgba(0,0,0,0.7);
                border-radius: 10px;
                margin: 20px;
            ">
                <h2>👻 BOO! 👻</h2>
                <p>No spooky videos available, but here's a ghost!</p>
                <div class="ghost" style="font-size: 5em; margin: 20px 0;">👻</div>
                <button onclick="window.location.reload()" style="
                    background: #ff6b35;
                    border: none;
                    padding: 10px 20px;
                    color: white;
                    border-radius: 20px;
                    font-size: 1.2em;
                    margin-top: 20px;
                    cursor: pointer;
                ">Try Again</button>
            </div>
        `;
    }
}
    
    function setupVideoElement(videoElement, videoSrc) {
    // Clear any existing content
    videoElement.innerHTML = '';
    
    // Set up the video source
    const source = document.createElement('source');
    source.src = videoSrc;
    source.type = 'video/mp4';
    
    videoElement.appendChild(source);
    
    // Configure video properties
    videoElement.volume = 1.0;
    videoElement.muted = false;
    videoElement.controls = true; // Show controls for better UX
    videoElement.playsInline = true;
    videoElement.style.width = '100%';
    videoElement.style.maxHeight = '80vh';
    
    // When video ends, go back to main screen
    videoElement.onended = function() {
        goBack();
    };
    
    // Add a small delay to ensure video is loaded before playing
    setTimeout(() => {
        console.log('Attempting to play video:', videoElement.src);
        
        // Force video to load
        videoElement.load();
        
        // When enough data is loaded, try to play
        const onCanPlay = () => {
            console.log('Video can play, attempting playback...');
            const playPromise = videoElement.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video playback started successfully');
                }).catch(error => {
                    console.error('Error in play promise:', error);
                    showVideoError(videoElement, videoSrc);
                });
            }
        };
        
        // Set up error handling
        videoElement.onerror = (e) => {
            console.error('Video error:', videoElement.error);
            showVideoError(videoElement, videoSrc);
        };
        
        videoElement.oncanplay = onCanPlay;
        
        // Try to play after a short delay if canplay hasn't fired
        const playTimeout = setTimeout(() => {
            if (videoElement.readyState < 2) { // 2 = HAVE_CURRENT_DATA
                console.log('Video taking too long to load, trying to play anyway...');
                onCanPlay();
            }
        }, 2000);
        
        // Clean up
        videoElement.oncanplay = null;
        
    }, 500); // 500ms delay to ensure video is ready
    
    function showVideoError(element, src) {
        console.error('Showing video error for:', src);
        element.innerHTML = `
            <div style="
                text-align: center; 
                padding: 20px; 
                color: white;
                background: rgba(255,0,0,0.5);
                border-radius: 10px;
                margin: 20px;
            ">
                <p>Error playing video. <button onclick="window.location.reload()" style="
                    background: #ff6b35;
                    border: none;
                    padding: 8px 16px;
                    color: white;
                    border-radius: 15px;
                    margin-top: 10px;
                    cursor: pointer;
                ">Try Again</button></p>
                <p style="font-size: 0.8em; margin-top: 10px;">Or try a different browser</p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <a href="${src}" style="color: #4CAF50; text-decoration: none;" target="_blank">
                    Open video directly
                </a>
            </div>
        `;
    }
    
    // Add a small delay to ensure video is loaded before playing
    setTimeout(() => {
        // Try to play the video with better error handling
        const playPromise = videoElement.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Error playing video:', error);
                // Show controls and try a user-triggered play
                videoElement.controls = true;
                
                // Add a play button overlay
                const playOverlay = document.createElement('div');
                playOverlay.style.position = 'absolute';
                playOverlay.style.top = '50%';
                playOverlay.style.left = '50%';
                playOverlay.style.transform = 'translate(-50%, -50%)';
                playOverlay.style.background = 'rgba(0,0,0,0.7)';
                playOverlay.style.color = 'white';
                playOverlay.style.padding = '15px 30px';
                playOverlay.style.borderRadius = '30px';
                playOverlay.style.cursor = 'pointer';
                playOverlay.textContent = 'Tap to Play Video';
                playOverlay.onclick = () => {
                    videoElement.play().catch(e => console.error('Still cannot play:', e));
                    playOverlay.remove();
                };
                
                const videoContainer = document.querySelector('.video-container');
                if (videoContainer) {
                    videoContainer.appendChild(playOverlay);
                }
            });
        }
    }, 300); // 300ms delay to ensure video is ready
    
    // Update volume controls
    if (volumeSlider && muteBtn) {
        volumeSlider.value = isMuted ? 0 : lastVolume;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    }
}

function showTreat() {
    mainScreen.classList.add('hidden');
    treatScreen.classList.remove('hidden');

    // Reset the knock game when entering treat screen
    resetKnockGame();
}

function goBack() {
    mainScreen.classList.remove('hidden');
    scareScreen.classList.add('hidden');
    treatScreen.classList.add('hidden');

    // Pause and reset the video
    const videoElement = document.getElementById('scareVideo');
    if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
        videoElement.src = ''; // Clear source to free memory
    }
}

function registerKnock() {
    const currentTime = Date.now();
    const timeSinceLastKnock = currentTime - lastKnockTime;

    // Determine if it's a quick knock (< 600ms) or after a pause (> 600ms)
    // Type 1 = quick knock (for first 3 knocks)
    // Type 2 = knock after pause (for last 2 knocks)
    let knockType;
    if (knockIndex < 3) {
        // For first 3 knocks, they should be quick
        knockType = 1;
    } else {
        // For knocks 4 and 5, check if there was a pause before them
        knockType = (timeSinceLastKnock > 600) ? 2 : 1;
    }

    knockPattern.push(knockType);
    lastKnockTime = currentTime;

    // Light up the corresponding dot
    const dot = document.getElementById(`knock${knockIndex + 1}`);
    if (dot) {
        dot.classList.add('active');
    }

    knockIndex++;

    // Visual feedback for knock
    knockArea.style.transform = 'scale(0.95)';
    setTimeout(() => {
        knockArea.style.transform = 'scale(1)';
    }, 100);

    // Check if pattern is complete
    if (knockPattern.length === 5) {
        checkPattern();
    } else if (knockIndex >= 5) {
        // If user clicks too many times, reset
        setTimeout(resetKnockGame, 1000);
    }
}

function checkPattern() {
    const isCorrect = knockPattern.every((val, index) => val === secretPattern[index]);

    if (isCorrect) {
        showSuccess();
    } else {
        // Shake animation for wrong pattern
        knockArea.style.animation = 'shake 0.5s';
        setTimeout(() => {
            knockArea.style.animation = '';
            resetKnockGame();
        }, 1000);
    }
}

function showSuccess() {
    // Force reflow/repaint for Safari
    void knockArea.offsetHeight;
    
    // Use requestAnimationFrame for smoother transitions in Safari
    requestAnimationFrame(() => {
        knockArea.style.display = 'none';
        successMessage.classList.remove('hidden');
        createCandyRain();
    });
}

function createCandyRain() {
    const candies = ['🍬', '🍭', '🍫', '🍪', '🍩', '🧁'];
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.overflow = 'hidden';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const candy = document.createElement('div');
            candy.className = 'candy-rain';
            candy.textContent = candies[Math.floor(Math.random() * candies.length)];
            candy.style.position = 'absolute';
            candy.style.left = Math.random() * 100 + '%';
            candy.style.top = '-50px';
            candy.style.animation = `fall-${i} 3s linear forwards`;
            
            // Add keyframes dynamically for better Safari support
            const style = document.createElement('style');
            style.textContent = `
                @-webkit-keyframes fall-${i} {
                    to {
                        -webkit-transform: translateY(100vh) rotate(360deg);
                        transform: translateY(100vh) rotate(360deg);
                    }
                }
                @keyframes fall-${i} {
                    to {
                        -webkit-transform: translateY(100vh) rotate(360deg);
                        transform: translateY(100vh) rotate(360deg);
                    }
                }
            `;
            document.head.appendChild(style);
            
            container.appendChild(candy);

            // Remove candy and style after animation
            setTimeout(() => {
                candy.remove();
                style.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 3000);
        }, i * 100);
    }
}

function resetKnockGame() {
    knockPattern = [];
    knockIndex = 0;
    lastKnockTime = Date.now(); // Reset to current time
    
    // Reset dots
    document.querySelectorAll('.knock-dot').forEach(dot => {
        dot.classList.remove('active');
    });
    
    // Reset UI
    knockArea.style.display = 'block';
    successMessage.classList.add('hidden');
    knockArea.style.animation = '';
}

// Add event listeners for the buttons
trickBtn.addEventListener('click', showTrick);
treatBtn.addEventListener('click', showTreat);
closeScareBtn.addEventListener('click', goBack);
backBtn.addEventListener('click', goBack);

// Add shake animation for wrong pattern
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);
