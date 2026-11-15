import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassButton from './GlassButton';
import { useVault } from '../state/vault';
import logo from '../../assets/stealthbook.png';

export default function SetupScreen() {
  const { setup } = useVault();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSetup = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    try {
      await setup(password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 40, maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <img src={logo} alt="Logo" style={{ width: 64, height: 64, margin: '0 auto' }} />
        <h2 style={{ textAlign: 'center', color: 'var(--text-0)' }}>Create Master Password</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 12 }}>There is NO password recovery. If you forget it, your data is gone forever.</p>
        
        <input type="password" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} className="glass" style={{ padding: 12, color: 'var(--text-0)', outline: 'none' }} />
        <input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} className="glass" style={{ padding: 12, color: 'var(--text-0)', outline: 'none' }} />
        
        {error && <div style={{ color: 'var(--text-0)', textAlign: 'center', fontSize: 12, fontWeight: 'bold' }}>{error}</div>}
        
        <GlassButton onClick={handleSetup} type="button">Create Vault</GlassButton>
      </motion.div>
    </div>
  );
}
