import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, setup, locked, unlocked
  const saveTimeout = useRef(null);

  useEffect(() => {
    window.api.checkVaultExists().then(exists => {
      setStatus(exists ? 'locked' : 'setup');
    });
  }, []);

  const saveData = (newData) => {
    setData(newData);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      window.api.saveVault(newData).catch(console.error);
    }, 500);
  };

  const setup = async (password) => {
    const initialData = await window.api.setupVault(password);
    setData(initialData);
    setStatus('unlocked');
  };

  const unlock = async (password) => {
    const decrypted = await window.api.unlockVault(password);
    setData(decrypted);
    setStatus('unlocked');
  };

  const lock = () => {
    window.api.lockVault();
    setData(null);
    setStatus('locked');
  };

  return React.createElement(
    VaultContext.Provider,
    { value: { data, status, setup, unlock, lock, saveData } },
    children
  );
}

export const useVault = () => useContext(VaultContext);
