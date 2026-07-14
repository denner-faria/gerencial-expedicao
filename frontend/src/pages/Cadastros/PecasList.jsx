import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { getPecas, createPeca, updatePeca, deletePeca, getClientes, getEmbalagens } from '../../services/pecasApi';
import ExcelImportExport from '../../components/ExcelImportExport';

const PecasList = () => {
  const [items, setItems] = useState([]);
  const [clientesDisponiveis, setClientesDisponiveis] = useState([]);
  const [embalagensDisponiveis, setEmbalagensDisponiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    ID_Cadastro_Peca: null,
    Nome_Peca: '',
    Peso_Liquido: 0,
    Ativo: true,
    clientesOlimpo: [],
    embalagens: []
  });

  const [clienteTemp, setClienteTemp] = useState({ ID_Cliente: '', Cod_Olimpo: '' });
  const [embalagemTemp, setEmbalagemTemp] = useState({ ID_Cadastro_Embalagem: '', Quantidade_Por_Embalagem: 0 });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [pData, cData, eData] = await Promise.all([getPecas(), getClientes(), getEmbalagens()]);
      setItems(pData);
      setClientesDisponiveis(cData.filter(c => c.Ativo));
      setEmbalagensDisponiveis(eData.filter(e => e.Ativo));
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setForm({ ID_Cadastro_Peca: null, Nome_Peca: '', Peso_Liquido: 0, Ativo: true, clientesOlimpo: [], embalagens: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (peca) => {
    setForm({
      ID_Cadastro_Peca: peca.ID_Cadastro_Peca,
      Nome_Peca: peca.Nome_Peca,
      Peso_Liquido: peca.Peso_Liquido,
      Ativo: peca.Ativo,
      clientesOlimpo: peca.clientesOlimpo || [],
      embalagens: peca.embalagens || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta peça?')) return;
    try {
      await deletePeca(id);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.ID_Cadastro_Peca) {
        await updatePeca(form.ID_Cadastro_Peca, form);
      } else {
        await createPeca(form);
      }
      setShowModal(false);
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar peça');
    }
  };

  const handleToggleActive = async (group, e) => {
    e.stopPropagation(); // Evita expandir a linha
    try {
      const updatedPeca = {
        Nome_Peca: group.Nome_Peca,
        Peso_Liquido: group.Peso_Liquido,
        Ativo: !group.Ativo,
        clientesOlimpo: group.clientesOlimpo,
        embalagens: group.embalagens
      };
      await updatePeca(group.originalItem.ID_Cadastro_Peca, updatedPeca);
      carregarDados();
    } catch (err) {
      alert('Erro ao alterar status da peça');
    }
  };

  // Funções para adicionar subtabelas
  const addClienteOlimpo = () => {
    if (!clienteTemp.ID_Cliente || !clienteTemp.Cod_Olimpo) return;
    setForm(prev => ({
      ...prev,
      clientesOlimpo: [...prev.clientesOlimpo, { ...clienteTemp, ID_Cliente: parseInt(clienteTemp.ID_Cliente) }]
    }));
    setClienteTemp({ ID_Cliente: '', Cod_Olimpo: '' });
  };
  const removeClienteOlimpo = (index) => {
    setForm(prev => ({ ...prev, clientesOlimpo: prev.clientesOlimpo.filter((_, i) => i !== index) }));
  };

  const addEmbalagem = () => {
    if (!embalagemTemp.ID_Cadastro_Embalagem || embalagemTemp.Quantidade_Por_Embalagem <= 0) return;
    setForm(prev => ({
      ...prev,
      embalagens: [...prev.embalagens, { ...embalagemTemp, ID_Cadastro_Embalagem: parseInt(embalagemTemp.ID_Cadastro_Embalagem), Quantidade_Por_Embalagem: parseInt(embalagemTemp.Quantidade_Por_Embalagem) }]
    }));
    setEmbalagemTemp({ ID_Cadastro_Embalagem: '', Quantidade_Por_Embalagem: 0 });
  };
  const removeEmbalagem = (index) => {
    setForm(prev => ({ ...prev, embalagens: prev.embalagens.filter((_, i) => i !== index) }));
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Package size={28} className="text-primary" /> Cadastro de Peças
          </h2>
          <p className="text-muted mb-0">Gerencie peças, seus códigos Olimpo por cliente e limites de embalagem.</p>
        </div>
        <div className="d-flex gap-2">
          <ExcelImportExport entidade="pecas" onImportSuccess={carregarDados} />
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenNew}>
            <Plus size={20} /> Nova Peça
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
              placeholder="Buscar peça ou cód olimpo..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          {loading ? (
            <div className="p-4 text-center">Carregando peças...</div>
          ) : (
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nome da Peça</th>
                  <th>Peso (kg)</th>
                  <th>Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(items.filter(item => 
                  item.Nome_Peca.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (item.clientesOlimpo && item.clientesOlimpo.some(c => c.Cod_Olimpo && c.Cod_Olimpo.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                  (item.embalagens && item.embalagens.some(e => e.Nome_Embalagem && e.Nome_Embalagem.toLowerCase().includes(searchTerm.toLowerCase())))
                ).reduce((acc, item) => {
                  if (!acc[item.Nome_Peca]) {
                    acc[item.Nome_Peca] = {
                      Nome_Peca: item.Nome_Peca,
                      Peso_Liquido: item.Peso_Liquido,
                      Ativo: item.Ativo,
                      clientesOlimpo: [],
                      embalagens: [],
                      originalItem: item // Para edição, usaremos o primeiro
                    };
                  }
                  acc[item.Nome_Peca].clientesOlimpo.push(...(item.clientesOlimpo || []));
                  acc[item.Nome_Peca].embalagens.push(...(item.embalagens || []));
                  return acc;
                }, {})).length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-4">Nenhuma peça encontrada.</td></tr>
                ) : Object.values(items.filter(item => 
                  item.Nome_Peca.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (item.clientesOlimpo && item.clientesOlimpo.some(c => c.Cod_Olimpo && c.Cod_Olimpo.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                  (item.embalagens && item.embalagens.some(e => e.Nome_Embalagem && e.Nome_Embalagem.toLowerCase().includes(searchTerm.toLowerCase())))
                ).reduce((acc, item) => {
                  if (!acc[item.Nome_Peca]) {
                    acc[item.Nome_Peca] = {
                      Nome_Peca: item.Nome_Peca,
                      Peso_Liquido: item.Peso_Liquido,
                      Ativo: item.Ativo,
                      clientesOlimpo: [],
                      embalagens: [],
                      originalItem: item
                    };
                  }
                  acc[item.Nome_Peca].clientesOlimpo.push(...(item.clientesOlimpo || []));
                  
                  // Evita embalagens duplicadas na visualização agrupada
                  const currentEmbs = acc[item.Nome_Peca].embalagens;
                  (item.embalagens || []).forEach(e => {
                    if(!currentEmbs.find(x => x.ID_Cadastro_Embalagem === e.ID_Cadastro_Embalagem)) {
                      currentEmbs.push(e);
                    }
                  });
                  return acc;
                }, {})).map((group, idx) => (
                  <React.Fragment key={idx}>
                    <tr onClick={() => toggleRow(group.Nome_Peca)} style={{ cursor: 'pointer' }}>
                      <td className="fw-semibold">{group.Nome_Peca}</td>
                      <td>{group.Peso_Liquido} kg</td>
                      <td>
                        <span 
                          className={`badge bg-${group.Ativo ? 'success' : 'danger'}`} 
                          style={{ cursor: 'pointer' }}
                          title="Clique para alterar o status"
                          onClick={(e) => handleToggleActive(group, e)}
                        >
                          {group.Ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="text-end" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-sm btn-light me-2" onClick={() => handleOpenEdit(group.originalItem)} title="Editar"><Edit2 size={16} /></button>
                        <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(group.originalItem.ID_Cadastro_Peca)} title="Excluir"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                    {expandedRows.includes(group.Nome_Peca) && (
                      <tr className="bg-light">
                        <td colSpan="4" className="p-3">
                          <div className="row">
                            <div className="col-md-6 mb-3 mb-md-0">
                              {(!group.clientesOlimpo || group.clientesOlimpo.length === 0) ? (
                                <span className="text-muted small">Nenhum código parametrizado.</span>
                              ) : (
                                <table className="table table-sm bg-white border mb-0">
                                  <thead className="table-light"><tr><th>Cód Olimpo</th><th>Cliente</th></tr></thead>
                                  <tbody>
                                    {group.clientesOlimpo.map((c, i) => (
                                      <tr key={i}>
                                        <td className="fw-bold">{c.Cod_Olimpo}</td>
                                        <td>{c.Razao_Social}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                            <div className="col-md-6">
                              {(!group.embalagens || group.embalagens.length === 0) ? (
                                <span className="text-muted small">Nenhuma embalagem parametrizada.</span>
                              ) : (
                                <table className="table table-sm bg-white border mb-0">
                                  <thead className="table-light"><tr><th>Embalagem</th><th>Max Peças</th></tr></thead>
                                  <tbody>
                                    {group.embalagens.map((e, i) => (
                                      <tr key={i}>
                                        <td>{e.Nome_Embalagem}</td>
                                        <td>{e.Quantidade_Por_Embalagem}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

          )}
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{form.ID_Cadastro_Peca ? 'Editar Peça' : 'Nova Peça'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                    <div className="col-md-8 mb-3">
                      <label className="form-label fw-bold">Nome da Peça <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={form.Nome_Peca}
                        onChange={e => setForm({...form, Nome_Peca: e.target.value})}
                        required
                        placeholder="Ex: Para-choque Dianteiro"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Peso Líquido (kg)</label>
                      <input type="number" step="0.01" className="form-control" value={form.Peso_Liquido} onChange={e => setForm({...form, Peso_Liquido: e.target.value})} />
                  </div>
                  <div className="col-2 d-flex align-items-end">
                    <div className="form-check form-switch mb-2">
                      <input className="form-check-input" type="checkbox" role="switch" id="ativoSwitch" checked={form.Ativo} onChange={e => setForm({...form, Ativo: e.target.checked})} />
                      <label className="form-check-label" htmlFor="ativoSwitch">Ativo</label>
                    </div>
                  </div>
                </div>
                
                <hr />
                <h6 className="fw-bold mb-3 text-primary">Códigos Olimpo por Cliente</h6>
                <div className="row mb-2">
                  <div className="col-5">
                    <select className="form-select" value={clienteTemp.ID_Cliente} onChange={e => setClienteTemp({...clienteTemp, ID_Cliente: e.target.value})}>
                      <option value="">Selecione o Cliente...</option>
                      {clientesDisponiveis.map(c => <option key={c.ID_Cliente} value={c.ID_Cliente}>{c.Razao_Social}</option>)}
                    </select>
                  </div>
                  <div className="col-5">
                    <input type="text" className="form-control" placeholder="Cód Olimpo..." value={clienteTemp.Cod_Olimpo} onChange={e => setClienteTemp({...clienteTemp, Cod_Olimpo: e.target.value})} />
                  </div>
                  <div className="col-2">
                    <button className="btn btn-primary w-100" onClick={addClienteOlimpo}>Add</button>
                  </div>
                </div>
                {form.clientesOlimpo.length > 0 && (
                  <table className="table table-sm border mb-4">
                    <thead className="table-light"><tr><th>Cliente</th><th>Cód Olimpo</th><th className="text-end">Ação</th></tr></thead>
                    <tbody>
                      {form.clientesOlimpo.map((c, i) => {
                        const nomeCli = clientesDisponiveis.find(x => x.ID_Cliente === c.ID_Cliente)?.Razao_Social || 'Desconhecido';
                        return (
                          <tr key={i}>
                            <td>{nomeCli}</td>
                            <td>{c.Cod_Olimpo}</td>
                            <td className="text-end"><button className="btn btn-sm text-danger p-0" onClick={() => removeClienteOlimpo(i)}><X size={18} /></button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}

                <hr />
                <h6 className="fw-bold mb-3 text-primary">Capacidade por Embalagens</h6>
                <div className="row mb-2">
                  <div className="col-5">
                    <select className="form-select" value={embalagemTemp.ID_Cadastro_Embalagem} onChange={e => setEmbalagemTemp({...embalagemTemp, ID_Cadastro_Embalagem: e.target.value})}>
                      <option value="">Selecione a Embalagem...</option>
                      {embalagensDisponiveis.map(e => <option key={e.ID_Cadastro_Embalagem} value={e.ID_Cadastro_Embalagem}>{e.Nome_Embalagem}</option>)}
                    </select>
                  </div>
                  <div className="col-5">
                    <input type="number" className="form-control" placeholder="Qtd. Máxima Peças..." value={embalagemTemp.Quantidade_Por_Embalagem} onChange={e => setEmbalagemTemp({...embalagemTemp, Quantidade_Por_Embalagem: e.target.value})} />
                  </div>
                  <div className="col-2">
                    <button className="btn btn-primary w-100" onClick={addEmbalagem}>Add</button>
                  </div>
                </div>
                {form.embalagens.length > 0 && (
                  <table className="table table-sm border">
                    <thead className="table-light"><tr><th>Embalagem</th><th>Capacidade (Peças)</th><th className="text-end">Ação</th></tr></thead>
                    <tbody>
                      {form.embalagens.map((emb, i) => {
                        const nomeEmb = embalagensDisponiveis.find(x => x.ID_Cadastro_Embalagem === emb.ID_Cadastro_Embalagem)?.Nome_Embalagem || 'Desconhecida';
                        return (
                          <tr key={i}>
                            <td>{nomeEmb}</td>
                            <td>{emb.Quantidade_Por_Embalagem}</td>
                            <td className="text-end"><button className="btn btn-sm text-danger p-0" onClick={() => removeEmbalagem(i)}><X size={18} /></button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger" onClick={handleSave}>Salvar Peça</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PecasList;
