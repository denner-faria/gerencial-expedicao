import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import ExcelImportExport from '../../components/ExcelImportExport';

const TransportadorasList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [razaoSocial, setRazaoSocial] = useState('');
  const [codigoOlimpo, setCodigoOlimpo] = useState('');
  const [ativo, setAtivo] = useState(true);

  const fetchTransportadoras = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transportadoras');
      setItems(response.data);
    } catch (error) {
      alert('Erro ao carregar transportadoras: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportadoras();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setRazaoSocial(item.Razao_Social || '');
      setCodigoOlimpo(item.Codigo_Olimpo || '');
      setAtivo(item.Ativo);
    } else {
      setEditingItem(null);
      setRazaoSocial('');
      setCodigoOlimpo('');
      setAtivo(true);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!razaoSocial.trim()) return alert('Razão Social é obrigatória');
    
    const payload = {
      Razao_Social: razaoSocial,
      Codigo_Olimpo: codigoOlimpo,
      Ativo: ativo
    };

    try {
      if (editingItem) {
        await api.put(`/transportadoras/${editingItem.ID_Transportadora}`, payload);
      } else {
        await api.post('/transportadoras', payload);
      }
      handleCloseModal();
      fetchTransportadoras();
    } catch (error) {
      alert('Erro ao salvar transportadora: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transportadora?')) return;
    try {
      await api.delete(`/transportadoras/${id}`);
      fetchTransportadoras();
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const filteredItems = items.filter(item => 
    (item.Razao_Social || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.Codigo_Olimpo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Truck size={28} className="text-primary" /> 
            Cadastro de Transportadoras
          </h2>
          <p className="text-muted mb-0">Gerencie a base de transportadoras.</p>
        </div>
        <div className="d-flex gap-2">
          <ExcelImportExport entidade="transportadoras" onImportSuccess={fetchTransportadoras} />
          <button 
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => handleOpenModal()}
          >
            <Plus size={20} /> Nova Transportadora
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white p-3 border-bottom d-flex gap-3">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por razão social ou código..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Cód. Olimpo</th>
                <th>Razão Social</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">Carregando...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">Nenhuma transportadora encontrada.</td>
                </tr>
              ) : filteredItems.map(item => (
                <tr key={item.ID_Transportadora}>
                  <td className="fw-bold text-secondary">{item.Codigo_Olimpo || '-'}</td>
                  <td className="fw-semibold">{item.Razao_Social}</td>
                  <td>
                    <span className={`badge bg-${item.Ativo ? 'success' : 'danger'}`}>
                      {item.Ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-end">
                    <button 
                      className="btn btn-sm btn-light me-2"
                      onClick={() => handleOpenModal(item)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => handleDelete(item.ID_Transportadora)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light border-0">
                <h5 className="modal-title fw-bold">
                  {editingItem ? 'Editar Transportadora' : 'Nova Transportadora'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Código Olimpo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={codigoOlimpo}
                      onChange={e => setCodigoOlimpo(e.target.value)}
                      placeholder="Ex: TRP-01"
                    />
                    <div className="form-text">Código único da transportadora no sistema Olimpo.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Razão Social <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={razaoSocial}
                      onChange={e => setRazaoSocial(e.target.value)}
                      required
                      placeholder="Ex: Transportes Rápido LTDA"
                    />
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="ativoSwitch"
                      checked={ativo}
                      onChange={e => setAtivo(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="ativoSwitch">Ativo</label>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportadorasList;
