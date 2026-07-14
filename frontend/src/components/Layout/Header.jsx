import React, { useContext } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';
import './Header.css';

const Header = ({ toggleMobileSidebar }) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="btn btn-link text-dark d-md-none p-0 me-3" onClick={toggleMobileSidebar}>
          <Menu size={24} />
        </button>
        <h5 className="m-0 page-title">Portal de Expedição</h5>
      </div>
      
      <div className="header-right d-flex align-items-center">
        <NotificationBell />
        <div className="user-profile dropdown">
          <button className="btn btn-light dropdown-toggle d-flex align-items-center gap-2 border-0" type="button" data-bs-toggle="dropdown">
            <div className="avatar-circle">
              <User size={18} />
            </div>
            <span className="d-none d-sm-inline fw-medium text-dark">{user?.Nome || user?.nome || 'Usuário'}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
            <li><div className="dropdown-header fw-bold text-dark fs-6">{user?.Nome || user?.nome || 'Usuário'}</div></li>
            <li><div className="dropdown-header">Perfil: {user?.Perfil || user?.perfil || 'Não definido'}</div></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={logout}>
                <LogOut size={16} /> Sair do Sistema
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
