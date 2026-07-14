import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';

const PerfisList = () => {
  const [perfis, setPerfis] = useState([]);
  const [permissoesList, setPermissoesList] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPerfis, resPerms] = await Promise.all([
        api.get('/perfis'),
        api.get('/permissoes')
      ]);
      setPerfis(resPerfis.data);
      setPermissoesList(resPerms.data);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar dados: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setNome(item.Nome);
      setDescricao(item.Descricao || '');
      setSelectedPerms(item.Permissoes ? item.Permissoes.map(p => p.ID_Permissao) : []);
    } else {
      setNome('');
      setDescricao('');
      setSelectedPerms([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleTogglePermissao = (id) => {
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleToggleAllCategory = (catPerms) => {
    const allSelected = catPerms.every(p => selectedPerms.includes(p.ID_Permissao));
    if (allSelected) {
      // Remove all
      const idsToRemove = catPerms.map(p => p.ID_Permissao);
      setSelectedPerms(prev => prev.filter(id => !idsToRemove.includes(id)));
    } else {
      // Add all missing
      const idsToAdd = catPerms.map(p => p.ID_Permissao);
      setSelectedPerms(prev => {
        const set = new Set([...prev, ...idsToAdd]);
        return Array.from(set);
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return alert("O nome é obrigatório");

    const payload = {
      Nome: nome,
      Descricao: descricao,
      Permissoes: selectedPerms
    };

    try {
      if (editingItem) {
        await api.put(`/perfis/${editingItem.ID_Perfil}`, payload);
      } else {
        await api.post('/perfis', payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      alert('Erro ao salvar perfil: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este perfil?')) return;
    try {
      await api.delete(`/perfis/${id}`);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Shield size={28} className="text-primary" /> 
            Perfis de Acesso
          </h2>
          <p className="text-muted mb-0">Gerencie perfis e suas permissões no sistema.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Novo Perfil
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nome do Perfil</th>
                <th>Descrição</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Carregando...</td></tr>
              ) : perfis.map(item => (
                <tr key={item.ID_Perfil}>
                  <td className="fw-bold text-secondary">{item.ID_Perfil}</td>
                  <td className="fw-semibold">{item.Nome}</td>
                  <td className="text-muted">{item.Descricao || '-'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-light me-2" onClick={() => handleOpenModal(item)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    {item.ID_Perfil !== 1 && (
                      <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(item.ID_Perfil)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light border-bottom-0">
                <h5 className="modal-title fw-bold">
                  {editingItem ? 'Editar Perfil' : 'Novo Perfil'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-4">
                <form id="perfilForm" onSubmit={handleSave}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Nome do Perfil <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" value={nome} onChange={e => setNome(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Descrição</label>
                      <input type="text" className="form-control" value={descricao} onChange={e => setDescricao(e.target.value)} />
                    </div>
                  </div>

                  <h6 className="fw-bold text-dark mt-4 border-bottom pb-2">Permissões de Acesso</h6>
                  
                  {Object.entries(permissoesList).map(([categoria, perms]) => (
                    <div key={categoria} className="mb-4 bg-light p-3 rounded border">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold m-0 text-primary">{categoria}</h6>
                        <button 
                           type="button" 
                           className="btn btn-sm btn-outline-primary"
                           onClick={() => handleToggleAllCategory(perms)}
                        >
                          Marcar / Desmarcar Todos
                        </button>
                      </div>
                      <div className="row mt-3">
                        {perms.map(p => (
                          <div className="col-md-6 mb-2" key={p.ID_Permissao}>
                            <div className="form-check form-switch">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id={`perm-${p.ID_Permissao}`}
                                checked={selectedPerms.includes(p.ID_Permissao)}
                                onChange={() => handleTogglePermissao(p.ID_Permissao)}
                              />
                              <label className="form-check-label" htmlFor={`perm-${p.ID_Permissao}`}>
                                {p.Descricao}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                </form>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn btn-light" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" form="perfilForm" className="btn btn-primary px-4">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfisList;
