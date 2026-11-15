import React, { useState } from 'react';
import { useVault } from '../state/vault';
import GlassButton from './GlassButton';
import { motion, AnimatePresence } from 'framer-motion';

export default function TasksRoom({ house, onBack }) {
  const { data, saveData } = useVault();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('low');
  const [filter, setFilter] = useState('All');

  const updateTasks = (newTasks) => {
    const newHouses = data.houses.map(h => h.id === house.id ? { ...h, tasks: newTasks } : h);
    saveData({ ...data, houses: newHouses });
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      done: false,
      priority,
      due: null,
      createdAt: new Date().toISOString()
    };
    updateTasks([...house.tasks, newTask]);
    setTitle('');
  };

  const toggleTask = (id) => {
    updateTasks(house.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    updateTasks(house.tasks.filter(t => t.id !== id));
  };

  const filteredTasks = house.tasks.filter(t => {
    if (filter === 'Active') return !t.done;
    if (filter === 'Done') return t.done;
    return true;
  });

  const doneCount = house.tasks.filter(t => t.done).length;

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 24, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <GlassButton onClick={onBack}>← Back</GlassButton>
        <h2 style={{ fontSize: 24, fontWeight: 500 }}>Tasks</h2>
        <span style={{ color: 'var(--text-2)', fontSize: 14, marginLeft: 'auto' }}>
          {doneCount} of {house.tasks.length} done
        </span>
      </div>

      <form onSubmit={addTask} style={{ display: 'flex', gap: 10 }}>
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="Add a new task..." 
          className="glass" 
          style={{ flex: 1, padding: '16px 20px', color: 'var(--text-0)', outline: 'none', borderRadius: 16, fontSize: 16 }} 
        />
        <select value={priority} onChange={e => setPriority(e.target.value)} className="glass" style={{ padding: '0 20px', color: 'var(--text-0)', outline: 'none', background: 'var(--glass)', borderRadius: 16, fontSize: 14, appearance: 'none', cursor: 'pointer' }}>
          <option value="low" style={{background: '#111'}}>Low</option>
          <option value="medium" style={{background: '#111'}}>Medium</option>
          <option value="high" style={{background: '#111'}}>High</option>
        </select>
        <GlassButton type="submit" style={{ padding: '0 24px' }}>Add</GlassButton>
      </form>

      <div style={{ display: 'flex', gap: 16 }}>
        {['All', 'Active', 'Done'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            style={{ background: 'transparent', border: 'none', color: filter === f ? 'var(--text-0)' : 'var(--text-2)', cursor: 'pointer', fontWeight: filter === f ? 'bold' : 'normal', fontSize: 14 }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AnimatePresence>
          {filteredTasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass"
              style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20, width: '100%', boxSizing: 'border-box' }}
            >
              <div 
                onClick={() => toggleTask(task.id)}
                style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: task.done ? 'var(--text-2)' : 'transparent', transition: 'all 0.2s' }}
              >
                {task.done && <span style={{ color: 'var(--bg-0)', fontSize: 14, fontWeight: 'bold' }}>✓</span>}
              </div>
              
              <span style={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-2)' : 'var(--text-0)', fontSize: 16 }}>
                {task.title}
              </span>
              
              <span style={{ fontSize: 12, color: task.priority === 'high' ? 'var(--text-0)' : task.priority === 'medium' ? 'var(--text-1)' : 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {task.priority}
              </span>

              <button onClick={() => deleteTask(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, marginLeft: 10 }}>✕</button>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredTasks.length === 0 && (
          <div style={{ color: 'var(--text-2)', textAlign: 'center', marginTop: 40 }}>No tasks here.</div>
        )}
      </div>
    </div>
  );
}
