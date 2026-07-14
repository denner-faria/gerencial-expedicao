import React, { useState, useEffect, useRef } from 'react';
import { getClientes, getTransportadoras, getStatusCargas, createCarga } from '../api/kanbanApi';

const NovaCargaModal = ({ show, onClose }) => {
  const [clientes, setClientes] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [statusList, setStatusList] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Nome_Carga: '',
    ID_Cliente: '',
    ID_Transportadora: '',
    ID_Status: '',
    Criticidade: 'Média',
    Tipo_Carregamento: 'Carga',
    Status_Faturamento: 'Não Liberado'
  });

  useEffect(() => {
    if (show) {
      // Carregar dados dos selects ao abrir o modal
      const loadFormData = async () => {
        try {
          const [cData, tData, sData] = await Promise.all([
            getClientes(),
            getTransportadoras(),
            getStatusCargas()
          ]);
          setClientes(cData);
          setTransportadoras(tData);
          
          const sortedStatus = sData.sort((a, b) => a.Ordem - b.Ordem);
          setStatusList(sortedStatus);
          
          // Set default status if available
          if (sortedStatus.length > 0) {
            setFormData(prev => ({ ...prev, ID_Status: sortedStatus[0].ID_Status }));
          }
        } catch (error) {
          console.error('Erro ao buscar dados do formulário', error);
        }
      };
      loadFormData();
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCarga({
        ...formData,
        ID_Cliente: formData.ID_Cliente ? parseInt(formData.ID_Cliente) : null,
        ID_Transportadora: formData.ID_Transportadora ? parseInt(formData.ID_Transportadora) : null,
        ID_Status: formData.ID_Status ? parseInt(formData.ID_Status) : null
      });
      // Limpar formulário e fechar
      setFormData({
        Nome_Carga: '',
        ID_Cliente: '',
        ID_Transportadora: '',
        ID_Status: statusList.length > 0 ? statusList[0].ID_Status : '',
        Criticidade: 'Média',
        Tipo_Carregamento: 'Carga'
      });
      onClose();
    } catch (error) {
      alert('Erro ao criar carga: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-light">
              <h5 className="modal-title fw-bold">Nova Carga</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">NOME/IDENTIFICADOR DA CARGA *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="Nome_Carga"
                    value={formData.Nome_Carga}
                    onChange={handleChange}
                    placeholder="Ex: Lote de Vigas Metálicas"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">CLIENTE</label>
                  <select 
                    className="form-select" 
                    name="ID_Cliente"
                    value={formData.ID_Cliente}
                    onChange={handleChange}
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.filter(c => c.Ativo).map(c => (
                      <option key={c.ID_Cliente} value={c.ID_Cliente}>{c.Razao_Social}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">TRANSPORTADORA</label>
                  <select 
                    className="form-select" 
                    name="ID_Transportadora"
                    value={formData.ID_Transportadora}
                    onChange={handleChange}
                  >
                    <option value="">Selecione uma transportadora...</option>
                    {transportadoras.filter(t => t.Ativo).map(t => (
                      <option key={t.ID_Transportadora} value={t.ID_Transportadora}>{t.Razao_Social}</option>
                    ))}
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label text-muted small fw-bold">STATUS INICIAL</label>
                    <select 
                      className="form-select" 
                      name="ID_Status"
                      value={formData.ID_Status}
                      onChange={handleChange}
                    >
                      <option value="">Selecione...</option>
                      {statusList.map(s => (
                        <option key={s.ID_Status} value={s.ID_Status}>{s.Nome}</option>
                      ))}
                    </select>
                  </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted small fw-bold">CRITICIDADE</label>
                      <select 
                        className="form-select" 
                        name="Criticidade"
                        value={formData.Criticidade}
                        onChange={handleChange}
                      >
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted small fw-bold">OPERAÇÃO</label>
                      <select 
                        className="form-select" 
                        name="Tipo_Carregamento"
                        value={formData.Tipo_Carregamento}
                        onChange={handleChange}
                      >
                        <option value="Carga">Carga</option>
                        <option value="Carga e Descarga">Carga e Descarga</option>
                      </select>
                    </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label text-muted small fw-bold">FATURAMENTO</label>
                    <select 
                      className="form-select" 
                      name="Status_Faturamento"
                      value={formData.Status_Faturamento}
                      onChange={handleChange}
                    >
                      <option value="Não Liberado">Não Liberado</option>
                      <option value="Liberado">Liberado</option>
                      <option value="Somente Embalagens">Somente Embalagens</option>
                    </select>
                  </div>
                </div>

              
                {/* Upload OF */}
                <div className="row mb-3">
                  <div className="col-12">
                     <label className="form-label text-muted small fw-bold">ANEXAR OF (PDF)</label>
                     {clientes.find(c => c.ID_Cliente === parseInt(formData.ID_Cliente))?.Requer_OF && <span className="text-danger ms-1">*</span>}
                     <input 
                       type="file" 
                       className="form-control" 
                       accept=".pdf"
                       ref={fileInputRef}
                       onChange={(e) => setOfFile(e.target.files[0])}
                     />
                  </div>
                </div>

              </div>
              
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : 'Criar Carga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default NovaCargaModal;
