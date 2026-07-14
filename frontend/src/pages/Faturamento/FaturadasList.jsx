import React, { useState, useEffect } from 'react';
import { getCargas } from '../../features/kanban/api/kanbanApi';
import { FileText, Search, Edit2 } from 'lucide-react';
import FaturamentoModal from './FaturamentoModal';

const FaturadasList = () => {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCargaId, setSelectedCargaId] = useState(null);

  const fetchCargas = async () => {
    try {
      setLoading(true);
      const data = await getCargas();
      // Filtra apenas as faturadas
      const faturadas = data.filter(c => c.Status_Faturamento === 'Faturada');
      setCargas(faturadas);
    } catch (error) {
      console.error('Erro ao buscar cargas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargas();
  }, []);

  const handleModalClose = () => {
    setSelectedCargaId(null);
  };

  const handleModalFaturado = () => {
    setSelectedCargaId(null);
    fetchCargas(); // Atualiza caso NFs tenham mudado
  };

  const filteredCargas = cargas.filter(c => 
    (c.Nome_Carga || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.Cliente_Nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ID_Carga.toString() === searchTerm
  );

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FileText size={28} className="text-primary" /> 
            Histórico de Faturamento
          </h2>
          <p className="text-muted mb-0">Consulte e edite notas de cargas já faturadas.</p>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white p-3 border-bottom d-flex gap-3">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por nome, cliente ou ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Data Faturada</th>
                <th>Nome da Carga</th>
                <th>Cliente</th>
                <th>Transportadora</th>
                <th>NFs Peças</th>
                <th>NFs Emb.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">Carregando histórico...</td>
                </tr>
              ) : filteredCargas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">Nenhuma carga faturada encontrada.</td>
                </tr>
              ) : filteredCargas.map(carga => (
                <tr key={carga.ID_Carga} style={{ cursor: 'pointer' }} onClick={() => setSelectedCargaId(carga.ID_Carga)}>
                  <td>
                    {new Date(carga.Data_Faturada || carga.Data_Atualizacao || carga.Data).toLocaleDateString('pt-BR')} 
                    <span className="text-muted ms-1 small">
                      {new Date(carga.Data_Faturada || carga.Data_Atualizacao || carga.Data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </td>
                  <td className="fw-semibold">{carga.Nome_Carga}</td>
                  <td>{carga.Cliente_Nome || '-'}</td>
                  <td>{carga.Transportadora_Nome || '-'}</td>
                  <td>
                    <span className="badge bg-light text-dark border">{carga.NFs_Pecas || '-'}</span>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">{carga.NFs_Embalagens || '-'}</span>
                  </td>
                  <td>
                    <span className="badge bg-success">Faturada</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

export default FaturadasList;
