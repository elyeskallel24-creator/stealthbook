import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../state/vault';

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const { data, lock } = useVault();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) setSearch('');
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: 'lock', title: 'Lock App', icon: '🔒', action: () => { lock(); onClose(); } },
    ...data.houses.flatMap(h => [
      { id: `house-${h.id}`, title: `Go to ${h.name}`, icon: '🏠', action: () => { onNavigate(h.id, null); onClose(); } },
      { id: `tasks-${h.id}`, title: `${h.name} > Tasks`, icon: '✓', action: () => { onNavigate(h.id, 'Tasks'); onClose(); } },
      { id: `notes-${h.id}`, title: `${h.name} > Notes`, icon: '✎', action: () => { onNavigate(h.id, 'Notes'); onClose(); } },
      { id: `habits-${h.id}`, title: `${h.name} > Habits`, icon: '🔥', action: () => { onNavigate(h.id, 'Habits'); onClose(); } },
    ])
  ];

  const filtered = actions.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        onClick={e => e.stopPropagation()}
        className="glass"
        style={{ width: '100%', maxWidth: 600, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        <input
          type="text"
          autoFocus
          placeholder="Search commands or jump to..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: 24, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-0)', fontSize: 18, outline: 'none' }}
        />
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: 12 }}>
          {filtered.map(action => (
            <div
              key={action.id}
              onClick={action.action}
              style={{ padding: '16px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-1)', transition: 'background 0.1s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-hover)'; e.currentTarget.style.color = 'var(--text-0)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-1)'; }}
            >
              <span style={{ fontSize: 18 }}>{action.icon}</span>
              <span style={{ fontSize: 16 }}>{action.title}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 20, color: 'var(--text-2)', textAlign: 'center' }}>No results found.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
