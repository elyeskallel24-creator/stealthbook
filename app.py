from __future__ import annotations
import os, uuid, time
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import Header, Footer, ListView, ListItem, Label, Input, TextArea, Static
from textual.binding import Binding

IDLE_SECONDS = int(os.environ.get("STEALTHBOOK_IDLE_SECONDS", "300"))


class NoteItem(ListItem):
    def __init__(self, note_id: str, title: str):
        super().__init__()
        self.note_id = note_id
        self.title_text = title

    def compose(self) -> ComposeResult:
        yield Label(self.title_text or "(untitled)")


class StealthBookApp(App):
    TITLE = "Stealth Book"
    SUB_TITLE = "encrypted local notes"
    CSS = """
    Screen { layout: horizontal; }
    #sidebar { width: 30; border-right: solid $accent; }
    #sidebar-title { padding: 1; background: $boost; }
    #sidebar-list { height: 1fr; }
    #editor-pane { width: 1fr; padding: 1; }
    #title-input { height: 3; }
    #body-input { height: 1fr; margin-top: 1; }
    """
    BINDINGS = [
        Binding("ctrl+s", "save", "Save"),
        Binding("ctrl+n", "new_note", "New"),
        Binding("ctrl+d", "delete", "Delete"),
        Binding("ctrl+q", "quit_app", "Quit"),
    ]

    def __init__(self, session):
        super().__init__()
        self.session = session
        self.current_id = None
        self.last_activity = time.time()
        self.exit_reason = "quit"
        self.idle_seconds = IDLE_SECONDS

    def compose(self) -> ComposeResult:
        yield Header()
        with Horizontal():
            with Vertical(id="sidebar"):
                yield Static("[b]Notes[/b]", id="sidebar-title")
                yield ListView(id="sidebar-list")
            with Vertical(id="editor-pane"):
                yield Input(placeholder="Title", id="title-input")
                yield TextArea(id="body-input")
        yield Footer()

    def on_mount(self) -> None:
        self._refresh_list()
        if self.session.notes:
            self._select(next(iter(self.session.notes)))
        self.set_interval(1.0, self._check_idle)

    def _check_idle(self) -> None:
        if self.idle_seconds <= 0:
            return
        if time.time() - self.last_activity >= self.idle_seconds:
            self._commit_current()
            try:
                self.session.save()
            except Exception:
                pass
            self.session.wipe()
            self.session.notes.clear()
            self.exit_reason = "locked"
            self.exit()

    def on_key(self, event) -> None:
        self.last_activity = time.time()

    def on_mouse_move(self, event) -> None:
        self.last_activity = time.time()

    def _refresh_list(self) -> None:
        lv = self.query_one("#sidebar-list", ListView)
        lv.clear()
        for nid, note in self.session.notes.items():
            lv.append(NoteItem(nid, note.get("title", "")))

    def _select(self, nid: str) -> None:
        self.current_id = nid
        note = self.session.notes.get(nid, {})
        self.query_one("#title-input", Input).value = note.get("title", "")
        self.query_one("#body-input", TextArea).text = note.get("body", "")

    def on_list_view_selected(self, event) -> None:
        item = event.item
        if isinstance(item, NoteItem) and item.note_id != self.current_id:
            self._commit_current()
            self._select(item.note_id)

    def _commit_current(self) -> None:
        if not self.current_id:
            return
        title = self.query_one("#title-input", Input).value
        body = self.query_one("#body-input", TextArea).text
        self.session.notes[self.current_id] = {"title": title, "body": body}

    def action_save(self) -> None:
        self._commit_current()
        try:
            self.session.save()
            self.notify("Saved", severity="information", timeout=2)
        except Exception as e:
            self.notify(f"Save failed: {e}", severity="error", timeout=5)

    def action_new_note(self) -> None:
        self._commit_current()
        nid = "n-" + uuid.uuid4().hex[:8]
        self.session.notes[nid] = {"title": "", "body": ""}
        self._refresh_list()
        self._select(nid)
        self.query_one("#title-input", Input).focus()

    def action_delete(self) -> None:
        if not self.current_id:
            return
        self.session.notes.pop(self.current_id, None)
        self.current_id = None
        self.query_one("#title-input", Input).value = ""
        self.query_one("#body-input", TextArea).text = ""
        self._refresh_list()

    def action_quit_app(self) -> None:
        self._commit_current()
        self.exit_reason = "quit"
        self.exit()

    def on_unmount(self) -> None:
        self.session.wipe()
