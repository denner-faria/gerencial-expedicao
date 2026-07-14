import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Truck, Search, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';

const PortariaHistorico = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  
  const { user } = React.useContext(AuthContext);
  const isAdmin = user?.perfil === 'Admin' || user?.permissoes?.includes('*');

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const res = await api.get('/portaria/historico');
      setRegistros(res.data);
    } catch (error) {
      toast.error('Erro ao buscar histórico da portaria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, []);

  const filteredRegistros = registros.filter(r => {
    if (!dateFilter) return true;
    const rDate = new Date(r.Hora_Chegada.endsWith('Z') ? r.Hora_Chegada.slice(0, -1) : r.Hora_Chegada).toISOString().split('T')[0];
    return rDate === dateFilter;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Atenção: Tem certeza que deseja excluir este registro da portaria? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/portaria/${id}`);
      toast.success('Registro excluído com sucesso!');
      fetchHistorico();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir registro');
    }
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
          <Truck size={28} className="text-secondary" />
          Histórico da Portaria
        </h2>
        <p className="text-muted mb-0">Visão geral de todos os veículos registrados na expedição (Acesso Admin).</p>
      </div>

      <div className="card shadow-sm border-0 h-100">
        <div className="card-header bg-white border-0 pt-4 pb-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <h5 className="fw-bold d-flex align-items-center gap-2 m-0">
            <Search size={20} className="text-secondary" /> Todos os Registros
          </h5>
          <div className="d-flex align-items-center gap-3">
            <div className="input-group" style={{ maxWidth: '250px' }}>
              <span className="input-group-text bg-white"><Calendar size={18} /></span>
              <input 
                type="date" 
                className="form-control" 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value)} 
              />
              {dateFilter && (
                <button className="btn btn-outline-secondary" onClick={() => setDateFilter('')}>Limpar</button>
              )}
            </div>
            <button className="btn btn-outline-primary" onClick={fetchHistorico} disabled={loading}>
              Atualizar
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
          ) : filteredRegistros.length === 0 ? (
            <div className="text-center text-muted p-5 bg-light m-3 rounded border">
              Nenhum registro encontrado.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4">Chegada</th>
                    <th>Placa</th>
                    <th>Motorista</th>
                    <th>Veículo</th>
                    <th>Transportadora</th>
                    <th>Cliente</th>
                    <th>Carga</th>
                    <th>Saída</th>
                    <th>Status</th>
                    {isAdmin && <th className="text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistros.map(r => (
                    <tr key={r.ID_Portaria}>
                      <td className="px-4">
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">
                            {new Date(r.Hora_Chegada.endsWith('Z') ? r.Hora_Chegada.slice(0, -1) : r.Hora_Chegada).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-muted small">
                            {new Date(r.Hora_Chegada.endsWith('Z') ? r.Hora_Chegada.slice(0, -1) : r.Hora_Chegada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </td>
                      <td className="fw-bold text-nowrap">{r.Placa}</td>
                      <td>{r.Motorista}</td>
                      <td>{r.Veiculo}</td>
                      <td className="small text-muted">{r.Transportadora || '-'}</td>
                      <td className="small text-muted">{r.Cliente_Destino || '-'}</td>
                      <td>
                        {r.ID_Carga ? (
                          <span className="badge bg-success">{r.Nome_Carga}</span>
                        ) : (
                          <span className="badge bg-warning text-dark">Nenhuma</span>
                        )}
                      </td>
                      <td>
                        {r.Hora_Saida ? (
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">
                              {new Date(r.Hora_Saida.endsWith('Z') ? r.Hora_Saida.slice(0, -1) : r.Hora_Saida).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-muted small">
                              {new Date(r.Hora_Saida.endsWith('Z') ? r.Hora_Saida.slice(0, -1) : r.Hora_Saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {r.Status === 'Saída' ? (
                          <span className="badge bg-secondary">Concluído</span>
                        ) : (
                          <span className="badge bg-primary">No Pátio</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="text-center">
                          <button 
                            className="btn btn-sm btn-outline-danger border-0" 
                            title="Excluir Registro"
                            onClick={() => handleDelete(r.ID_Portaria)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortariaHistorico;
