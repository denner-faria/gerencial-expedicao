import React, { useState, useEffect, useContext } from 'react';
import { Clock, Truck, CheckCircle2, WifiOff } from 'lucide-react';
import api from '../../services/api';
import { socket } from '../../services/socket';
import { AuthContext } from '../../context/AuthContext';
import { getOfflineQueue, syncOfflineQueue } from '../../services/offlineSync';
import './PatioMobile.css';

// Componentes das Abas
import AguardandoTab from './Tabs/AguardandoTab';
import CarregandoTab from './Tabs/CarregandoTab';
import CarregadaTab from './Tabs/CarregadaTab';
import CargaDrawer from '../../features/kanban/components/CargaDrawer';

const PatioMobile = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('patioActiveTab') || 'aguardando';
  });
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [offlineItems, setOfflineItems] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleOpenCarga = (idCarga) => {
    setSelectedCargaId(idCarga);
    setIsDrawerOpen(true);
  };

  const fetchCargas = async () => {
    try {
      const { data } = await api.get('/cargas');
      setCargas(data);
    } catch (error) {
      console.error('Erro ao buscar cargas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('patioActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchCargas();

    // Ouvir eventos do WebSocket para atualizar a lista em tempo real
    socket.on('carga_evento', (evento) => {
      // Se houver qualquer alteração de status ou carregamento, recarrega a lista
      fetchCargas();
    });

    return () => socket.off('carga_evento');
  }, []);

  useEffect(() => {
    const checkOffline = () => {
      setIsOnline(navigator.onLine);
      setOfflineItems(getOfflineQueue().length);
    };
    
    checkOffline();
    
    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineQueue();
      fetchCargas();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', checkOffline);
    window.addEventListener('offlineQueueUpdated', checkOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', checkOffline);
      window.removeEventListener('offlineQueueUpdated', checkOffline);
    };
  }, []);

  // Filtragem local baseada na ordem do status para evitar problemas de ID variável no BD
  // Ordem 1 = Aguardando, 2 = Carregando, 3 = Carregada
  const cargasAguardando = cargas.filter(c => c.Status_Ordem === 1);
  const cargasCarregando = cargas.filter(c => c.Status_Ordem === 2);
  const today = new Date();
  
  const cargasCarregada = cargas.filter(c => {
    if (c.Status_Ordem !== 3 || c.Status_Faturamento === 'Faturada') return false;
    if (!c.Data_Inicio_Carregamento) return false;
    const cargaDate = new Date(c.Data_Inicio_Carregamento);
    return cargaDate.getDate() === today.getDate() &&
           cargaDate.getMonth() === today.getMonth() &&
           cargaDate.getFullYear() === today.getFullYear();
  });

  return (
    <div className="patio-mobile-container">
      {(!isOnline || offlineItems > 0) && (
        <div className="bg-warning text-dark px-3 py-2 small fw-bold d-flex align-items-center justify-content-center gap-2">
          <WifiOff size={16} /> 
          {!isOnline ? 'Você está offline.' : 'Sincronizando...'} 
          {offlineItems > 0 && ` (${offlineItems} ações na fila)`}
        </div>
      )}
      {/* Abas Superiores Fixas */}
      <div className="patio-tabs shadow-sm">
        <button 
          className={`tab-item ${activeTab === 'aguardando' ? 'active' : ''}`}
          onClick={() => setActiveTab('aguardando')}
        >
          <Clock size={20} />
          <span>Aguardando ({cargasAguardando.length})</span>
        </button>
        
        <button 
          className={`tab-item ${activeTab === 'carregando' ? 'active' : ''}`}
          onClick={() => setActiveTab('carregando')}
        >
          <Truck size={20} />
          <span>Carregando ({cargasCarregando.length})</span>
        </button>

        <button 
          className={`tab-item ${activeTab === 'carregada' ? 'active' : ''}`}
          onClick={() => setActiveTab('carregada')}
        >
          <CheckCircle2 size={20} />
          <span>Carregada ({cargasCarregada.length})</span>
        </button>
      </div>

      {/* Área de Conteúdo Scrollável */}
      <div className="patio-content">
        {loading ? (
          <div className="text-center mt-5"><div className="spinner-border text-danger"></div></div>
        ) : (
          <>
            {activeTab === 'aguardando' && <AguardandoTab cargas={cargasAguardando} reload={fetchCargas} onClickCarga={handleOpenCarga} />}
            {activeTab === 'carregando' && <CarregandoTab cargas={cargasCarregando} reload={fetchCargas} onClickCarga={handleOpenCarga} />}
            {activeTab === 'carregada'  && <CarregadaTab cargas={cargasCarregada} reload={fetchCargas} onClickCarga={handleOpenCarga} />}
          </>
        )}
      </div>

      <CargaDrawer 
        show={isDrawerOpen} 
        cargaId={selectedCargaId}
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
};

export default PatioMobile;
