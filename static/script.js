document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startButton = document.getElementById('startDetection');
    const emotionDisplay = document.getElementById('emotionDisplay');
    const quoteDisplay = document.getElementById('quoteDisplay');
    const ctx = canvas.getContext('2d');
    
    let stream = null;
    let isDetecting = false;
    let detectionInterval = null;
    
    // Emotion quotes database
    const emotionQuotes = {
        "Happy": [
            "Happiness is not something ready made. It comes from your own actions. - Dalai Lama",
            "The joy of life comes from our encounters with new experiences. - Christopher McCandless",
            "Happiness is when what you think, what you say, and what you do are in harmony. - Mahatma Gandhi"
        ],
        "Sad": [
            "Tears come from the heart and not from the brain. - Leonardo da Vinci",
            "The word 'happy' would lose its meaning if it were not balanced by sadness. - Carl Jung",
            "Every man has his secret sorrows which the world knows not. - Henry Wadsworth Longfellow"
        ],
        "Angry": [
            "For every minute you remain angry, you give up sixty seconds of peace of mind. - Ralph Waldo Emerson",
            "Anger is an acid that can do more harm to the vessel in which it is stored than to anything on which it is poured. - Mark Twain",
            "Speak when you are angry and you will make the best speech you will ever regret. - Ambrose Bierce"
        ],
        "Surprise": [
            "Life is full of surprises and serendipity. Being open to unexpected turns in the road is an important part of success. - Condoleezza Rice",
            "The greatest discovery of my generation is that a human being can alter his life by altering his attitudes. - William James",
            "Surprise is the greatest gift which life can grant us. - Boris Pasternak"
        ],
        "Neutral": [
            "Peace comes from within. Do not seek it without. - Buddha",
            "Calm mind brings inner strength and self-confidence. - Dalai Lama",
            "In the midst of movement and chaos, keep stillness inside of you. - Deepak Chopra"
        ],
        "Fear": [
            "The only thing we have to fear is fear itself. - Franklin D. Roosevelt",
            "Fear is the path to the dark side. Fear leads to anger, anger leads to hate, hate leads to suffering. - Yoda",
            "Fear is a reaction. Courage is a decision. - Winston Churchill"
        ],
        "Disgust": [
            "Disgust is the appropriate response to most situations. - Chuck Palahniuk",
            "The opposite of love is not hate, it's indifference. - Elie Wiesel",
            "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light. - Plato"
        ]
    };
    
    // Start camera and detection
    async function startDetection() {
        try {
            // Access camera
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 },
                    facingMode: 'user'
                } 
            });
            
            video.srcObject = stream;
            video.play();
            
            // Show video and hide canvas initially
            video.style.display = 'block';
            canvas.style.display = 'none';
            
            // Start detection loop
            isDetecting = true;
            startButton.textContent = 'Stop Detection';
            detectionInterval = setInterval(detectEmotion, 1000); // Check every second
            
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access the camera. Please ensure you've granted camera permissions.");
        }
    }
    
    // Stop camera and detection
    function stopDetection() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        isDetecting = false;
        startButton.textContent = 'Start Emotion Detection';
        clearInterval(detectionInterval);
        
        // Clear displays
        emotionDisplay.textContent = '';
        quoteDisplay.textContent = '';
        
        // Hide video and show placeholder
        video.style.display = 'none';
        canvas.style.display = 'block';
    }
    
    // Detect emotion by sending frame to server
    async function detectEmotion() {
        if (!isDetecting) return;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image
        const frame = canvas.toDataURL('image/jpeg');
        
        try {
            // Send request to server for emotion detection
            const response = await fetch('/detect_emotion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ frame: frame })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Check for errors in the response
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Display results
            if (result.emotion && result.emotion !== 'No face detected') {
                const confidence = (result.confidence * 100).toFixed(1);
                const emotion = result.emotion;
                
                emotionDisplay.innerHTML = `Detected Emotion: <span class="emotion-${emotion.toLowerCase()}">${emotion}</span> (${confidence}% confidence)`;
                
                // Display random quote for detected emotion
                const quotes = emotionQuotes[emotion] || emotionQuotes['Neutral'];
                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                quoteDisplay.textContent = randomQuote;
            } else {
                emotionDisplay.textContent = 'No face detected - please position your face in the frame';
                quoteDisplay.textContent = '';
            }
            
        } catch (err) {
            console.error('Error detecting emotion:', err);
            emotionDisplay.textContent = `Error: ${err.message}`;
            quoteDisplay.textContent = '';
        }
    }
    
    // Toggle detection
    startButton.addEventListener('click', function() {
        if (isDetecting) {
            stopDetection();
        } else {
            startDetection();
        }
    });
    
    // Clean up when page unloads
    window.addEventListener('beforeunload', function() {
        stopDetection();
    });
});