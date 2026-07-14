import React, { useState, useEffect } from 'react';
import { Clock, Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const ExpedienteList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDia, setEditingDia] = useState(null);
  const [formData, setFormData] = useState({
    Hora_Inicio: '',
    Hora_Fim: '',
    Ativo: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config-atrasos/expediente');
      setItems(res.data);
    } catch (error) {
      toast.error('Erro ao carregar expediente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item) => {
    setEditingDia(item.Dia_Semana);
    setFormData({
      Hora_Inicio: item.Hora_Inicio ? item.Hora_Inicio.substring(11, 16) : '08:00',
      Hora_Fim: item.Hora_Fim ? item.Hora_Fim.substring(11, 16) : '18:00',
      Ativo: item.Ativo
    });
  };

  const handleCancel = () => {
    setEditingDia(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (dia) => {
    try {
      await api.put(`/config-atrasos/expediente/${dia}`, formData);
      toast.success('Horário atualizado com sucesso!');
      setEditingDia(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar horário');
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <Clock size={28} className="text-primary" /> Horários de Expediente
          </h2>
          <p className="text-muted mb-0">Configure os horários em que a empresa trabalha. Fora desse período, o tempo de atraso não será contabilizado.</p>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">Dia da Semana</th>
                  <th className="py-3 text-center">Início</th>
                  <th className="py-3 text-center">Fim</th>
                  <th className="py-3 text-center">Expediente Ativo</th>
                  <th className="text-end px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">Carregando...</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.Dia_Semana}>
                      <td className="px-4 fw-medium">{diasSemana[item.Dia_Semana]}</td>
                      
                      {editingDia === item.Dia_Semana ? (
                        <>
                          <td className="text-center">
                            <input type="time" className="form-control form-control-sm mx-auto" style={{maxWidth: '120px'}} name="Hora_Inicio" value={formData.Hora_Inicio} onChange={handleChange} />
                          </td>
                          <td className="text-center">
                            <input type="time" className="form-control form-control-sm mx-auto" style={{maxWidth: '120px'}} name="Hora_Fim" value={formData.Hora_Fim} onChange={handleChange} />
                          </td>
                          <td className="text-center">
                            <div className="form-check form-switch d-flex justify-content-center">
                              <input className="form-check-input" type="checkbox" name="Ativo" checked={formData.Ativo} onChange={handleChange} />
                            </div>
                          </td>
                          <td className="text-end px-4">
                            <button className="btn btn-sm btn-success me-2" onClick={() => handleSave(item.Dia_Semana)}>
                              <Save size={16} /> Salvar
                            </button>
                            <button className="btn btn-sm btn-light border" onClick={handleCancel}>
                              <X size={16} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="text-center text-muted">
                            {item.Ativo ? (item.Hora_Inicio ? item.Hora_Inicio.substring(11, 16) : '--:--') : '-'}
                          </td>
                          <td className="text-center text-muted">
                            {item.Ativo ? (item.Hora_Fim ? item.Hora_Fim.substring(11, 16) : '--:--') : '-'}
                          </td>
                          <td className="text-center">
                            <span className={`badge bg-${item.Ativo ? 'success' : 'secondary'}`}>
                              {item.Ativo ? 'Sim' : 'Não (Fechado)'}
                            </span>
                          </td>
                          <td className="text-end px-4">
                            <button className="btn btn-sm btn-light text-primary border" onClick={() => handleEdit(item)}>
                              <Edit2 size={16} /> Editar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpedienteList;
