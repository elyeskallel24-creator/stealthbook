import React from 'react';
import { useVault } from '../state/vault';
import GlassButton from './GlassButton';
import { motion } from 'framer-motion';

export default function Home({ onOpenHouse }) {
  const { data, saveData } = useVault();

  const createHouse = () => {
    const newHouse = {
      id: crypto.randomUUID(),
      name: "New House",
      glyph: "□",
      createdAt: new Date().toISOString(),
      tasks: [],
      notes: [],
      habits: []
    };
    const newData = { ...data, houses: [...data.houses, newHouse] };
    saveData(newData);
  };

  const handleRename = (e, id, currentName) => {
    e.stopPropagation();
    const newName = window.prompt("Enter new name:", currentName);
    if (newName && newName.trim()) {
      const newData = { ...data, houses: data.houses.map(h => h.id === id ? { ...h, name: newName.trim() } : h) };
      saveData(newData);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this house? All its contents will be lost forever.")) {
      const newData = { ...data, houses: data.houses.filter(h => h.id !== id) };
      saveData(newData);
    }
  };

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 500 }}>Your Houses</h2>
        <GlassButton onClick={createHouse}>+ New House</GlassButton>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {data.houses.length === 0 && (
          <div style={{ color: 'var(--text-2)', gridColumn: '1 / -1', textAlign: 'center', marginTop: 60, fontSize: 16 }}>
            No houses yet. Create one to get started.
          </div>
        )}
        {data.houses.map(house => (
          <motion.div
            key={house.id}
            onClick={() => onOpenHouse(house.id)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass"
            style={{ padding: 32, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 20, height: '180px', position: 'relative', borderRadius: 24 }}
          >
            <div style={{ fontSize: 40, color: 'var(--text-1)' }}>{house.glyph}</div>
            <h3 style={{ fontSize: 20, fontWeight: 500 }}>{house.name}</h3>
            
            <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 12 }}>
              <button onClick={(e) => handleRename(e, house.id, house.name)} style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18 }}>✎</button>
              <button onClick={(e) => handleDelete(e, house.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
