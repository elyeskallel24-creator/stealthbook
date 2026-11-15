import sys, os, time, asyncio
os.environ["STEALTHBOOK_IDLE_SECONDS"] = "2"
from vault import save_vault, VAULT_PATH
from vault_session import VaultSession

PASS = 0; FAIL = 0
def check(n, c):
    global PASS, FAIL
    if c: PASS += 1; print("  PASS  " + n)
    else: FAIL += 1; print("  FAIL  " + n)

print("Idle timeout set to 2s for this test")
save_vault("test-pass", {"n1": {"title": "A", "body": "one"}})

async def _run():
    from app import StealthBookApp
    s = VaultSession.unlock("test-pass")
    app = StealthBookApp(s)
    async with app.run_test() as pilot:
        await pilot.pause()
        time.sleep(2.5)
        await pilot.pause()
        return app.exit_reason

print("\n[1] idle fires lock")
reason = asyncio.run(_run())
check("exit_reason == 'locked'", reason == "locked")

print("\n[2] vault still readable after lock")
s2 = VaultSession.unlock("test-pass")
check("notes intact", "n1" in s2.notes)
check("body intact", s2.notes["n1"]["body"] == "one")

print("\n[3] fast path does NOT lock")
os.environ["STEALTHBOOK_IDLE_SECONDS"] = "300"
async def _run2():
    import importlib, app as app_mod
    importlib.reload(app_mod)
    s = VaultSession.unlock("test-pass")
    a = app_mod.StealthBookApp(s)
    async with a.run_test() as pilot:
        await pilot.pause()
        return a.exit_reason
r2 = asyncio.run(_run2())
check("no false lock with 300s timeout", r2 == "quit")

print("\nAUTOLOCK TESTS: " + str(PASS) + " passed, " + str(FAIL) + " failed")
sys.exit(0 if FAIL == 0 else 1)
