import React, { useState, useEffect, useContext } from 'react';
import { Bell, Check, BellRing, Smartphone } from 'lucide-react';
import { socket } from '../../services/socket';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true);
    }
  }, []);

  // Helper Base64
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Seu navegador não suporta notificações Push.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permissão negada.');
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      const res = await api.get('/push/vapidPublicKey');
      const publicKey = res.data.publicKey;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      
      await api.post('/push/subscribe', subscription);
      setPushEnabled(true);
      toast.success('Notificações no celular ativadas!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao ativar notificações nativas.');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Entrar na sala do usuário no socket (e re-entrar se o socket reconectar após bloqueio de tela)
    socket.emit('join_user_room', user.id);
    
    const handleReconnect = () => {
      socket.emit('join_user_room', user.id);
    };
    socket.on('connect', handleReconnect);

    // Carregar histórico
    const fetchHistorico = async () => {
      try {
        const res = await api.get('/lembretes/historico');
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.Lida).length);
      } catch (err) {
        console.error('Erro ao buscar histórico de lembretes', err);
      }
    };
    fetchHistorico();

    // Escutar novos lembretes
    const handleNovaNotificacao = (nova) => {
      setNotifications(prev => [nova, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);

      // Popup bonito no top-right com cantos mais arredondados e mais largo
      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
            bg-white shadow-lg pointer-events-auto d-flex border-start border-4 ${nova.Tipo === 'CUSTOMIZADO' ? 'border-warning' : 'border-primary'}`}
          style={{ 
            padding: '1.25rem', 
            borderLeftWidth: '6px', 
            borderRadius: '16px', 
            width: '400px', 
            maxWidth: '90vw' 
          }}
        >
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <BellRing size={18} className={nova.Tipo === 'CUSTOMIZADO' ? 'text-warning' : 'text-primary'} />
              <strong className="text-dark fs-6">{nova.Tipo === 'CUSTOMIZADO' ? 'Lembrete' : 'Sistema de Expedição'}</strong>
            </div>
            <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>{nova.Mensagem}</p>
          </div>
          <button 
            className="btn btn-sm btn-link text-secondary p-0 ms-3 align-self-start"
            onClick={() => toast.dismiss(t.id)}
            style={{ fontSize: '1.5rem', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ), { duration: 8000 });
    };

    socket.on('notificacao_evento', handleNovaNotificacao);
    return () => {
      socket.off('notificacao_evento', handleNovaNotificacao);
      socket.off('connect', handleReconnect);
    };
  }, [user]);

  const marcarComoLida = async (idLembrete) => {
    try {
      await api.put(`/lembretes/historico/${idLembrete}/lida`);
      setNotifications(prev => prev.map(n => n.ID_Lembrete === idLembrete ? { ...n, Lida: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLimparTodos = async () => {
    try {
      await api.put('/lembretes/historico/limpar');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao limpar notificações');
    }
  };

  return (
    <div className="dropdown notification-bell ms-3 me-2">
      <button 
        className="btn btn-light position-relative p-2 border-0 rounded-circle" 
        type="button" 
        data-bs-toggle="dropdown" 
        data-bs-auto-close="outside"
      >
        <Bell size={20} className="text-dark" />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <ul className="dropdown-menu dropdown-menu-end shadow border-0 notification-dropdown p-0">
        <li className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top">
          <strong className="m-0">Lembretes</strong>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={handleLimparTodos} style={{ fontSize: '0.75rem' }}>
              Limpar Todos
            </button>
            <span className="badge bg-primary rounded-pill">{unreadCount} novos</span>
          </div>
        </li>
        <div className="notification-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <li className="p-4 text-center text-muted small">Nenhum lembrete ainda.</li>
          ) : (
            notifications.map(n => (
              <li key={n.ID_Lembrete} className={`p-3 border-bottom notification-item ${!n.Lida ? 'bg-light' : ''}`}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="pe-2">
                    <p className="mb-1 small" style={{ color: !n.Lida ? '#000' : '#6c757d', fontWeight: !n.Lida ? '600' : 'normal' }}>
                      {n.Mensagem}
                    </p>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {new Date(typeof n.Data_Criacao === 'string' && n.Data_Criacao.endsWith('Z') ? n.Data_Criacao.slice(0, -1) : n.Data_Criacao).toLocaleString('pt-BR')}
                    </small>
                  </div>
                  {!n.Lida && (
                    <button 
                      className="btn btn-sm btn-link p-0 text-success" 
                      onClick={() => marcarComoLida(n.ID_Lembrete)}
                      title="Marcar como lida"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </div>
        {!pushEnabled && (
          <div className="p-2 border-top bg-light text-center">
            <button className="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-2" onClick={enablePushNotifications}>
              <Smartphone size={16} /> Ativar Alertas no Celular
            </button>
          </div>
        )}
      </ul>
    </div>
  );
};

export default NotificationBell;
