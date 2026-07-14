import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Settings,
  X,
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight,
  PieChart,
  Scale,
  Bell,
  Kanban
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { socket } from '../../services/socket';
import './Sidebar.css';

const Sidebar = ({ userRole, isMobileOpen, setMobileOpen }) => {
  const { logout, user } = useContext(AuthContext);
  const [openMenus, setOpenMenus] = useState({});
  const [portariaCount, setPortariaCount] = useState(0);
  const [hasNewPortariaUpdate, setHasNewPortariaUpdate] = useState(false);

  const fetchPortariaCount = async () => {
    try {
      const res = await api.get('/portaria');
      const count = res.data.filter(r => r.Status === 'Na Portaria').length;
      setPortariaCount(count);
      return count;
    } catch (e) {
      console.error('Erro ao buscar portaria', e);
      return 0;
    }
  };

  useEffect(() => {
    fetchPortariaCount();

    const handlePortariaEvent = async () => {
      const newCount = await fetchPortariaCount();
      if (newCount > 0) {
         setHasNewPortariaUpdate(true);
      } else {
         setHasNewPortariaUpdate(false);
      }
    };

    socket.on('portaria_evento', handlePortariaEvent);
    return () => socket.off('portaria_evento', handlePortariaEvent);
  }, []);

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  // Define os menus baseado no perfil
  const menus = [];

  const permissoes = user?.permissoes || [];
  const hasPerm = (p) => permissoes.includes('*') || permissoes.includes(p);
  
  // Telas Principais
  if (hasPerm('TELA_KANBAN')) {
     menus.push({ name: 'Kanban Expedição', path: '/', icon: <Kanban size={20} /> });
  }
  
  if (hasPerm('TELA_PORTARIA')) {
     menus.push({ name: 'Portaria', path: '/portaria', icon: <Truck size={20} />, badge: portariaCount > 0 ? portariaCount : null, hasNew: hasNewPortariaUpdate });
  }

  // Submenu de Cadastros
  const cadastrosSub = [];
  if (hasPerm('TELA_CADASTRO_PECAS')) cadastrosSub.push({ name: 'Peças', path: '/cadastros/pecas' });
  if (hasPerm('TELA_CADASTRO_EMBALAGENS')) cadastrosSub.push({ name: 'Embalagens', path: '/cadastros/embalagens' });
  if (hasPerm('TELA_CADASTRO_CLIENTES')) cadastrosSub.push({ name: 'Clientes', path: '/cadastros/clientes' });
  if (hasPerm('TELA_CADASTRO_TRANSPORTADORAS')) cadastrosSub.push({ name: 'Transportadoras', path: '/cadastros/transportadoras' });
  if (hasPerm('TELA_CADASTRO_USUARIOS')) cadastrosSub.push({ name: 'Usuários', path: '/cadastros/usuarios' });
  if (hasPerm('TELA_CADASTRO_PERFIS')) cadastrosSub.push({ name: 'Perfis e Permissões', path: '/cadastros/perfis' });
  if (hasPerm('TELA_CADASTRO_LIMITES_ATRASOS')) {
    cadastrosSub.push({ name: 'Tipos de Veículos (Limites)', path: '/cadastros/tipos-veiculo' });
    cadastrosSub.push({ name: 'Horário de Expediente', path: '/cadastros/expediente' });
    cadastrosSub.push({ name: 'Responsabilidades', path: '/cadastros/responsabilidades' });
    cadastrosSub.push({ name: 'Motivos de Atraso', path: '/cadastros/motivos' });
  }

  if (cadastrosSub.length > 0) {
     menus.push({
        name: 'Cadastros',
        icon: <Package size={20} />,
        subMenus: cadastrosSub
     });
  }

  if (hasPerm('TELA_FATURAMENTO')) {
     menus.push({
        name: 'Faturamento',
        icon: <FileText size={20} />,
        subMenus: [
          { name: 'A Faturar', path: '/faturamento' },
          { name: 'Faturadas', path: '/faturamento/historico' }
        ]
     });
  }

  // Saldo
  if (hasPerm('TELA_SALDO')) {
     menus.push({ name: 'Saldo de Peças', path: '/saldo', icon: <Scale size={20} /> });
  }

  // Submenu de Relatórios
  const relatoriosSub = [];
  if (hasPerm('TELA_TODAS_CARGAS')) relatoriosSub.push({ name: 'Todas as Cargas', path: '/relatorios/cargas' });
  if (hasPerm('TELA_DASHBOARD')) relatoriosSub.push({ name: 'Relatório de Tempos', path: '/relatorios/tempos' });
  if (hasPerm('TELA_PECAS_EXPEDIDAS')) relatoriosSub.push({ name: 'Peças Expedidas', path: '/relatorios/pecas-expedidas' });
  if (hasPerm('TELA_PORTARIA_HISTORICO')) relatoriosSub.push({ name: 'Histórico Portaria', path: '/portaria/historico' });

  if (relatoriosSub.length > 0) {
     menus.push({
        name: 'Relatórios',
        icon: <FileText size={20} />,
        subMenus: relatoriosSub
     });
  }

  // Lembretes
  if (hasPerm('TELA_LEMBRETES')) {
    menus.push({
      name: 'Lembretes',
      path: '/lembretes',
      icon: <Bell size={20} />
    });
  }

  // Settings
  if (hasPerm('TELA_CONFIGURACOES')) {
     menus.push({ name: 'Configurações', path: '/configuracoes', icon: <Settings size={20} /> });
  }

  // Operador
  if (hasPerm('TELA_PATIO')) {
    menus.push(
      { name: 'Pátio (Mobile)', path: '/patio', icon: <Truck size={20} /> }
    );
  }

  // Dashboard (Última Posição)
  if (hasPerm('TELA_DASHBOARD')) {
     menus.push({
        name: 'Dashboard',
        icon: <PieChart size={20} />,
        subMenus: [
          { name: 'Gerencial', path: '/dashboard' },
          { name: 'Gestão de Clientes', path: '/dashboard-clientes' },
          { name: 'Gestão de Atrasos', path: '/relatorios/atrasos' }
        ]
     });
  }


  // Fallback caso não tenha role mapeada
  if (menus.length === 0) {
    menus.push({ name: 'Home', path: '/', icon: <LayoutDashboard size={20} /> });
  }

  return (
    <>
      <div className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <h3 className="brand-text">Siderurgia<br/><span className="text-muted fs-6">Expedição</span></h3>
          </div>
          <button className="d-md-none btn btn-link text-dark" onClick={() => setMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menus.map((menu, index) => {
            if (menu.subMenus) {
              return (
                <div key={index} className="nav-group mb-1">
                  <div 
                    className="nav-item d-flex align-items-center justify-content-between cursor-pointer" 
                    onClick={() => toggleMenu(menu.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      <span className="nav-icon">{menu.icon}</span>
                      <span className="nav-label">{menu.name}</span>
                    </div>
                    {openMenus[menu.name] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  {openMenus[menu.name] && (
                    <div className="nav-submenu ps-4 mt-1 d-flex flex-column gap-1">
                      {menu.subMenus.map((sub, i) => (
                        <NavLink 
                          key={i} 
                          to={sub.path} 
                          end
                          className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}
                          onClick={() => setMobileOpen(false)}
                          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        >
                          <span className="nav-label">{sub.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink 
                key={index} 
                to={menu.path} 
                end
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setMobileOpen(false);
                  if (menu.name === 'Portaria') setHasNewPortariaUpdate(false);
                }}
              >
                <div className="d-flex align-items-center justify-content-between w-100">
                  <div className="d-flex align-items-center">
                    <span className="nav-icon">{menu.icon}</span>
                    <span className="nav-label">{menu.name}</span>
                  </div>
                  {menu.badge && (
                    <span 
                      className={`badge rounded-circle ms-2 d-flex align-items-center justify-content-center ${menu.hasNew ? 'bg-danger' : 'bg-secondary'}`} 
                      style={{ 
                        width: '22px', 
                        height: '22px', 
                        fontSize: '0.75rem',
                        color: 'white'
                      }}
                    >
                      {menu.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
          
          <div className="mt-auto pt-3 border-top">
            <button className="nav-item btn btn-link text-danger w-100 text-start text-decoration-none" onClick={logout}>
              <span className="nav-icon"><LogOut size={20} /></span>
              <span className="nav-label">Sair</span>
            </button>
          </div>
        </nav>
      </div>
      
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div className="sidebar-overlay d-md-none" onClick={() => setMobileOpen(false)}></div>
      )}
    </>
  );
};

export default Sidebar;
