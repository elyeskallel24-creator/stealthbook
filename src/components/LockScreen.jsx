import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassButton from './GlassButton';
import { useVault } from '../state/vault';
import logo from '../../assets/stealthbook.png';

export default function LockScreen() {
  const { unlock } = useVault();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return;
    try {
      await unlock(password);
    } catch (err) {
      setError('Incorrect password.');
      setShake(prev => prev + 1);
      setPassword('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20 }}>
      <motion.div
        key={shake}
        animate={shake > 0 ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="glass"
        style={{ padding: 40, maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <img src={logo} alt="Logo" style={{ width: 64, height: 64, margin: '0 auto' }} />
        <h2 style={{ textAlign: 'center', color: 'var(--text-0)' }}>Locked</h2>
        
        <input 
          type="password" 
          placeholder="Master Password" 
          value={password} 
          onChange={e => { setPassword(e.target.value); setError(''); }} 
          onKeyDown={e => e.key === 'Enter' && handleUnlock(e)}
          className="glass" 
          style={{ padding: 12, color: 'var(--text-0)', outline: 'none' }} 
          autoFocus
        />
        
        {error && <div style={{ color: 'var(--text-0)', textAlign: 'center', fontSize: 12, fontWeight: 'bold' }}>{error}</div>}
        
        <GlassButton onClick={handleUnlock} type="button">Unlock</GlassButton>
      </motion.div>
    </div>
  );
}
