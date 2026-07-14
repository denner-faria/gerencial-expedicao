import React, { useContext, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaBars, FaSignOutAlt, FaTasks, FaBoxOpen, FaUsers } from 'react-icons/fa';
import './MainLayout.css';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            {!collapsed && <h4>Portal Expedição</h4>}
            {collapsed && <h4>PE</h4>}
          </div>
          <button className="btn-toggle" onClick={() => setCollapsed(!collapsed)}>
            <FaBars />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item active" onClick={() => navigate('/')}>
              <FaTasks className="nav-icon" />
              {!collapsed && <span>Kanban</span>}
            </li>
            <li className="nav-item">
              <FaBoxOpen className="nav-icon" />
              {!collapsed && <span>Cargas</span>}
            </li>
            {/* Somente Admin/Supervisores deveriam ver usuários idealmente */}
            <li className="nav-item">
              <FaUsers className="nav-icon" />
              {!collapsed && <span>Usuários</span>}
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">{user?.nome}</div>
              <div className="user-role">{user?.perfil}</div>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout} title="Sair">
            <FaSignOutAlt />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        <header className="top-navbar">
          <div className="navbar-brand">
            Siderurgia S.A.
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
