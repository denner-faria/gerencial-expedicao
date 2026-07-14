import React, { useEffect } from 'react';
import './Drawer.css';

const Drawer = ({ isOpen, onClose, title, children, width = '500px', headerRight, footer }) => {
  // Prevenir scroll do body quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="drawer-panel shadow-lg" style={{ width, maxWidth: '100vw' }}>
        <div className="drawer-header border-bottom">
          <h5 className="m-0 fw-bold">{title}</h5>
          <div className="d-flex align-items-center gap-3">
            {headerRight}
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
        </div>
        <div className="drawer-body">
          {children}
        </div>
        {footer && (
          <div className="drawer-footer border-top p-4 bg-light d-flex justify-content-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default Drawer;
