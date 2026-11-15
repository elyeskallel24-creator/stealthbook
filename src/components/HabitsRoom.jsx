import React, { useState } from 'react';
import { useVault } from '../state/vault';
import GlassButton from './GlassButton';
import HeatMap from './HeatMap';
import { motion } from 'framer-motion';

export default function HabitsRoom({ house, onBack }) {
  const { data, saveData } = useVault();
  const [newHabitName, setNewHabitName] = useState('');

  const updateHabits = (newHabits) => {
    const newHouses = data.houses.map(h => h.id === house.id ? { ...h, habits: newHabits } : h);
    saveData({ ...data, houses: newHouses });
  };

  const createHabit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: crypto.randomUUID(),
      name: newHabitName.trim(),
      createdAt: new Date().toISOString(),
      completedDates: []
    };
    updateHabits([...house.habits, newHabit]);
    setNewHabitName('');
  };

  const toggleToday = (id) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newHabits = house.habits.map(h => {
      if (h.id !== id) return h;
      const hasToday = h.completedDates.includes(todayStr);
      const newDates = hasToday 
        ? h.completedDates.filter(d => d !== todayStr)
        : [...h.completedDates, todayStr];
      return { ...h, completedDates: newDates };
    });
    updateHabits(newHabits);
  };

  const deleteHabit = (id) => {
    updateHabits(house.habits.filter(h => h.id !== id));
  };

  const calculateStreak = (dates) => {
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    const sorted = [...dates].sort();
    let prevDate = null;
    
    for (let i = 0; i < sorted.length; i++) {
      const current = new Date(sorted[i]);
      if (prevDate) {
        const diff = (current - prevDate) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
      prevDate = current;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateSet = new Set(dates);
    let checkDate = new Date(today);
    while (true) {
      const str = checkDate.toISOString().split('T')[0];
      if (dateSet.has(str)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { currentStreak, bestStreak };
  };

  const calculatePercentage = (dates) => {
    if (dates.length === 0) return 0;
    const first = new Date(dates[0]);
    const today = new Date();
    const days = Math.max(1, Math.round((today - first) / (1000 * 60 * 60 * 24)) + 1);
    return Math.round((dates.length / days) * 100);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <GlassButton onClick={onBack}>← Back</GlassButton>
        <h2 style={{ fontSize: 24, fontWeight: 500 }}>Habits</h2>
      </div>

      <form onSubmit={createHabit} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input 
          type="text" 
          value={newHabitName} 
          onChange={e => setNewHabitName(e.target.value)} 
          placeholder="Add a new habit..." 
          className="glass" 
          style={{ flex: 1, padding: 16, color: 'var(--text-0)', outline: 'none', border: '1px solid var(--border)', borderRadius: 16 }} 
        />
        <GlassButton type="submit" style={{ padding: '0 24px' }}>Add</GlassButton>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {house.habits.map(habit => {
          const { currentStreak, bestStreak } = calculateStreak(habit.completedDates);
          const percentage = calculatePercentage(habit.completedDates);
          const doneToday = habit.completedDates.includes(todayStr);

          return (
            <motion.div 
              key={habit.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="glass" 
              style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, width: '100%', boxSizing: 'border-box' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 22, fontWeight: 500 }}>{habit.name}</h3>
                <button onClick={() => deleteHabit(habit.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: 60 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Current Streak</div>
                  <div style={{ fontSize: 32, fontWeight: 500 }}>{currentStreak} <span style={{fontSize: 16, color: 'var(--text-1)', fontWeight: 'normal'}}>days</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Best Streak</div>
                  <div style={{ fontSize: 32, fontWeight: 500 }}>{bestStreak} <span style={{fontSize: 16, color: 'var(--text-1)', fontWeight: 'normal'}}>days</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Completion</div>
                  <div style={{ fontSize: 32, fontWeight: 500 }}>{percentage}%</div>
                </div>
              </div>

              <div style={{ width: '100%', overflowX: 'auto', paddingBottom: 10 }}>
                <HeatMap completedDates={habit.completedDates} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <GlassButton 
                  onClick={() => toggleToday(habit.id)} 
                  style={{ 
                    background: doneToday ? 'var(--glass-strong)' : 'var(--glass)',
                    borderColor: doneToday ? 'var(--border-strong)' : 'var(--border)',
                    padding: '14px 32px',
                    fontSize: 16
                  }}
                >
                  {doneToday ? 'Done Today ✓' : 'Mark as Done'}
                </GlassButton>
              </div>
            </motion.div>
          );
        })}
        {house.habits.length === 0 && (
          <div style={{ color: 'var(--text-2)', textAlign: 'center', marginTop: 40 }}>No habits yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
