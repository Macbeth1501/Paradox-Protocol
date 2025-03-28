import cv2
import numpy as np
import tensorflow as tf

# Emotion labels
emotion_labels = {
    0 Angry,
    1 Disgust,
    2 Fear,
    3 Happy,
    4 Neutral,
    5 Sad,
    6 Surprise
}

# Load models
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
model = tf.keras.models.load_model('model1.h5')  # Your trained model

# Open webcam
cap = cv2.VideoCapture(0)  # 0 = default camera

while True
    ret, frame = cap.read()  # Read frame
    if not ret
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)

    for (x, y, w, h) in faces
        # Draw bounding box
        cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
        
        # Extract and preprocess face
        face_roi = frame[yy+h, xx+w]
        resized_face = cv2.resize(face_roi, (224, 224))  # Match model input size
        normalized_face = resized_face  255.0  # Normalize
        input_face = np.expand_dims(normalized_face, axis=0)

        # Predict emotion
        predictions = model.predict(input_face)
        predicted_class = np.argmax(predictions)
        emotion = emotion_labels.get(predicted_class, Unknown)

        # Display emotion
        cv2.putText(frame, emotion, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    # Show output
    cv2.imshow('Emotion Detection', frame)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q')
        break

cap.release()
cv2.destroyAllWindows()