import sys
print("python:", sys.version.split()[0])
import cryptography, argon2, numpy, cv2, mediapipe, textual
print("cryptography:", cryptography.__version__)
print("argon2-cffi:", argon2.__version__)
print("numpy:", numpy.__version__)
print("opencv:", cv2.__version__)
print("mediapipe:", mediapipe.__version__)
print("textual:", textual.__version__)
print("SMOKE: OK")
