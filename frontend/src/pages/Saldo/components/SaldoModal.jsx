import React, { useState, useEffect } from 'react';
import { getCargaById, toggleSaldoPecaInCarga } from '../../../features/kanban/api/kanbanApi';
import { X, CheckCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SaldoModal = ({ idCarga, onClose }) => {
  const [carga, setCarga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    carregarCarga();
  }, [idCarga]);

  const carregarCarga = async () => {
    try {
      const data = await getCargaById(idCarga);
      setCarga(data);
    } catch (error) {
      toast.error('Erro ao buscar detalhes da carga');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSaldo = async (idPeca, currentStatus) => {
    if (carga.Status_Faturamento === 'Faturada') {
        toast.error('Carga faturada. O saldo não pode ser alterado manualmente.');
        return;
    }
    
    setIsUpdating(true);
    try {
      const result = await toggleSaldoPecaInCarga(idCarga, idPeca, !currentStatus);
      if (result.success) {
        // Atualiza o estado local para não precisar recarregar toda a carga
        setCarga(prev => {
            const newItens = prev.Itens.map(item => 
                item.ID_Item_Carga === idPeca ? { ...item, Saldo_Checado: !currentStatus } : item
            );
            return {
                ...prev,
                Itens: newItens,
                Saldo_Checado: result.carga_saldo_checado // atualizado pelo backend
            };
        });
      }
    } catch (error) {
      toast.error('Erro ao atualizar saldo: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-backdrop bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="spinner-border text-light" role="status"></div>
      </div>
    );
  }

  if (!carga) return null;

  const pecasTotais = carga.Itens?.length || 0;
  const isFaturada = carga.Status_Faturamento === 'Faturada';
  const pecasVerificadas = carga.Itens?.filter(p => p.Saldo_Checado || isFaturada).length || 0;
  const isCargaTotalmenteVerificada = carga.Saldo_Checado || isFaturada;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            
            <div className="modal-header bg-white border-bottom p-4">
              <div>
                <h4 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <Package className="text-primary" />
                  Verificação de Saldo - {carga.Nome_Carga}
                </h4>
                <p className="text-muted small mb-0 mt-1">
                  Cliente: {carga.Cliente_Nome} | Faturamento: <span className={`fw-bold ${carga.Status_Faturamento === 'Faturada' ? 'text-success' : 'text-primary'}`}>{carga.Status_Faturamento}</span>
                </p>
              </div>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>

            <div className="modal-body p-0 bg-light">
              <div className="p-4">
                
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-body p-3 d-flex justify-content-between align-items-center bg-white rounded">
                    <div>
                      <h6 className="mb-0 text-muted fw-bold">Progresso da Carga</h6>
                      <h4 className="mb-0 mt-1 fw-bold text-primary">{pecasVerificadas} de {pecasTotais} peças</h4>
                    </div>
                    {isCargaTotalmenteVerificada && (
                      <div className="text-success fw-bold d-flex align-items-center gap-2 bg-success bg-opacity-10 px-4 py-2 rounded">
                        <CheckCircle size={24} /> SALDO COMPLETO
                      </div>
                    )}
                  </div>
                </div>

                <div className="card shadow-sm border-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light text-muted small text-uppercase">
                        <tr>
                          <th className="px-4 py-3" style={{width: '60px'}}>Saldo</th>
                          <th className="py-3">Cód. Olimpo</th>
                          <th className="py-3">Descrição da Peça</th>
                          <th className="text-center py-3">Qtd</th>
                          <th className="py-3">Embalagem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carga.Itens && carga.Itens.length > 0 ? (
                          carga.Itens.map((peca) => (
                            <tr key={peca.ID_Item_Carga} className={(peca.Saldo_Checado || isFaturada) ? "bg-success bg-opacity-10" : "bg-white"}>
                              <td className="px-4">
                                <div className="form-check form-switch d-flex justify-content-center">
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    style={{ transform: 'scale(1.5)', cursor: isUpdating || isFaturada ? 'not-allowed' : 'pointer' }}
                                    checked={!!peca.Saldo_Checado || isFaturada}
                                    onChange={() => handleToggleSaldo(peca.ID_Item_Carga, peca.Saldo_Checado)}
                                    disabled={isUpdating || isFaturada}
                                  />
                                </div>
                              </td>
                              <td className="fw-semibold font-monospace text-secondary">{peca.Codigo_Peca_Olimpo || '-'}</td>
                              <td className="fw-bold text-dark">{peca.Nome_Peca}</td>
                              <td className="text-center fw-bold fs-6">{peca.Quantidade_Pecas}</td>
                              <td className="text-muted">{peca.Embalagem || 'Nenhuma (Avulsa)'} <small>({peca.Quantidade_Embalagem || 0} un)</small></td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-5 text-muted">
                              Esta carga ainda não possui peças adicionadas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
              </div>
            </div>

            <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between">
              {isCargaTotalmenteVerificada ? (
                  <span className="text-success fw-bold"><CheckCircle size={18} className="me-1"/> Saldo verificado com sucesso!</span>
              ) : (
                  <span className="text-muted small">Todas as alterações são salvas automaticamente ao clicar no interruptor.</span>
              )}
              <button type="button" className={`btn px-5 fw-bold ${isCargaTotalmenteVerificada ? 'btn-success' : 'btn-primary'}`} onClick={onClose}>
                {isCargaTotalmenteVerificada ? 'Concluir' : 'Fechar'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default SaldoModal;
