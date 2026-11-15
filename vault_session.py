"""VaultSession ? one live vault handle for the whole app session.
Key derived ONCE at unlock; reused for every save. Wiped on close."""
from __future__ import annotations
import os, json, tempfile
from vault import VAULT_PATH, VAULT_DIR, MAGIC, FORMAT_VERSION, _aad
from crypto import derive_key, encrypt, decrypt, CryptoError, SALT_LEN, NONCE_LEN


class VaultSession:
    def __init__(self, salt: bytes, key: bytearray, notes: dict):
        self.salt = salt
        self.key = key
        self.notes = notes

    @classmethod
    def unlock(cls, passphrase: str) -> "VaultSession":
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
        notes = json.loads(plaintext.decode("utf-8"))
        return cls(salt, bytearray(key), notes)

    def save(self) -> None:
        plaintext = json.dumps(self.notes, ensure_ascii=False).encode("utf-8")
        ct = encrypt(bytes(self.key), plaintext, _aad(FORMAT_VERSION))
        blob = MAGIC + bytes([FORMAT_VERSION]) + self.salt + ct
        VAULT_DIR.mkdir(parents=True, exist_ok=True)
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

    def wipe(self) -> None:
        for i in range(len(self.key)):
            self.key[i] = 0
