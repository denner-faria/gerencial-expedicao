import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Truck, LogIn, LogOut, Search, Trash2, ArrowDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

const PortariaDashboard = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Placa: '',
    Motorista: '',
    ID_Tipo_Veiculo: '',
    Veiculo: '',
    Transportadora: '',
    Cliente_Destino: ''
  });
  const [clientes, setClientes] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [tiposVeiculo, setTiposVeiculo] = useState([]);

  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const res = await api.get('/portaria');
      setRegistros(res.data);
    } catch (error) {
      toast.error('Erro ao buscar registros da portaria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
    const loadSupportData = async () => {
      try {
        const [cData, tData, tvData] = await Promise.all([
          api.get('/clientes').then(r => r.data),
          api.get('/transportadoras').then(r => r.data),
          api.get('/config-atrasos/tipos-veiculo').then(r => r.data)
        ]);
        setClientes(cData.filter(c => c.Ativo));
        setTransportadoras(tData.filter(t => t.Ativo));
        setTiposVeiculo(tvData.filter(tv => tv.Ativo));
      } catch (err) {
        console.error('Erro ao carregar dados de suporte', err);
      }
    };
    loadSupportData();
  }, []);

  useEffect(() => {
    // Connect to websocket to receive real-time notifications
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000');
    
    socket.on('veiculo_liberado', (data) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex align-items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 fw-bold text-danger">⚠️ Veículo Liberado!</p>
                <p className="mt-1 text-sm text-gray-500">{data.Mensagem}</p>
              </div>
            </div>
          </div>
          <div className="d-flex border-l border-gray-200">
            <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              OK
            </button>
          </div>
        </div>
      ), { duration: 10000 });
      
      // Auto-refresh the list
      fetchRegistros();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'ID_Tipo_Veiculo') {
      const selectedTv = tiposVeiculo.find(tv => tv.ID_Tipo_Veiculo === parseInt(value));
      setFormData(prev => ({ 
        ...prev, 
        ID_Tipo_Veiculo: value, 
        Veiculo: selectedTv ? selectedTv.Nome : '' 
      }));
    } else {
      const shouldUpperCase = name === 'Placa' || name === 'Motorista';
      setFormData(prev => ({ ...prev, [name]: shouldUpperCase ? value.toUpperCase() : value }));
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    try {
      if (!formData.Placa || !formData.Motorista || !formData.Veiculo) {
        toast.error('Preencha os campos obrigatórios (Placa, Motorista, Veículo)');
        return;
      }
      await api.post('/portaria/checkin', formData);
      toast.success('Entrada registrada com sucesso!');
      setFormData({
        Placa: '',
        Motorista: '',
        ID_Tipo_Veiculo: '',
        Veiculo: '',
        Transportadora: '',
        Cliente_Destino: ''
      });
      fetchRegistros();
    } catch (error) {
      toast.error('Erro ao registrar entrada');
    }
  };

  const handleConfirmarDescida = async (id) => {
    try {
      await api.patch(`/portaria/${id}/confirmar-descida`);
      toast.success('Descida confirmada! Veículo no pátio.');
      fetchRegistros();
    } catch (error) {
      toast.error('Erro ao confirmar descida');
    }
  };

  const handleCheckout = async (id) => {
    if (!window.confirm('Confirma a saída deste veículo do pátio?')) return;
    try {
      await api.patch(`/portaria/${id}/checkout`);
      toast.success('Saída registrada com sucesso!');
      fetchRegistros();
    } catch (error) {
      toast.error('Erro ao registrar saída');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro? Isso não pode ser desfeito.')) return;
    try {
      await api.delete(`/portaria/${id}`);
      toast.success('Registro excluído com sucesso!');
      fetchRegistros();
    } catch (error) {
      toast.error('Erro ao excluir registro');
    }
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
          <Truck size={28} className="text-primary" />
          Controle de Portaria
        </h2>
        <p className="text-muted mb-0">Registre a entrada e saída física dos veículos no pátio.</p>
      </div>

      <div className="row">
        {/* Formulário de Check-in */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h5 className="fw-bold d-flex align-items-center gap-2">
                <LogIn size={20} className="text-success" /> Registrar Entrada
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleCheckin}>
                <div className="mb-3">
                  <label className="form-label fw-medium">Placa *</label>
                  <input type="text" className="form-control" name="Placa" value={formData.Placa} onChange={handleInputChange} required placeholder="ABC-1234" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Motorista *</label>
                  <input type="text" className="form-control" name="Motorista" value={formData.Motorista} onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Veículo *</label>
                  <select className="form-select" name="ID_Tipo_Veiculo" value={formData.ID_Tipo_Veiculo || ''} onChange={handleInputChange} required>
                    <option value="">Selecione...</option>
                    {tiposVeiculo.map(tv => (
                      <option key={tv.ID_Tipo_Veiculo} value={tv.ID_Tipo_Veiculo}>{tv.Nome} (Limite: {tv.Tempo_Limite_Minutos}m)</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Transportadora</label>
                  <select className="form-select" name="Transportadora" value={formData.Transportadora} onChange={handleInputChange}>
                    <option value="">Selecione a Transportadora...</option>
                    {transportadoras.map(t => (
                      <option key={t.ID_Transportadora} value={t.Razao_Social}>{t.Razao_Social}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-medium">Cliente/Destino</label>
                  <select className="form-select" name="Cliente_Destino" value={formData.Cliente_Destino} onChange={handleInputChange}>
                    <option value="">Selecione o Cliente...</option>
                    {clientes.map(c => (
                      <option key={c.ID_Cliente} value={c.Razao_Social}>{c.Razao_Social}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-success w-100 fw-bold py-2">
                  <LogIn size={20} className="me-2" /> Registrar Entrada
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Lista de Veículos no Pátio */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold d-flex align-items-center gap-2">
                <Search size={20} className="text-secondary" /> Veículos no Pátio
              </h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchRegistros} disabled={loading}>
                Atualizar Lista
              </button>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center p-4"><div className="spinner-border text-primary"></div></div>
              ) : registros.length === 0 ? (
                <div className="text-center text-muted p-5 bg-light rounded border">
                  Nenhum veículo no pátio no momento.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th className="text-nowrap" style={{ minWidth: '90px' }}>Placa</th>
                        <th>Motorista</th>
                        <th>Veículo</th>
                        <th>Transportadora</th>
                        <th>Cliente</th>
                        <th>Chegada</th>
                        <th>Carga Vinculada</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const noPatio = registros.filter(r => r.Status !== 'Saída');
                        if (noPatio.length === 0) {
                          return (
                            <tr>
                              <td colSpan="9" className="text-center text-muted py-5">
                                Nenhum veículo no pátio ou aguardando no momento.
                              </td>
                            </tr>
                          );
                        }
                        return noPatio.map(r => (
                          <tr key={r.ID_Portaria}>
                            <td>
                              <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDelete(r.ID_Portaria)} title="Excluir Registro">
                                <Trash2 size={16} />
                              </button>
                            </td>
                            <td className="fw-bold text-nowrap">{r.Placa}</td>
                            <td>{r.Motorista}</td>
                            <td>{r.Veiculo}</td>
                            <td className="small text-muted">{r.Transportadora || '-'}</td>
                            <td className="small text-muted">{r.Cliente_Destino || '-'}</td>
                            <td>
                              {new Date(r.Hora_Chegada.endsWith('Z') ? r.Hora_Chegada.slice(0, -1) : r.Hora_Chegada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td>
                              {r.ID_Carga ? (
                                <span className="badge bg-success">{r.Nome_Carga}</span>
                              ) : r.Status === 'Na Portaria' ? (
                                <span className="badge bg-secondary text-white">Lá fora</span>
                              ) : (
                                <span className="badge bg-warning text-dark">Aguardando</span>
                              )}
                            </td>
                            <td>
                              {r.Status === 'Saída' ? (
                                <span className="text-muted small">Já saiu</span>
                              ) : r.Status === 'Aguardando Descida' ? (
                                <button 
                                  className="btn btn-warning d-flex align-items-center justify-content-center gap-1 text-dark fw-bold" 
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} 
                                  onClick={() => handleConfirmarDescida(r.ID_Portaria)}
                                >
                                  <ArrowDown size={14} /> Liberar Descida
                                </button>
                              ) : r.Status === 'Na Portaria' ? (
                                <span className="text-muted small">Aguardando Líder</span>
                              ) : (
                                <button 
                                  className="btn btn-danger d-flex align-items-center justify-content-center gap-1" 
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} 
                                  onClick={() => handleCheckout(r.ID_Portaria)}
                                >
                                  <LogOut size={14} /> Liberar Saída
                                </button>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortariaDashboard;
