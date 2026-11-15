import React, { useRef } from 'react';

export default function GlassButton({ children, onClick, className = '', ...props }) {
  const btnRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btnRef.current.style.setProperty('--mx', `${x}px`);
    btnRef.current.style.setProperty('--my', `${y}px`);
  };

  return (
    <button
      ref={btnRef}
      className={`glass-btn ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </button>
  );
}
