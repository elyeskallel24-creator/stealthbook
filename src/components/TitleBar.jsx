import React from 'react';
import logo from '../../assets/stealthbook.png';

export default function TitleBar() {
  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <img src={logo} alt="Logo" className="titlebar-logo" />
        <span className="titlebar-title">Stealthbook</span>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={() => window.api.windowControl('minimize')}>—</button>
        <button className="titlebar-btn" onClick={() => window.api.windowControl('maximize')}>□</button>
        <button className="titlebar-btn close" onClick={() => window.api.windowControl('close')}>✕</button>
      </div>
    </div>
  );
}
