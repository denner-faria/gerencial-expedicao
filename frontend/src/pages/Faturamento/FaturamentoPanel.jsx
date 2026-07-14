import React, { useState, useEffect, useContext, useRef } from 'react';
import { getCargas, updateStatusFaturamento } from '../../features/kanban/api/kanbanApi';
import { socket } from '../../services/socket';
import { AuthContext } from '../../context/AuthContext';
import { Bell, Truck, CheckCircle2, Clock, FileText } from 'lucide-react';
import FaturamentoModal from './FaturamentoModal';
import api from '../../services/api';

const FaturamentoPanel = () => {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  const { user } = useContext(AuthContext);
  const notificadasRef = useRef(new Set());
  const initialLoadDone = useRef(false);

  const fetchCargas = async () => {
    try {
      const data = await getCargas();
      // Filtrar apenas as que estejam liberadas para faturar, independente se estão carregadas
      const faturaveis = data.filter(c => 
        (c.Status_Faturamento === 'Liberado' || c.Status_Faturamento === 'Somente Embalagens')
      );
      setCargas(faturaveis);

      if (!initialLoadDone.current) {
        faturaveis.forEach(c => notificadasRef.current.add(c.ID_Carga));
        initialLoadDone.current = true;
      }
    } catch (error) {
      console.error('Erro ao buscar cargas para faturamento', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargas();
    
    // Solicitar permissão de notificação push
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const handleSocketEvent = (evento) => {
      fetchCargas();

      if (evento.acao === 'carga_atualizada' && evento.carga) {
        const { ID_Carga, Status_Faturamento, Nome_Carga } = evento.carga;
        const taLiberada = Status_Faturamento === 'Liberado' || Status_Faturamento === 'Somente Embalagens';
        
        if (!taLiberada) {
          notificadasRef.current.delete(ID_Carga);
        } else if (!notificadasRef.current.has(ID_Carga)) {
          notificadasRef.current.add(ID_Carga);
          
          // Tocar bipe simples usando web audio api
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch(e) {}

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nova Carga para Faturar!', {
              body: `${Nome_Carga} está ${Status_Faturamento}.`,
              icon: '/vite.svg'
            });
          }
        }
      }
    };

    socket.on('carga_evento', handleSocketEvent);
    return () => socket.off('carga_evento', handleSocketEvent);
  }, []);

  const handleMarcarFaturada = async (idCarga) => {
    setSelectedCargaId(idCarga);
  };

  const handleVoltarPCP = async (idCarga) => {
    if(!window.confirm("Deseja realmente voltar esta carga para o PCP (Não Liberado)? O líder poderá editá-la novamente.")) return;
    try {
      await updateStatusFaturamento(idCarga, 'Não Liberado', null, null);
      fetchCargas();
    } catch (err) {
      alert("Erro ao voltar carga: " + (err.response?.data?.message || err.message));
    }
  };

  const handleModalClose = () => {
    setSelectedCargaId(null);
  };

  const handleModalFaturado = () => {
    setSelectedCargaId(null);
    fetchCargas();
  };

  if (loading) {
    return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <Bell className="text-warning" /> Painel de Faturamento
          </h2>
          <p className="text-muted small mt-1">Cargas finalizadas no pátio e liberadas para emissão de nota.</p>
        </div>
      </div>

      {cargas.length === 0 ? (
        <div className="text-center p-5 bg-white rounded shadow-sm border">
          <CheckCircle2 size={48} className="text-success mb-3 opacity-50" />
          <h5 className="text-secondary fw-normal">Nenhuma carga aguardando faturamento no momento.</h5>
        </div>
      ) : (
        <div className="row row-cols-1 g-3">
          {cargas.map(carga => (
            <div key={carga.ID_Carga} className="col">
              <div className="card shadow-sm border-0 border-start border-primary border-4 hover-shadow transition-all">
                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                  
                  <div>
                    <h5 className="fw-bold text-dark mb-1">{carga.Nome_Carga}</h5>
                    <div className="text-secondary small mb-2 d-flex align-items-center gap-3">
                      <span><Truck size={14} className="me-1"/> {carga.Transportadora_Nome || 'Sem transportadora'}</span>
                      <span><Clock size={14} className="me-1"/> {carga.Status_Nome}</span>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <span className={`badge ${carga.Status_Faturamento === 'Liberado' ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2 rounded-pill`}>
                        {carga.Status_Faturamento}
                      </span>
                      {carga.PDF_Carga && (
                        <span 
                          className="badge bg-primary text-white border px-3 py-2 rounded-pill d-flex align-items-center gap-1" 
                          title="Visualizar Relatório (PDF)" 
                          style={{cursor: 'pointer'}} 
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${carga.PDF_Carga}`, '_blank'); 
                          }}
                        >
                          <FileText size={14} /> Ver PDF
                        </span>
                      )}
                      {carga.Arquivo_OF && (
                        <span 
                          className="badge bg-danger text-white border px-3 py-2 rounded-pill d-flex align-items-center gap-1" 
                          title="Documento OF Anexado" 
                          style={{cursor: 'pointer'}} 
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${carga.Arquivo_OF}`, '_blank'); 
                          }}
                        >
                          <FileText size={14} /> Ver OF
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="mb-2">
                      <span className="text-muted small d-block">Peso Bruto Total</span>
                      <strong className="fs-5 text-dark">{Number(carga.Peso_Total_Bruto || 0).toLocaleString('pt-BR')} kg</strong>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <button 
                        className="btn btn-primary fw-bold px-4 shadow-sm"
                        onClick={() => handleMarcarFaturada(carga.ID_Carga)}
                      >
                        Analisar e Faturar
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm fw-bold px-3 shadow-sm"
                        title="Voltar para o Líder editar as quantidades"
                        onClick={() => handleVoltarPCP(carga.ID_Carga)}
                      >
                        Voltar para PCP
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCargaId && (
        <FaturamentoModal 
          idCarga={selectedCargaId} 
          onClose={handleModalClose} 
          onFaturado={handleModalFaturado} 
        />
      )}
    </div>
  );
};

export default FaturamentoPanel;
