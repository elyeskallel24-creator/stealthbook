import React, { useState } from 'react';
import { useVault } from '../state/vault';
import GlassButton from './GlassButton';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotesRoom({ house, onBack }) {
  const { data, saveData } = useVault();
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState('');

  const updateNotes = (newNotes) => {
    const newHouses = data.houses.map(h => h.id === house.id ? { ...h, notes: newNotes } : h);
    saveData({ ...data, houses: newHouses });
  };

  const createNote = () => {
    const newNote = {
      id: crypto.randomUUID(),
      title: 'New Note',
      body: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateNotes([newNote, ...house.notes]);
    setSelectedNoteId(newNote.id);
  };

  const deleteNote = (e, id) => {
    e.stopPropagation();
    updateNotes(house.notes.filter(n => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const updateCurrentNote = (updates) => {
    const newNotes = house.notes.map(n => n.id === selectedNoteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
    updateNotes(newNotes);
  };

  const selectedNote = house.notes.find(n => n.id === selectedNoteId);
  const filteredNotes = house.notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  const wordCount = selectedNote?.body.trim() ? selectedNote.body.trim().split(/\s+/).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 40, gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <GlassButton onClick={onBack}>← Back</GlassButton>
        <h2 style={{ fontSize: 24, fontWeight: 500 }}>Notes</h2>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 24, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="glass" 
              style={{ flex: 1, padding: '14px 16px', color: 'var(--text-0)', outline: 'none', borderRadius: 16 }} 
            />
            <GlassButton onClick={createNote} style={{ padding: '0 20px' }}>+</GlassButton>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
            <AnimatePresence>
              {filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className="glass"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ padding: 20, cursor: 'pointer', background: selectedNoteId === note.id ? 'var(--glass-strong)' : 'var(--glass)', borderColor: selectedNoteId === note.id ? 'var(--border-strong)' : 'var(--border)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 500 }}>{note.title || 'Untitled'}</h4>
                    <button onClick={(e) => deleteNote(e, note.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 8 }}>
                    {note.body || 'No additional text'}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedNote ? (
            <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 32 }}>
              <input 
                type="text" 
                value={selectedNote.title} 
                onChange={e => updateCurrentNote({ title: e.target.value })} 
                placeholder="Note Title"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-0)', fontSize: 28, fontWeight: 'bold', outline: 'none', marginBottom: 16 }} 
              />
              <textarea 
                value={selectedNote.body} 
                onChange={e => updateCurrentNote({ body: e.target.value })} 
                placeholder="Start typing..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-1)', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 16, lineHeight: 1.6 }} 
              />
              <div style={{ color: 'var(--text-2)', fontSize: 13, textAlign: 'right', marginTop: 16, letterSpacing: 1 }}>
                {wordCount} words
              </div>
            </div>
          ) : (
            <div className="glass" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontSize: 16 }}>
              Select or create a note to start writing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
