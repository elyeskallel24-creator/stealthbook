import sys
from vault import save_vault, load_vault, VAULT_PATH, MAGIC
from crypto import CryptoError, SALT_LEN, NONCE_LEN

PASS = 0; FAIL = 0
def check(n, c):
    global PASS, FAIL
    if c: PASS += 1; print("  PASS  " + n)
    else: FAIL += 1; print("  FAIL  " + n)

print("Vault path: " + str(VAULT_PATH))
if VAULT_PATH.exists():
    print("  (removing existing vault for clean test)")
    VAULT_PATH.unlink()

print("\n[1] create vault")
notes = {"note-1": {"title": "Hello", "body": "world"},
         "note-2": {"title": "Second", "body": "entry"}}
save_vault("test-pass", notes)
check("vault exists", VAULT_PATH.exists())
sz = VAULT_PATH.stat().st_size
check("vault non-empty", sz > 0)
print("  vault size: " + str(sz) + " bytes")

print("\n[2] raw bytes contain no plaintext")
raw = VAULT_PATH.read_bytes()
check("starts with magic", raw.startswith(MAGIC))
check("no 'Hello' in ciphertext", b"Hello" not in raw)
check("no 'world' in ciphertext", b"world" not in raw)
check("no 'test-pass' in file", b"test-pass" not in raw)
check("no 'note-1' in file", b"note-1" not in raw)

print("\n[3] reopen with correct passphrase")
loaded = load_vault("test-pass")
check("roundtrip: same notes", loaded == notes)
check("note count preserved", len(loaded) == 2)

print("\n[4] wrong passphrase rejected")
try:
    load_vault("wrong-pass"); check("wrong passphrase rejected", False)
except CryptoError:
    check("wrong passphrase rejected", True)

print("\n[5] tampered vault rejected")
bad = bytearray(raw)
bad[5 + SALT_LEN + NONCE_LEN + 4] ^= 1
VAULT_PATH.write_bytes(bytes(bad))
try:
    load_vault("test-pass"); check("tampered body rejected", False)
except CryptoError:
    check("tampered body rejected", True)

print("\n[6] truncated vault rejected")
VAULT_PATH.write_bytes(raw[:10])
try:
    load_vault("test-pass"); check("truncated vault rejected", False)
except CryptoError:
    check("truncated vault rejected", True)

print("\n[7] bad magic rejected")
VAULT_PATH.write_bytes(b"XXXX" + raw[4:])
try:
    load_vault("test-pass"); check("bad magic rejected", False)
except CryptoError:
    check("bad magic rejected", True)

VAULT_PATH.write_bytes(raw)

print("\n[8] atomic write: no temp files left behind")
tmps = list(VAULT_PATH.parent.glob(".vault_*"))
check("no orphan temp files", len(tmps) == 0)

print("\nVAULT TESTS: " + str(PASS) + " passed, " + str(FAIL) + " failed")
sys.exit(0 if FAIL == 0 else 1)
