import cv2, numpy as np, os, time

def train_face():
    print("=== HARDENED FACE REGISTRATION ===")
    print("Look at the camera. We will capture 100 images.")
    print("Move your head left, right, up, and down slowly.")
    print("Starting in 3 seconds...")
    time.sleep(3)
    
    cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    
    faces = []
    ids = []
    count = 0
    target = 100
    
    while count < target:
        ret, img = cam.read()
        if not ret: break
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces_detected = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        for (x, y, w, h) in faces_detected:
            count += 1
            faces.append(gray[y:y+h, x:x+w])
            ids.append(1)
            cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(img, f"Captured: {count}/{target}", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            
        cv2.imshow("Registering Face - Move Head Slowly", img)
        if cv2.waitKey(1) & 0xFF == 27: break
        
    cam.release()
    cv2.destroyAllWindows()
    
    if len(faces) > 0:
        recognizer.train(faces, np.array(ids))
        recognizer.save("trainer.yml")
        print(f"\nSUCCESS: Face model trained with {len(faces)} images.")
    else:
        print("\nFAILED: No face detected.")

if __name__ == "__main__":
    train_face()
