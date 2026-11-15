import sys, time
import cv2
from face import run_face_challenge, CHALLENGES, FaceGateError

print("=== camera probe ===")
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
if not cap.isOpened():
    print("FAIL: cannot open camera 0")
    sys.exit(1)
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
cap.release()
print(f"  camera 0: {w}x{h} OK")

print("\n=== FaceMesh load ===")
try:
    import mediapipe as mp
    fm = mp.solutions.face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)
    fm.close()
    print("  FaceMesh: OK")
except Exception as e:
    print(f"  FaceMesh FAIL: {type(e).__name__}: {e}")
    sys.exit(1)

print("\n=== live challenge: mouth_open (20s) ===")
print("  WATCH YOUR SCREEN. When the window opens, OPEN YOUR MOUTH WIDE.")
print("  Hold it for ~1 second. Window closes on pass. ESC to cancel.")
print("  Starting in 3 seconds...")
time.sleep(3)

try:
    t0 = time.time()
    ok = run_face_challenge("mouth_open", timeout=20.0, camera_index=0)
    dt = time.time() - t0
except FaceGateError as e:
    print(f"\nFAIL: {e}")
    sys.exit(1)

print(f"\n=== result (took {dt:.1f}s) ===")
if ok:
    print("PASS: face gate detected mouth_open")
    sys.exit(0)
else:
    print("FAIL: challenge not satisfied (timeout or ESC). Re-run and hold the expression longer.")
    sys.exit(1)
