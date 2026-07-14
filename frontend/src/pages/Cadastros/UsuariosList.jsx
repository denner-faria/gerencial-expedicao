import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Search, Edit2, Trash2, Users, ShieldAlert } from 'lucide-react';
import ExcelImportExport from '../../components/ExcelImportExport';
import api from '../../services/api';

const UsuariosList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [perfis, setPerfis] = useState([]);
  
  const [formData, setFormData] = useState({
    Nome: '',
    Login: '',
    Senha: '',
    ID_Perfil: '',
    Ativo: true
  });

  const fetchPerfis = async () => {
    try {
      const { data } = await api.get('/usuarios/perfis'); // ou api.get('/perfis')
      setPerfis(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchPerfis();
  }, []);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        Nome: item.Nome,
        Login: item.Login,
        Senha: '', // leave empty on edit
        ID_Perfil: item.ID_Perfil,
        Ativo: item.Ativo
      });
    } else {
      setFormData({
        Nome: '',
        Login: '',
        Senha: '',
        ID_Perfil: '',
        Ativo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/usuarios/${editingItem.ID_Usuario}`, formData);
      } else {
        await api.post('/usuarios', formData);
      }
      handleCloseModal();
      fetchUsuarios();
    } catch (error) {
      alert('Erro ao salvar: ' + (error.response?.data?.message || error.message));
    }
  };


  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/usuarios');
      setItems(data);
    } catch (error) {
      console.error("Erro ao buscar usuários", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      fetchUsuarios();
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Users size={28} className="text-primary" /> 
            Controle de Acessos
          </h2>
          <p className="text-muted mb-0">Gerencie os usuários e permissões do sistema.</p>
        </div>
        <div className="d-flex gap-2">
          <ExcelImportExport entidade="usuarios" />
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
            <Plus size={20} /> Novo Usuário
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white p-3 border-bottom d-flex gap-3">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input type="text" className="form-control" placeholder="Buscar usuário..." />
          </div>
        </div>
        <div className="table-responsive">
          {loading ? (
            <div className="p-4 text-center">Carregando usuários...</div>
          ) : (
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nome Completo</th>
                  <th>Login</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-4">Nenhum usuário encontrado.</td></tr>
                ) : items.map(item => (
                  <tr key={item.ID_Usuario}>
                    <td className="fw-semibold">{item.Nome}</td>
                    <td>{item.Login}</td>
                    <td><span className="badge bg-secondary">{item.Perfil_Nome}</span></td>
                    <td>
                      <span className={`badge bg-${item.Ativo ? 'success' : 'danger'}`}>
                        {item.Ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-light me-2" onClick={() => handleOpenModal(item)}><Edit2 size={16} /></button>
                      <button 
                        className="btn btn-sm btn-light text-danger"
                        onClick={() => handleDelete(item.ID_Usuario)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light border-bottom-0">
                <h5 className="modal-title fw-bold">
                  {editingItem ? 'Editar Usuário' : 'Novo Usuário'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-4">
                <form id="usuarioForm" onSubmit={handleSave}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nome Completo <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formData.Nome} onChange={e => setFormData({...formData, Nome: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Login <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formData.Login} onChange={e => setFormData({...formData, Login: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Senha {editingItem ? '(Deixe em branco para manter a atual)' : <span className="text-danger">*</span>}
                    </label>
                    <input type="password" className="form-control" value={formData.Senha} onChange={e => setFormData({...formData, Senha: e.target.value})} required={!editingItem} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Perfil <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.ID_Perfil} onChange={e => setFormData({...formData, ID_Perfil: e.target.value})} required>
                      <option value="">Selecione um perfil...</option>
                      {perfis.map(p => (
                        <option key={p.ID_Perfil} value={p.ID_Perfil}>{p.Nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-check form-switch mt-4">
                    <input className="form-check-input" type="checkbox" id="userAtivo" checked={formData.Ativo} onChange={e => setFormData({...formData, Ativo: e.target.checked})} />
                    <label className="form-check-label fw-bold" htmlFor="userAtivo">Usuário Ativo</label>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn btn-light" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" form="usuarioForm" className="btn btn-primary px-4">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosList;
