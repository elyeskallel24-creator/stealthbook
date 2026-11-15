import React from 'react';
import { motion } from 'framer-motion';
import GlassButton from './GlassButton';
import imgTasks from '../../assets/room-tasks.png';
import imgNotes from '../../assets/room-notes.png';
import imgHabits from '../../assets/room-habits.png';

const rooms = [
  { name: 'Tasks', img: imgTasks },
  { name: 'Notes', img: imgNotes },
  { name: 'Habits', img: imgHabits },
];

export default function HouseView({ house, onBack, onOpenRoom }) {
  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <GlassButton onClick={onBack}>← Back</GlassButton>
        <h2 style={{ fontSize: 28, fontWeight: 500 }}>{house.name}</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 10 }}>
        {rooms.map((room) => (
          <motion.div
            key={room.name}
            onClick={() => onOpenRoom(room.name)}
            aria-label={room.name}
            role="button"
            tabIndex={0}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass room-card"
            style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer', 
              height: '240px',
              borderRadius: 24,
              padding: 0,
              overflow: 'hidden'
            }}
          >
            <div className="room-art-wrapper">
              <img 
                src={room.img} 
                alt={room.name}
                className="room-art"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
