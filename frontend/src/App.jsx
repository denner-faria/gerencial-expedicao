import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login/Login';
import Kanban from './pages/Kanban/Kanban';
import AppLayout from './components/Layout/AppLayout';
import PatioMobile from './pages/Patio/PatioMobile';
import IniciarCarregamento from './pages/Patio/IniciarCarregamento';
import FinalizarCarregamento from './pages/Patio/FinalizarCarregamento';
import PecasList from './pages/Cadastros/PecasList';
import EmbalagensList from './pages/Cadastros/EmbalagensList';
import ClientesList from './pages/Cadastros/ClientesList';
import TransportadorasList from './pages/Cadastros/TransportadorasList';
import UsuariosList from './pages/Cadastros/UsuariosList';
import FaturamentoPanel from './pages/Faturamento/FaturamentoPanel';
import FaturadasList from './pages/Faturamento/FaturadasList';
import PerfisList from './pages/Cadastros/PerfisList';
import TiposVeiculoList from './pages/Cadastros/TiposVeiculoList';
import ExpedienteList from './pages/Cadastros/ExpedienteList';
import ResponsabilidadesList from './pages/Cadastros/ResponsabilidadesList';
import MotivosList from './pages/Cadastros/MotivosList';
import RequirePasswordChange from './components/auth/RequirePasswordChange';
import TodasCargasList from './pages/Relatorios/TodasCargasList';
import PecasExpedidasList from './pages/Relatorios/PecasExpedidasList';
import Dashboard from './pages/Dashboard/Dashboard';
import GestaoClientesDashboard from './pages/Dashboard/GestaoClientesDashboard';
import PortariaDashboard from './pages/Portaria/PortariaDashboard';
import PortariaHistorico from './pages/Portaria/PortariaHistorico';
import AtrasosDashboard from './pages/Dashboard/AtrasosDashboard';
import RelatorioTemposList from './pages/Relatorios/RelatorioTemposList';
import ConfiguracoesGerais from './pages/Cadastros/ConfiguracoesGerais';
import SaldoPanel from './pages/Saldo/SaldoPanel';
import LembretesConfig from './pages/Lembretes/LembretesConfig';

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);
  const checkIsMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };
  
  const [isMobile, setIsMobile] = useState(checkIsMobile());

  useEffect(() => {
    // A checagem do User-Agent não muda com o resize, 
    // mas se quisermos ser dinâmicos para ferramentas de dev, podemos checar novamente (opcional).
    const handleResize = () => setIsMobile(checkIsMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (user?.permissoes?.includes('TELA_KANBAN') || user?.permissoes?.includes('*')) {
    return isMobile ? <Navigate to="/patio" replace /> : <Kanban />;
  }
  if (user?.permissoes?.includes('TELA_FATURAMENTO')) return <Navigate to="/faturamento" replace />;
  if (user?.permissoes?.includes('TELA_CADASTRO_PECAS')) return <Navigate to="/cadastros/pecas" replace />;
  
  // Fallbacks para perfis antigos ou usuários sem permissão específica de tela
  return <Navigate to="/patio" replace />;
};

// Wrapper de Rota Privada
const PrivateRoute = ({ children }) => {
  const { signed, loading, user } = useContext(AuthContext);
  
  if (loading) return <div className="p-5 text-center">Carregando...</div>;
  if (!signed) return <Navigate to="/login" replace />;
  if (user?.primeiroAcesso || user?.PrimeiroAcesso) return <RequirePasswordChange />;
  
  return children;
};
// Wrapper de Rota Protegida por Permissão
const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user } = useContext(AuthContext);
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Master bypass
  if (user.permissoes && user.permissoes.includes('*')) {
    return children;
  }
  
  if (requiredPermission && user.permissoes && !user.permissoes.includes(requiredPermission)) {
     return <div className="p-5 text-center text-danger fw-bold">Acesso Negado. Você não tem permissão para acessar esta página.</div>;
  }
  
  return children;
};
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Protegidas e com Layout */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          } 
        >
          {/* Rotas filhas do AppLayout (renderizadas no <Outlet />) */}
          <Route index element={<DashboardRouter />} />
          <Route path="cadastros/pecas" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_PECAS"><PecasList /></ProtectedRoute>} />
          <Route path="cadastros/embalagens" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_EMBALAGENS"><EmbalagensList /></ProtectedRoute>} />
          <Route path="cadastros/clientes" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_CLIENTES"><ClientesList /></ProtectedRoute>} />
          <Route path="cadastros/transportadoras" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_TRANSPORTADORAS"><TransportadorasList /></ProtectedRoute>} />
          <Route path="cadastros/usuarios" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_USUARIOS"><UsuariosList /></ProtectedRoute>} />
          <Route path="cadastros/perfis" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_PERFIS"><PerfisList /></ProtectedRoute>} />
          <Route path="cadastros/tipos-veiculo" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_LIMITES_ATRASOS"><TiposVeiculoList /></ProtectedRoute>} />
          <Route path="cadastros/expediente" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_LIMITES_ATRASOS"><ExpedienteList /></ProtectedRoute>} />
          <Route path="cadastros/responsabilidades" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_LIMITES_ATRASOS"><ResponsabilidadesList /></ProtectedRoute>} />
          <Route path="cadastros/motivos" element={<ProtectedRoute requiredPermission="TELA_CADASTRO_LIMITES_ATRASOS"><MotivosList /></ProtectedRoute>} />
          
          <Route path="configuracoes" element={<ConfiguracoesGerais />} />

          <Route path="patio" element={<PatioMobile />} />
          <Route path="patio/iniciar/:id" element={<IniciarCarregamento />} />
          <Route path="patio/finalizar/:id" element={<FinalizarCarregamento />} />
          <Route path="faturamento" element={<FaturamentoPanel />} />
          <Route path="faturamento/historico" element={<FaturadasList />} />
          <Route path="saldo" element={<SaldoPanel />} />
          
          <Route path="lembretes" element={<LembretesConfig />} />
          
          <Route path="relatorios/cargas" element={<ProtectedRoute requiredPermission="TELA_TODAS_CARGAS"><TodasCargasList /></ProtectedRoute>} />
          <Route path="relatorios/tempos" element={<ProtectedRoute requiredPermission="TELA_TODAS_CARGAS"><RelatorioTemposList /></ProtectedRoute>} />
          <Route path="relatorios/pecas-expedidas" element={<ProtectedRoute requiredPermission="TELA_PECAS_EXPEDIDAS"><PecasExpedidasList /></ProtectedRoute>} />
          
          <Route path="dashboard" element={<ProtectedRoute requiredPermission="TELA_DASHBOARD"><Dashboard /></ProtectedRoute>} />
          <Route path="dashboard-clientes" element={<ProtectedRoute requiredPermission="TELA_DASHBOARD"><GestaoClientesDashboard /></ProtectedRoute>} />
          <Route path="relatorios/atrasos" element={<ProtectedRoute requiredPermission="TELA_DASHBOARD"><AtrasosDashboard /></ProtectedRoute>} />
          
          <Route path="portaria" element={<ProtectedRoute requiredPermission="TELA_PORTARIA"><PortariaDashboard /></ProtectedRoute>} />
          <Route path="portaria/historico" element={<ProtectedRoute requiredPermission="TELA_PORTARIA_HISTORICO"><PortariaHistorico /></ProtectedRoute>} />
        </Route>
        
        {/* Redireciona qualquer lixo para home/login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
