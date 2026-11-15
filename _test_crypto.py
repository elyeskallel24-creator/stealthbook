import sys, time
from crypto import (
    derive_key, encrypt, decrypt, new_salt, wipe, CryptoError,
    NONCE_LEN, ARGON2_TIME_COST, ARGON2_MEMORY_COST, ARGON2_PARALLELISM, ARGON2_HASH_LEN,
)

PASS = 0
FAIL = 0
def check(name, cond):
    global PASS, FAIL
    if cond: PASS += 1; print(f"  PASS  {name}")
    else:    FAIL += 1; print(f"  FAIL  {name}")

print(f"Argon2id: m={ARGON2_MEMORY_COST} KiB, t={ARGON2_TIME_COST}, p={ARGON2_PARALLELISM}, out={ARGON2_HASH_LEN*8} bits")

print("\n[1] KDF determinism + cost")
salt = new_salt()
t0 = time.time(); k1 = derive_key("correct horse battery staple", salt); dt = time.time() - t0
k2 = derive_key("correct horse battery staple", salt)
check("same pass+salt -> same key", k1 == k2)
check("key is 32 bytes", len(k1) == 32)
print(f"  (one KDF took {dt*1000:.0f} ms)")

print("\n[2] KDF sensitivity")
k3 = derive_key("correct horse battery staple", new_salt())
check("different salt -> different key", k1 != k3)
k4 = derive_key("Correct horse battery staple", salt)
check("different pass (case) -> different key", k1 != k4)

print("\n[3] AEAD roundtrip")
pt = b"Stealth Book test payload \x00\x01\x02"
aad = b"stealthbook:v1"
ct = encrypt(k1, pt, aad)
check("ciphertext != plaintext", ct != pt)
check("ciphertext len == nonce+pt+tag", len(ct) == NONCE_LEN + len(pt) + 16)
check("roundtrip recovers plaintext", decrypt(k1, ct, aad) == pt)

print("\n[4] AEAD rejects wrong key")
try:
    decrypt(k3, ct, aad); check("wrong key rejected", False)
except CryptoError:
    check("wrong key rejected", True)

print("\n[5] AEAD rejects tampering")
for name, idx in [("nonce bit", 0), ("ciphertext bit", NONCE_LEN), ("tag bit", len(ct) - 1)]:
    bad = bytearray(ct); bad[idx] ^= 1
    try:
        decrypt(k1, bytes(bad), aad); check(f"tampered {name} rejected", False)
    except CryptoError:
        check(f"tampered {name} rejected", True)

print("\n[6] AEAD rejects wrong AAD")
try:
    decrypt(k1, ct, b"wrong-aad"); check("wrong AAD rejected", False)
except CryptoError:
    check("wrong AAD rejected", True)

print("\n[7] wipe zeroes memory")
b = bytearray(b"secret-secret-secret")
wipe(b)
check("bytearray wiped", all(x == 0 for x in b))

print(f"\nCRYPTO TESTS: {PASS} passed, {FAIL} failed")
sys.exit(0 if FAIL == 0 else 1)
