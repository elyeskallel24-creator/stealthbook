"""Stealth Book launcher ? face gate, passphrase, TUI, lock loop.

Usage:
  python launcher.py            normal: random face challenge + passphrase
  python launcher.py --no-face  debug: skip camera
  python launcher.py --reset    DESTRUCTIVE: delete vault first (double confirm)
"""
from __future__ import annotations
import sys, random, getpass
from pathlib import Path


def _log(m=""):
    print(m, flush=True)


def _face_gate() -> bool:
    from face import run_face_challenge, CHALLENGES, FaceGateError
    challenge = random.choice(list(CHALLENGES.keys()))
    prompt = CHALLENGES[challenge][3]
    _log(f"\n[unlock] Face challenge: {prompt}")
    try:
        passed = run_face_challenge(challenge, timeout=20.0)
    except FaceGateError as e:
        _log(f"Face gate error: {e}")
        return False
    if not passed:
        _log("Face challenge failed or timed out.")
        return False
    _log("[unlock] Face: OK")
    return True


def _unlock_or_create():
    from vault import VAULT_PATH, save_vault
    from vault_session import VaultSession
    from crypto import CryptoError

    if not VAULT_PATH.exists():
        _log("\nNo vault yet ? create one now.")
        while True:
            p1 = getpass.getpass("New passphrase (min 8 chars): ")
            if len(p1) < 8:
                _log("Too short."); continue
            p2 = getpass.getpass("Confirm: ")
            if p1 != p2:
                _log("Mismatch."); continue
            break
        save_vault(p1, {"n-welcome": {
            "title": "Welcome to Stealth Book",
            "body": "Ctrl+S save  |  Ctrl+N new note  |  Ctrl+D delete  |  Ctrl+Q quit\n\nAuto-lock after 5 min idle. Re-auth required to resume.",
        }})
        _log("Vault created.")
        return VaultSession.unlock(p1)

    for attempt in range(3):
        p = getpass.getpass("Passphrase: ")
        try:
            s = VaultSession.unlock(p)
            _log("Unlocked.")
            return s
        except CryptoError:
            _log(f"Wrong passphrase ({attempt + 1}/3).")
    return None


def main():
    sys.path.insert(0, str(Path(__file__).parent))
    from vault import VAULT_PATH

    skip_face = "--no-face" in sys.argv
    if "--reset" in sys.argv:
        if VAULT_PATH.exists():
            _log("RESET: this will PERMANENTLY DELETE your vault.")
            if input("Type DELETE to confirm: ").strip() == "DELETE":
                VAULT_PATH.unlink()
                _log("Vault deleted.")
            else:
                _log("Cancelled."); sys.exit(0)

    while True:
        if not skip_face:
            if not _face_gate():
                _log("Exiting.")
                sys.exit(2)

        session = _unlock_or_create()
        if session is None:
            _log("Too many failures. Exiting.")
            sys.exit(3)

        from app import StealthBookApp
        app = StealthBookApp(session)
        app.run()

        if app.exit_reason == "locked":
            _log("\n[locked] Idle timeout. Re-authenticate.")
            continue
        _log("\nSession closed, key wiped.")
        break


if __name__ == "__main__":
    main()
