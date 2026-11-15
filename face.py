"""Stealth Book face gate ? liveness / expression challenge.

Uses MediaPipe FaceMesh (legacy solutions API, bundled model, no downloads).
Computes expression metrics from landmark geometry, requires the target
expression for N consecutive frames before passing.
"""
from __future__ import annotations
import time
from typing import Callable
import cv2
import numpy as np
import mediapipe as mp

# --- landmark indices (FaceMesh, 468-point mesh) ---
MOUTH_UPPER = 13
MOUTH_LOWER = 14
MOUTH_LEFT  = 61
MOUTH_RIGHT = 291
L_EYE_TOP   = 159
L_EYE_BOT   = 145
L_EYE_LEFT  = 33
L_EYE_RIGHT = 133
R_EYE_TOP   = 386
R_EYE_BOT   = 374
R_EYE_LEFT  = 362
R_EYE_RIGHT = 263
L_BROW      = 105
R_BROW      = 334


def _d(a, b):
    return float(np.linalg.norm(np.array(a[:2]) - np.array(b[:2])))


def mouth_aspect(lm):
    open_h = _d(lm[MOUTH_UPPER], lm[MOUTH_LOWER])
    width  = _d(lm[MOUTH_LEFT],  lm[MOUTH_RIGHT])
    return open_h / max(width, 1e-6)


def eye_aspect(lm):
    l = _d(lm[L_EYE_TOP], lm[L_EYE_BOT]) / max(_d(lm[L_EYE_LEFT], lm[L_EYE_RIGHT]), 1e-6)
    r = _d(lm[R_EYE_TOP], lm[R_EYE_BOT]) / max(_d(lm[R_EYE_LEFT], lm[R_EYE_RIGHT]), 1e-6)
    return (l + r) / 2.0


def smile_score(lm):
    width = _d(lm[MOUTH_LEFT], lm[MOUTH_RIGHT])
    face_h = _d(lm[L_EYE_TOP], lm[MOUTH_LOWER])
    return width / max(face_h, 1e-6)


def brow_raise(lm):
    brow_h = (_d(lm[L_BROW], lm[L_EYE_TOP]) + _d(lm[R_BROW], lm[R_EYE_TOP])) / 2.0
    face_h = _d(lm[L_EYE_TOP], lm[MOUTH_LOWER])
    return brow_h / max(face_h, 1e-6)


# name -> (metric_fn, direction, threshold, prompt)
CHALLENGES = {
    "mouth_open":  (mouth_aspect, "above", 0.35, "OPEN YOUR MOUTH WIDE"),
    "blink":       (eye_aspect,   "below", 0.15, "CLOSE YOUR EYES / BLINK"),
    "smile":       (smile_score,  "above", 0.65, "SMILE BIG"),
    "eyebrows_up": (brow_raise,   "above", 0.30, "RAISE YOUR EYEBROWS"),
}


class FaceGateError(Exception):
    pass


def run_face_challenge(
    challenge_name: str,
    timeout: float = 20.0,
    camera_index: int = 0,
    needed_frames: int = 3,
    show_preview: bool = True,
) -> bool:
    """Return True if `challenge_name` is detected for `needed_frames` consecutive
    frames within `timeout` seconds. False otherwise (timeout, no camera, ESC)."""
    if challenge_name not in CHALLENGES:
        raise FaceGateError(f"unknown challenge: {challenge_name}")
    metric_fn, direction, threshold, prompt = CHALLENGES[challenge_name]

    cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        raise FaceGateError(f"cannot open camera {camera_index} (may be in use by another app)")

    face_mesh = mp.solutions.face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    hits = 0
    start = time.time()
    passed = False
    print(f"\n[face] CHALLENGE: {prompt}")
    print(f"[face] window will open. Do the expression. ESC to cancel.")
    print(f"[face] timeout: {int(timeout)}s, need {needed_frames} clean frames.\n")

    try:
        while time.time() - start < timeout:
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = face_mesh.process(rgb)

            status = "..."
            if res.multi_face_landmarks:
                lm = [(p.x, p.y, p.z) for p in res.multi_face_landmarks[0].landmark]
                val = metric_fn(lm)
                hit = (val > threshold) if direction == "above" else (val < threshold)
                hits = hits + 1 if hit else 0
                status = f"{challenge_name}={val:.2f} {'OK' if hit else '...'}"
            else:
                hits = 0
                status = "NO FACE"

            if show_preview:
                cv2.putText(frame, prompt, (10, 35),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                cv2.putText(frame, status, (10, 70),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.imshow("StealthBook Face Gate", frame)
                if cv2.waitKey(1) & 0xFF == 27:
                    break

            if hits >= needed_frames:
                passed = True
                break
    finally:
        face_mesh.close()
        cap.release()
        if show_preview:
            cv2.destroyAllWindows()

    return passed
