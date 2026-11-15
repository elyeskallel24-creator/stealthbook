"""Stealth Book vault ? the file on disk. Atomic write, magic header,
version byte, salt, then ciphertext. Nothing plaintext ever hits disk."""
from __future__ import annotations
import os, json, tempfile
from pathlib import Path
from crypto import derive_key, encrypt, decrypt, new_salt, CryptoError, SALT_LEN, NONCE_LEN

MAGIC = b"SBK1"
FORMAT_VERSION = 1
VAULT_DIR = Path(os.environ["USERPROFILE"]) / "StealthBook"
VAULT_PATH = VAULT_DIR / "stealthbook.vault"


def _aad(version: int) -> bytes:
    return b"stealthbook:vault:v" + bytes([version])


def save_vault(passphrase: str, notes: dict) -> None:
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    salt = new_salt()
    key = derive_key(passphrase, salt)
    plaintext = json.dumps(notes, ensure_ascii=False).encode("utf-8")
    ct = encrypt(key, plaintext, _aad(FORMAT_VERSION))
    blob = MAGIC + bytes([FORMAT_VERSION]) + salt + ct
    fd, tmp = tempfile.mkstemp(dir=str(VAULT_DIR), prefix=".vault_")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(blob)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, VAULT_PATH)
    except Exception:
        try:
            os.unlink(tmp)
        except FileNotFoundError:
            pass
        raise


def load_vault(passphrase: str) -> dict:
    if not VAULT_PATH.exists():
        raise CryptoError("vault does not exist")
    blob = VAULT_PATH.read_bytes()
    if not blob.startswith(MAGIC):
        raise CryptoError("not a StealthBook vault (bad magic)")
    if len(blob) < 4 + 1 + SALT_LEN + NONCE_LEN + 16:
        raise CryptoError("vault truncated")
    version = blob[4]
    if version != FORMAT_VERSION:
        raise CryptoError(f"unsupported vault version {version}")
    salt = blob[5:5 + SALT_LEN]
    ct = blob[5 + SALT_LEN:]
    key = derive_key(passphrase, salt)
    plaintext = decrypt(key, ct, _aad(version))
    return json.loads(plaintext.decode("utf-8"))
