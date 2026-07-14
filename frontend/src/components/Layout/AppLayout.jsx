import React, { useState, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { AuthContext } from '../../context/AuthContext';
import './AppLayout.css';

const AppLayout = () => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const { user } = useContext(AuthContext);

  // Mapeia o role baseado no objeto do usuario retornado pelo auth
  const roleName = user?.perfil || 'Lider';

  return (
    <div className="app-layout">
      <Sidebar userRole={roleName} isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="main-content">
        <Header toggleMobileSidebar={() => setMobileOpen(!isMobileOpen)} />
        
        <main className="page-content">
          <Outlet /> {/* Aqui renderizam as rotas filhas */}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
