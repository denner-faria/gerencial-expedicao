import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const TiposVeiculoList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    Nome: '',
    Tempo_Limite_Carga: 60,
    Tolerancia_Carga: 15,
    Tempo_Limite_Carga_Descarga: 120,
    Tolerancia_Carga_Descarga: 30,
    Ativo: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config-atrasos/tipos-veiculo');
      setItems(res.data);
    } catch (error) {
      toast.error('Erro ao carregar tipos de veículo');
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
      setFormData({
        Nome: item.Nome,
        Tempo_Limite_Carga: item.Tempo_Limite_Carga,
        Tolerancia_Carga: item.Tolerancia_Carga,
        Tempo_Limite_Carga_Descarga: item.Tempo_Limite_Carga_Descarga,
        Tolerancia_Carga_Descarga: item.Tolerancia_Carga_Descarga,
        Ativo: item.Ativo
      });
    } else {
      setFormData({
        Nome: '',
        Tempo_Limite_Carga: 60,
        Tolerancia_Carga: 15,
        Tempo_Limite_Carga_Descarga: 120,
        Tolerancia_Carga_Descarga: 30,
        Ativo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/config-atrasos/tipos-veiculo/${editingItem.ID_Tipo_Veiculo}`, formData);
        toast.success('Atualizado com sucesso!');
      } else {
        await api.post('/config-atrasos/tipos-veiculo', formData);
        toast.success('Criado com sucesso!');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar registro');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/config-atrasos/tipos-veiculo/${id}`);
      toast.success('Excluído com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir registro');
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <Truck size={28} className="text-primary" /> Tipos de Veículo
          </h2>
          <p className="text-muted mb-0">Gerencie os veículos e seus limites de carregamento (em minutos).</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 fw-medium" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Novo Tipo de Veículo
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="py-3">Limite (Carga)</th>
                  <th className="py-3">Tol. (Carga)</th>
                  <th className="py-3">Limite (Carga+Descarga)</th>
                  <th className="py-3">Tol. (Carga+Descarga)</th>
                  <th className="py-3">Status</th>
                  <th className="text-end px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">Nenhum registro encontrado</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.ID_Tipo_Veiculo}>
                      <td className="px-4 fw-medium">{item.Nome}</td>
                      <td>{item.Tempo_Limite_Carga}m</td>
                      <td>{item.Tolerancia_Carga}m</td>
                      <td>{item.Tempo_Limite_Carga_Descarga}m</td>
                      <td>{item.Tolerancia_Carga_Descarga}m</td>
                      <td>
                        <span className={`badge bg-${item.Ativo ? 'success' : 'danger'}`}>
                          {item.Ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="text-end px-4">
                        <button className="btn btn-sm btn-light me-2 text-primary border" onClick={() => handleOpenModal(item)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-sm btn-light text-danger border" onClick={() => handleDelete(item.ID_Tipo_Veiculo)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">{editingItem ? 'Editar' : 'Novo'} Tipo de Veículo</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Nome</label>
                    <input type="text" className="form-control" name="Nome" value={formData.Nome} onChange={handleChange} required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">Limite Carga (Min)</label>
                      <input type="number" className="form-control" name="Tempo_Limite_Carga" value={formData.Tempo_Limite_Carga} onChange={handleChange} required min="1" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">Tolerância Carga (Min)</label>
                      <input type="number" className="form-control" name="Tolerancia_Carga" value={formData.Tolerancia_Carga} onChange={handleChange} required min="0" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">Limite Carga+Desc (Min)</label>
                      <input type="number" className="form-control" name="Tempo_Limite_Carga_Descarga" value={formData.Tempo_Limite_Carga_Descarga} onChange={handleChange} required min="1" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">Tol. Carga+Desc (Min)</label>
                      <input type="number" className="form-control" name="Tolerancia_Carga_Descarga" value={formData.Tolerancia_Carga_Descarga} onChange={handleChange} required min="0" />
                    </div>
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input className="form-check-input" type="checkbox" name="Ativo" checked={formData.Ativo} onChange={handleChange} />
                    <label className="form-check-label">Ativo</label>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-light" onClick={handleCloseModal}>Cancelar</button>
                    <button type="submit" className="btn btn-primary fw-medium px-4">Salvar</button>
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

export default TiposVeiculoList;
