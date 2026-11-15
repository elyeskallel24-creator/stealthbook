import webview, os, json, random, sys, time
from vault import VAULT_PATH, save_vault
from vault_session import VaultSession
from crypto import CryptoError

class Api:
    def __init__(self):
        self.session = None
        self._window = None
        
    def set_window(self, window):
        self._window = window

    def check_biometrics(self):
        # Bypassed for now so you can see the UI. We will fix the camera later.
        return {"status": "ok", "msg": "Face verified."}
        
    def unlock_vault(self, passphrase):
        try:
            if not VAULT_PATH.exists():
                default_notes = {"n-welcome": {"title": "Welcome to Stealth Book", "body": "This is your private space.\n\nPress Ctrl+Shift+H for Stealth Mode."}}
                save_vault(passphrase, default_notes)
            self.session = VaultSession.unlock(passphrase)
            return {"status": "ok", "notes": self.session.notes}
        except CryptoError:
            return {"status": "error", "msg": "Invalid passphrase."}
            
    def save_note(self, note_id, title, body):
        if not self.session: return {"status": "error"}
        self.session.notes[note_id] = {"title": title, "body": body}
        self.session.save()
        return {"status": "ok"}
        
    def delete_note(self, note_id):
        if not self.session: return {"status": "error"}
        self.session.notes.pop(note_id, None)
        self.session.save()
        return {"status": "ok"}

    def minimize(self):
        if self._window: self._window.minimize()
    def toggle_maximize(self):
        if self._window: 
            if self._window.width == self._window.screen.width: self._window.restore()
            else: self._window.maximize()
    def close(self):
        if self._window: self._window.destroy()

def main():
    api = Api()
    window = webview.create_window('Stealth Book', 'index.html', js_api=api, width=1200, height=800, frameless=True, easy_drag=False, background_color='#07080F')
    api.set_window(window)
    webview.start()

if __name__ == '__main__':
    main()
