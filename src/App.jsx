import React, { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import SetupScreen from './components/SetupScreen';
import LockScreen from './components/LockScreen';
import Home from './components/Home';
import HouseView from './components/HouseView';
import TasksRoom from './components/TasksRoom';
import NotesRoom from './components/NotesRoom';
import HabitsRoom from './components/HabitsRoom';
import CommandPalette from './components/CommandPalette';
import { useVault } from './state/vault';

export default function App() {
  const { status, lock, data } = useVault();
  const [selectedHouseId, setSelectedHouseId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    if (status !== 'unlocked') {
      setSelectedHouseId(null);
      setSelectedRoom(null);
      setIsPaletteOpen(false);
      return;
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        lock();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        if (isPaletteOpen) {
          setIsPaletteOpen(false);
        } else if (selectedRoom) {
          setSelectedRoom(null);
        } else if (selectedHouseId) {
          setSelectedHouseId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => lock(), 5 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeoutId);
    };
  }, [status, lock, selectedHouseId, selectedRoom, isPaletteOpen]);

  const selectedHouse = data?.houses?.find(h => h.id === selectedHouseId);

  const handleNavigate = (houseId, room) => {
    setSelectedHouseId(houseId);
    setSelectedRoom(room);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: 40 }}>
      <TitleBar />
      
      {status === 'loading' && (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
          Loading...
        </div>
      )}

      {status === 'setup' && <SetupScreen />}
      
      {status === 'locked' && <LockScreen />}

      {status === 'unlocked' && (
        <>
          <div style={{ display: 'flex', gap: 8, padding: '16px 40px 0', fontSize: 13, color: 'var(--text-2)', alignItems: 'center' }}>
            <span onClick={() => { setSelectedHouseId(null); setSelectedRoom(null); }} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text-0)'} onMouseLeave={e => e.target.style.color = 'var(--text-2)'}>Home</span>
            {selectedHouse && (
              <>
                <span>›</span>
                <span onClick={() => setSelectedRoom(null)} style={{ cursor: 'pointer', transition: 'color 0.2s', color: selectedRoom ? 'var(--text-2)' : 'var(--text-0)' }} onMouseEnter={e => e.target.style.color = 'var(--text-0)'} onMouseLeave={e => e.target.style.color = selectedRoom ? 'var(--text-2)' : 'var(--text-0)'}>{selectedHouse.name}</span>
              </>
            )}
            {selectedRoom && (
              <>
                <span>›</span>
                <span style={{ color: 'var(--text-0)' }}>{selectedRoom}</span>
              </>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            {selectedHouse ? (
              selectedRoom === 'Tasks' ? (
                <TasksRoom house={selectedHouse} onBack={() => setSelectedRoom(null)} />
              ) : selectedRoom === 'Notes' ? (
                <NotesRoom house={selectedHouse} onBack={() => setSelectedRoom(null)} />
              ) : selectedRoom === 'Habits' ? (
                <HabitsRoom house={selectedHouse} onBack={() => setSelectedRoom(null)} />
              ) : (
                <HouseView house={selectedHouse} onBack={() => setSelectedHouseId(null)} onOpenRoom={setSelectedRoom} />
              )
            ) : (
              <Home onOpenHouse={setSelectedHouseId} />
            )}
          </div>
        </>
      )}

      {isPaletteOpen && (
        <CommandPalette 
          isOpen={isPaletteOpen} 
          onClose={() => setIsPaletteOpen(false)} 
          onNavigate={handleNavigate} 
        />
      )}
    </div>
  );
}
