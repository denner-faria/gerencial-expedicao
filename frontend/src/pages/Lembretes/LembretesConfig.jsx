import React, { useState, useEffect, useContext } from 'react';
import { Bell, Save, User, Clock, MessageSquare, Shield, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';

const LembretesConfig = () => {
  const { user } = useContext(AuthContext);
  const permissoes = user?.permissoes || [];
  const isAdmin = user?.perfil === 'Admin' || user?.perfil === 'Administrador' || permissoes.includes('*');

  const [loading, setLoading] = useState(false);
  
  // --- Admin ---
  const [configsGlobais, setConfigsGlobais] = useState([]);
  
  // --- Usuário ---
  const [meusCustomizados, setMeusCustomizados] = useState([]);
  const [novoCustomizado, setNovoCustomizado] = useState({
    Mensagem: '',
    Intervalo_Minutos: 30
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const resGlobais = await api.get('/lembretes/config/todos');
        setConfigsGlobais(resGlobais.data);
      }
      const resCustomizados = await api.get('/lembretes/customizados');
      setMeusCustomizados(resCustomizados.data || []);
    } catch (error) {
      toast.error('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Funções do Usuário (Customizados) ---
  const handleNovoCustomizadoChange = (e) => {
    const { name, value } = e.target;
    setNovoCustomizado(prev => ({ ...prev, [name]: value }));
  };

  const handleSalvarNovoCustomizado = async (e) => {
    e.preventDefault();
    if (!novoCustomizado.Mensagem || novoCustomizado.Intervalo_Minutos < 1) {
      toast.error('Preencha os campos corretamente.');
      return;
    }
    try {
      const res = await api.post('/lembretes/customizados', novoCustomizado);
      setMeusCustomizados(prev => [res.data, ...prev]);
      setNovoCustomizado({ Mensagem: '', Intervalo_Minutos: 30 });
      toast.success('Lembrete personalizado criado!');
    } catch (error) {
      toast.error('Erro ao criar lembrete.');
    }
  };

  const handleToggleCustomizado = async (id, currentAtivo) => {
    try {
      await api.put(`/lembretes/customizados/${id}`, { Ativo: !currentAtivo });
      setMeusCustomizados(prev => prev.map(c => c.ID_Customizado === id ? { ...c, Ativo: !currentAtivo } : c));
      toast.success(currentAtivo ? 'Lembrete pausado.' : 'Lembrete ativado.');
    } catch (error) {
      toast.error('Erro ao alterar status do lembrete.');
    }
  };

  const handleDeleteCustomizado = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este lembrete?')) return;
    try {
      await api.delete(`/lembretes/customizados/${id}`);
      setMeusCustomizados(prev => prev.filter(c => c.ID_Customizado !== id));
      toast.success('Lembrete excluído.');
    } catch (error) {
      toast.error('Erro ao excluir lembrete.');
    }
  };

  // --- Funções do Admin ---
  const handleAdminCheckboxChange = async (idUsuario, field, value) => {
    try {
      await api.put(`/lembretes/config/${idUsuario}`, { [field]: value });
      setConfigsGlobais(prev => prev.map(c => 
        c.ID_Usuario === idUsuario ? { ...c, [field]: value } : c
      ));
      toast.success('Configuração atualizada.');
    } catch (error) {
      toast.error('Erro ao atualizar usuário.');
    }
  };

  if (loading) return <div className="p-4 text-center">Carregando configurações...</div>;

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
          <Bell size={28} className="text-primary" />
          Configuração de Lembretes
        </h2>
        <p className="text-muted mb-0">Gerencie seus alertas e mensagens recorrentes.</p>
      </div>

      <div className="row">
        {/* Meus Lembretes Pessoais */}
        <div className="col-12 col-xl-5 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h5 className="fw-bold d-flex align-items-center gap-2">
                <User size={20} className="text-info" /> Meus Lembretes Pessoais
              </h5>
              <p className="text-muted small m-0 mb-3">Crie alertas que se repetem de tempos em tempos.</p>
            </div>
            <div className="card-body">
              
              {/* Form de Criação */}
              <div className="bg-light p-3 rounded mb-4 border">
                <h6 className="fw-bold mb-3 small text-secondary">NOVO LEMBRETE</h6>
                <form onSubmit={handleSalvarNovoCustomizado}>
                  <div className="mb-2">
                    <label className="form-label d-flex align-items-center gap-1 text-muted small fw-bold mb-1">
                      <MessageSquare size={14} /> Mensagem
                    </label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      name="Mensagem"
                      placeholder="Ex: Beber água"
                      value={novoCustomizado.Mensagem}
                      onChange={handleNovoCustomizadoChange}
                      maxLength="255"
                      required
                    />
                  </div>
                  <div className="row g-2 align-items-end">
                    <div className="col-8">
                      <label className="form-label d-flex align-items-center gap-1 text-muted small fw-bold mb-1">
                        <Clock size={14} /> Repetir a cada (Minutos)
                      </label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        name="Intervalo_Minutos"
                        min="1"
                        max="1440"
                        value={novoCustomizado.Intervalo_Minutos}
                        onChange={handleNovoCustomizadoChange}
                        required
                      />
                    </div>
                    <div className="col-4">
                      <button type="submit" className="btn btn-primary btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1">
                        <Save size={14} /> Salvar
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Tabela de Ativos */}
              <h6 className="fw-bold mb-2 small text-secondary">LEMBRETES CADASTRADOS</h6>
              {meusCustomizados.length === 0 ? (
                <div className="text-center text-muted py-4 small bg-light rounded border border-dashed">
                  Nenhum lembrete cadastrado.
                </div>
              ) : (
                <div className="table-responsive border rounded">
                  <table className="table table-hover table-sm align-middle mb-0">
                    <thead className="table-light text-muted" style={{ fontSize: '0.8rem' }}>
                      <tr>
                        <th>Mensagem</th>
                        <th className="text-center">Minutos</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meusCustomizados.map(c => (
                        <tr key={c.ID_Customizado} className={!c.Ativo ? 'opacity-50' : ''}>
                          <td className="small fw-medium">{c.Mensagem}</td>
                          <td className="text-center small">{c.Intervalo_Minutos}m</td>
                          <td className="text-center">
                            {c.Ativo ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle">Ativo</span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Pausado</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <button 
                                className={`btn btn-sm btn-link p-0 ${c.Ativo ? 'text-warning' : 'text-success'}`}
                                onClick={() => handleToggleCustomizado(c.ID_Customizado, c.Ativo)}
                                title={c.Ativo ? "Pausar Lembrete" : "Ativar Lembrete"}
                              >
                                {c.Ativo ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              </button>
                              <button 
                                className="btn btn-sm btn-link p-0 text-danger"
                                onClick={() => handleDeleteCustomizado(c.ID_Customizado)}
                                title="Excluir Lembrete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configurações Globais (Apenas Admin) */}
        {isAdmin && (
          <div className="col-12 col-xl-7 mb-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 pt-4 pb-0">
                <h5 className="fw-bold d-flex align-items-center gap-2">
                  <Shield size={20} className="text-danger" /> Painel de Alertas do Sistema (Admin)
                </h5>
                <p className="text-muted small m-0">Selecione quem receberá as notificações oficiais do sistema.</p>
              </div>
              <div className="card-body">
                <div className="table-responsive border rounded">
                  <table className="table table-hover table-sm align-middle mb-0">
                    <thead className="table-light text-muted" style={{ fontSize: '0.8rem' }}>
                      <tr>
                        <th>Usuário</th>
                        <th className="text-center">Criada</th>
                        <th className="text-center">Atraso</th>
                        <th className="text-center">Entrada Port.</th>
                        <th className="text-center">Iniciou Carr.</th>
                        <th className="text-center">Carregada</th>
                        <th className="text-center">Fat. Lib.</th>
                        <th className="text-center">Faturada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configsGlobais.map(c => (
                        <tr key={c.ID_Usuario}>
                          <td className="fw-bold small">
                            {c.Nome_Usuario}
                            <span className="d-block text-muted" style={{ fontSize: '0.7rem' }}>{c.Nome_Perfil}</span>
                          </td>
                          <td className="text-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                              checked={!!c.Notificar_Carga_Criada}
                              onChange={(e) => handleAdminCheckboxChange(c.ID_Usuario, 'Notificar_Carga_Criada', e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                              checked={!!c.Notificar_Atraso_Carregamento}
                              onChange={(e) => handleAdminCheckboxChange(c.ID_Usuario, 'Notificar_Atraso_Carregamento', e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                              checked={!!c.Notificar_Entrada_Portaria}
                              onChange={(e) => handleAdminCheckboxChange(c.ID_Usuario, 'Notificar_Entrada_Portaria', e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                              checked={!!c.Notificar_Carregando}
                              onChange={(e) => handleAdminCheckboxChange(c.ID_Usuario, 'Notificar_Carregando', e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                              checked={!!c.Notificar_Carregada}
                              onChange={(e) => handleAdminCheckboxChange(c.ID_Usuario, 'Notificar_Carregada', e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                              checked={!!c.Notificar_Faturamento_Liberado}
                              onChange={(e) => handleAdminCheckboxChange(c.ID_Usuario, 'Notificar_Faturamento_Liberado', e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                              checked={!!c.Notificar_Faturada}
                              onChange={(e) => handleAdminCheckboxChange(c.ID_Usuario, 'Notificar_Faturada', e.target.checked)}
                            />
                          </td>
                        </tr>
                      ))}
                      {configsGlobais.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted small">
                            Nenhuma configuração encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LembretesConfig;
