let notes = {}, currentId = null, autoSaveTimeout = null, isStealthMode = false;

async function unlock() {
    const res = await window.pywebview.api.unlock_vault(document.getElementById('pass').value);
    if (res.status === 'ok') {
        notes = res.notes;
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        renderNotes(); renderHeatmap();
        const keys = Object.keys(notes);
        if (keys.length > 0) selectNote(keys[0]);
    } else { document.getElementById('auth-msg').innerText = res.msg; }
}

function renderNotes() {
    const list = document.getElementById('note-list'); list.innerHTML = '';
    Object.keys(notes).forEach(id => {
        const div = document.createElement('div');
        div.className = 'note-item' + (id === currentId ? ' active' : '');
        div.onclick = () => selectNote(id);
        div.innerHTML = `<h4>${notes[id].title || 'Untitled'}</h4><p>${notes[id].body || 'No text'}</p>`;
        list.appendChild(div);
    });
}

function selectNote(id) {
    if (currentId && currentId !== id) commitCurrent();
    currentId = id;
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('editor-content').classList.remove('hidden');
    document.getElementById('note-title').value = notes[id].title || '';
    document.getElementById('note-body').value = notes[id].body || '';
    renderNotes();
}

function createNote() {
    const id = 'n-' + Date.now(); notes[id] = { title: '', body: '' };
    selectNote(id); document.getElementById('note-title').focus();
}

async function commitCurrent() {
    if (!currentId) return;
    const title = document.getElementById('note-title').value, body = document.getElementById('note-body').value;
    notes[currentId] = { title, body };
    await window.pywebview.api.save_note(currentId, title, body);
    const status = document.getElementById('save-status');
    status.innerText = 'Saved ?'; status.classList.add('show');
    setTimeout(() => status.classList.remove('show'), 2000);
    renderNotes();
}

async function deleteCurrentNote() {
    if (!currentId) return;
    await window.pywebview.api.delete_note(currentId); delete notes[currentId];
    currentId = null; document.getElementById('note-title').value = ''; document.getElementById('note-body').value = '';
    document.getElementById('editor-content').classList.add('hidden'); document.getElementById('empty-state').classList.remove('hidden');
    renderNotes();
}

function renderHeatmap() {
    const container = document.getElementById('heatmap'); container.innerHTML = '';
    for (let i = 0; i < 52 * 7; i++) {
        const d = document.createElement('div'); d.className = 'hm-cell';
        const level = Math.floor(Math.random() * 5); if (level > 0) d.classList.add(`l${level}`);
        container.appendChild(d);
    }
}

document.getElementById('note-body').addEventListener('input', () => { clearTimeout(autoSaveTimeout); autoSaveTimeout = setTimeout(commitCurrent, 1500); });
document.getElementById('note-title').addEventListener('input', () => { clearTimeout(autoSaveTimeout); autoSaveTimeout = setTimeout(commitCurrent, 1500); });

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); commitCurrent(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); createNote(); }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault(); isStealthMode = !isStealthMode;
        document.getElementById('stealth-overlay').classList.toggle('hidden', !isStealthMode);
    }
});
