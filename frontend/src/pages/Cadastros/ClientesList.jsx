import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import ExcelImportExport from '../../components/ExcelImportExport';

const ClientesList = () => {
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
  const [requerOF, setRequerOF] = useState(true);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes');
      setItems(response.data);
    } catch (error) {
      alert('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setRazaoSocial(item.Razao_Social || '');
      setCodigoOlimpo(item.Codigo_Olimpo || '');
      setAtivo(item.Ativo);
      setRequerOF(item.Requer_OF !== undefined ? item.Requer_OF : true);
    } else {
      setEditingItem(null);
      setRazaoSocial('');
      setCodigoOlimpo('');
      setAtivo(true);
      setRequerOF(true);
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
      Codigo_Olimpo: codigoOlimpo || null,
      Ativo: ativo,
      Requer_OF: requerOF
    };

    try {
      if (editingItem) {
        await api.put(`/clientes/${editingItem.ID_Cliente}`, payload);
      } else {
        await api.post('/clientes', payload);
      }
      handleCloseModal();
      fetchClientes();
    } catch (error) {
      alert('Erro ao salvar cliente: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      fetchClientes();
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
            <Users size={28} className="text-primary" /> 
            Cadastro de Clientes
          </h2>
          <p className="text-muted mb-0">Gerencie a base de clientes da empresa.</p>
        </div>
        <div className="d-flex gap-2">
          <ExcelImportExport entidade="clientes" onImportSuccess={fetchClientes} />
          <button 
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => handleOpenModal()}
          >
            <Plus size={20} /> Novo Cliente
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
                <th>Exige OF?</th>
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
                  <td colSpan="4" className="text-center py-4 text-muted">Nenhum cliente encontrado.</td>
                </tr>
              ) : filteredItems.map(item => (
                <tr key={item.ID_Cliente}>
                  <td className="fw-bold text-secondary">{item.Codigo_Olimpo || '-'}</td>
                  <td className="fw-semibold">{item.Razao_Social}</td>
                  <td>
                    <span className={`badge bg-${item.Requer_OF ? 'primary' : 'secondary'}`}>
                      {item.Requer_OF ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${item.Ativo ? 'success' : 'danger'}`}>
                      {item.Ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-end">
                    <button 
                      className="btn btn-sm btn-light me-2"
                      onClick={() => handleOpenModal(item)}
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn btn-sm btn-light text-danger"
                      onClick={() => handleDelete(item.ID_Cliente)}
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

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light border-bottom-0">
                <h5 className="modal-title fw-bold">
                  {editingItem ? 'Editar Cliente' : 'Novo Cliente'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSave}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Razão Social <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={razaoSocial}
                      onChange={e => setRazaoSocial(e.target.value)}
                      required
                      placeholder="Ex: Construtora Alpha S.A"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Código Olimpo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={codigoOlimpo}
                      onChange={e => setCodigoOlimpo(e.target.value)}
                      placeholder="Ex: 98765"
                    />
                    <div className="form-text">Usado na validação da importação por Excel.</div>
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      checked={ativo}
                      onChange={e => setAtivo(e.target.checked)}
                      id="ativoSwitch"
                    />
                    <label className="form-check-label fw-medium" htmlFor="ativoSwitch">
                      {ativo ? 'Cadastro Ativo' : 'Cadastro Inativo'}
                    </label>
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      checked={requerOF}
                      onChange={e => setRequerOF(e.target.checked)}
                      id="requerOFSwitch"
                    />
                    <label className="form-check-label fw-medium text-danger" htmlFor="requerOFSwitch">
                      Requer Anexo de OF (Faturamento)
                    </label>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-light" onClick={handleCloseModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary px-4">
                      {editingItem ? 'Salvar Alterações' : 'Cadastrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesList;
