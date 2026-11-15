import sys, asyncio
from vault import save_vault, VAULT_PATH
from vault_session import VaultSession
from crypto import CryptoError

PASS = 0; FAIL = 0
def check(n, c):
    global PASS, FAIL
    if c: PASS += 1; print("  PASS  " + n)
    else: FAIL += 1; print("  FAIL  " + n)

print("Vault path: " + str(VAULT_PATH))
save_vault("test-pass", {"n1": {"title": "A", "body": "one"},
                         "n2": {"title": "B", "body": "two"}})

print("\n[1] VaultSession unlock")
s = VaultSession.unlock("test-pass")
check("notes loaded", "n1" in s.notes and "n2" in s.notes)
check("key is 32 bytes", len(s.key) == 32)

print("\n[2] modify + save")
s.notes["n3"] = {"title": "C", "body": "three"}
s.notes["n1"]["body"] = "one-updated"
s.save()

print("\n[3] reopen sees changes")
s2 = VaultSession.unlock("test-pass")
check("new note persisted", "n3" in s2.notes)
check("edit persisted", s2.notes["n1"]["body"] == "one-updated")

print("\n[4] wrong passphrase rejected")
try:
    VaultSession.unlock("wrong")
    check("wrong passphrase rejected", False)
except CryptoError:
    check("wrong passphrase rejected", True)

print("\n[5] wipe zeroes key")
k_before = bytes(s.key)
s.wipe()
check("key is all zeros after wipe", all(b == 0 for b in s.key))
check("key was non-zero before wipe", any(b != 0 for b in k_before))

print("\n[6] Textual app composes headless")
async def _ui_test():
    from app import StealthBookApp
    sess = VaultSession.unlock("test-pass")
    app = StealthBookApp(sess)
    async with app.run_test() as pilot:
        await pilot.pause()
        app.query_one("#title-input")
        app.query_one("#body-input")
        await pilot.press("ctrl+n")
        await pilot.pause()
    return True

try:
    ok = asyncio.run(_ui_test())
    check("Textual App started, responded to Ctrl+N", ok)
except Exception as e:
    print("  Textual App FAIL: " + type(e).__name__ + ": " + str(e))
    check("Textual App started, responded to Ctrl+N", False)

print("\nAPP TESTS: " + str(PASS) + " passed, " + str(FAIL) + " failed")
sys.exit(0 if FAIL == 0 else 1)
