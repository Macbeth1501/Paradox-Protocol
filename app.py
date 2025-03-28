import cv2
import numpy as np
import tensorflow as tf
import base64
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Emotion labels
emotion_labels = {
    0: "Angry",
    1: "Disgust",
    2: "Fear",
    3: "Happy",
    4: "Neutral",
    5: "Sad",
    6: "Surprise"
}

# Load models
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
model = tf.keras.models.load_model('model1.h5')  # Your trained model

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect_emotion', methods=['POST'])
def detect_emotion():
    try:
        # Get the base64 frame from the request
        data = request.get_json()
        if not data or 'frame' not in data:
            return jsonify({'error': 'No frame provided'}), 400

        # Decode base64 frame
        frame_data = data['frame'].split(',')[1]  # Remove "data:image/jpeg;base64," prefix
        frame_bytes = base64.b64decode(frame_data)
        np_arr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)

        if len(faces) == 0:
            return jsonify({'emotion': 'No face detected', 'confidence': 0.0})

        # Process the first detected face
        (x, y, w, h) = faces[0]
        face_roi = frame[y:y+h, x:x+w]
        resized_face = cv2.resize(face_roi, (224, 224))  # Match model input size
        normalized_face = resized_face / 255.0  # Normalize
        input_face = np.expand_dims(normalized_face, axis=0)

        # Predict emotion
        predictions = model.predict(input_face)
        predicted_class = np.argmax(predictions)
        confidence = float(predictions[0][predicted_class])
        emotion = emotion_labels.get(predicted_class, "Unknown")

        return jsonify({'emotion': emotion, 'confidence': confidence})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)