import React, { useState, useEffect } from 'react';
import { getCargas } from '../../features/kanban/api/kanbanApi';
import { socket } from '../../services/socket';
import { Scale, Truck, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import SaldoModal from './components/SaldoModal';

const SaldoPanel = () => {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  
  // Filtro de data padrão: hoje
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const fetchCargas = async () => {
    try {
      const data = await getCargas();
      setCargas(data);
    } catch (error) {
      console.error('Erro ao buscar cargas para saldo', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargas();

    const handleSocketEvent = (evento) => {
      // Atualizar silenciosamente quando uma carga for alterada
      if (evento.acao === 'carga_atualizada' || evento.acao === 'carga_criada' || evento.acao === 'saldo_peca_atualizado' || evento.acao === 'peca_atualizada' || evento.acao === 'peca_adicionada') {
        fetchCargas();
      }
    };

    socket.on('carga_evento', handleSocketEvent);
    return () => socket.off('carga_evento', handleSocketEvent);
  }, []);

  const handleModalClose = () => {
    setSelectedCargaId(null);
    fetchCargas();
  };

  // Filtragem local
  const filteredCargas = cargas.filter(item => {
    if (!startDate && !endDate) return true;
    
    let matchesDate = true;
    if (item.Data) {
      const itemDateStr = new Date(item.Data).toISOString().split('T')[0];
      if (startDate && itemDateStr < startDate) matchesDate = false;
      if (endDate && itemDateStr > endDate) matchesDate = false;
    } else {
      matchesDate = false; // Se não tem data, esconde quando tem filtro
    }
    return matchesDate;
  });

  if (loading) {
    return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <Scale className="text-primary" /> Painel de Saldo
          </h2>
          <p className="text-muted small mt-1">Verificação de saldo em estoque das peças das cargas.</p>
        </div>
        
        <div className="d-flex align-items-center gap-2 bg-white p-2 rounded shadow-sm border">
            <span className="text-muted fw-bold">Período:</span>
            <input 
              type="date" 
              className="form-control form-control-sm" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span className="text-muted">até</span>
            <input 
              type="date" 
              className="form-control form-control-sm" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
        </div>
      </div>

      {filteredCargas.length === 0 ? (
        <div className="text-center p-5 bg-white rounded shadow-sm border">
          <Scale size={48} className="text-secondary mb-3 opacity-50" />
          <h5 className="text-secondary fw-normal">Nenhuma carga encontrada no período selecionado.</h5>
        </div>
      ) : (
        <div className="row row-cols-1 g-3">
          {filteredCargas.map(carga => {
             const faturada = carga.Status_Faturamento === 'Faturada';
             const saldoOk = carga.Saldo_Checado || faturada; // Cargas antigas faturadas devem ser consideradas OK
             
             return (
              <div key={carga.ID_Carga} className="col">
                <div className={`card shadow-sm border-0 border-start border-4 transition-all ${saldoOk ? 'border-success' : 'border-warning'}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedCargaId(carga.ID_Carga)}>
                  <div className="card-body p-4 d-flex justify-content-between align-items-center">
                    
                    <div>
                      <h5 className="fw-bold text-dark mb-1">{carga.Nome_Carga}</h5>
                      <div className="text-secondary small mb-2 d-flex align-items-center gap-3">
                        <span><Truck size={14} className="me-1"/> {carga.Transportadora_Nome || 'Sem transportadora'}</span>
                        <span><Clock size={14} className="me-1"/> {carga.Status_Nome}</span>
                      </div>
                      
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <span className={`badge ${faturada ? 'bg-success' : (carga.Status_Faturamento === 'Liberado' ? 'bg-info text-dark' : 'bg-secondary')} px-3 py-2 rounded-pill`}>
                          Faturamento: {carga.Status_Faturamento}
                        </span>
                        {carga.PDF_Carga && (
                          <span 
                            className="badge bg-primary text-white px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-sm" 
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
                      </div>
                    </div>

                    <div className="text-end d-flex flex-column align-items-end">
                      <div className="mb-2">
                        <span className="text-muted small d-block">Status Saldo</span>
                        {saldoOk ? (
                            <span className="badge bg-success bg-opacity-25 text-success fs-6 px-3 py-2 border border-success d-flex align-items-center gap-1">
                                <CheckCircle size={16} /> Saldo OK
                            </span>
                        ) : (
                            <span className="badge bg-warning bg-opacity-25 text-dark fs-6 px-3 py-2 border border-warning d-flex align-items-center gap-1">
                                <AlertTriangle size={16} className="text-warning" /> Pendente
                            </span>
                        )}
                      </div>
                      <button className="btn btn-outline-primary btn-sm px-4 fw-bold mt-2">
                        Verificar Peças
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedCargaId && (
        <SaldoModal 
          idCarga={selectedCargaId} 
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default SaldoPanel;
