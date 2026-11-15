"""Stealth Book crypto core ? single source of truth for KDF + AEAD.
No plaintext ever leaves this module.
"""
from __future__ import annotations
import secrets
from argon2.low_level import hash_secret_raw, Type
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from cryptography.exceptions import InvalidTag

# Argon2id, OWASP-2024 "interactive" profile, bumped for a security-first app.
# m=256 MiB, t=4, p=4 -> ~1s on modern laptop, ~$2 per guess on GPU farms.
ARGON2_TIME_COST   = 4
ARGON2_MEMORY_COST = 256 * 1024   # KiB
ARGON2_PARALLELISM = 4
ARGON2_HASH_LEN    = 32
SALT_LEN           = 16
NONCE_LEN          = 12           # XChaCha20 nonce


class CryptoError(Exception):
    pass


def new_salt() -> bytes:
    return secrets.token_bytes(SALT_LEN)


def derive_key(passphrase: str, salt: bytes) -> bytes:
    if not isinstance(passphrase, str) or not passphrase:
        raise CryptoError("passphrase must be non-empty str")
    if len(salt) != SALT_LEN:
        raise CryptoError(f"salt must be {SALT_LEN} bytes")
    return hash_secret_raw(
        secret=passphrase.encode("utf-8"),
        salt=salt,
        time_cost=ARGON2_TIME_COST,
        memory_cost=ARGON2_MEMORY_COST,
        parallelism=ARGON2_PARALLELISM,
        hash_len=ARGON2_HASH_LEN,
        type=Type.ID,
    )


def encrypt(key: bytes, plaintext: bytes, aad: bytes = b"") -> bytes:
    if len(key) != 32:
        raise CryptoError("key must be 32 bytes")
    nonce = secrets.token_bytes(NONCE_LEN)
    ct = ChaCha20Poly1305(key).encrypt(nonce, plaintext, aad)
    return nonce + ct


def decrypt(key: bytes, blob: bytes, aad: bytes = b"") -> bytes:
    if len(key) != 32:
        raise CryptoError("key must be 32 bytes")
    if len(blob) < NONCE_LEN + 16:
        raise CryptoError("blob too short")
    nonce, ct = blob[:NONCE_LEN], blob[NONCE_LEN:]
    try:
        return ChaCha20Poly1305(key).decrypt(nonce, ct, aad)
    except InvalidTag as e:
        raise CryptoError("authentication failed (wrong key/passphrase or tampered data)") from e


def wipe(buf: bytearray) -> None:
    for i in range(len(buf)):
        buf[i] = 0

