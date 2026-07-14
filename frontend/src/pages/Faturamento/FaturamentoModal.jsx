import React, { useState, useEffect } from 'react';
import { getCargaById, updateStatusFaturamento } from '../../features/kanban/api/kanbanApi';
import { X, CheckCircle, Package, Hash } from 'lucide-react';

const FaturamentoModal = ({ idCarga, onClose, onFaturado }) => {
  const [carga, setCarga] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para as NFs
  const [nfsPecas, setNfsPecas] = useState('');
  const [nfsEmbalagens, setNfsEmbalagens] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getCargaById(idCarga);
        setCarga(data);
        if (data.NFs_Pecas) setNfsPecas(data.NFs_Pecas);
        if (data.NFs_Embalagens) setNfsEmbalagens(data.NFs_Embalagens);
      } catch (error) {
        alert('Erro ao carregar detalhes da carga.');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [idCarga, onClose]);

  const handleFaturar = async () => {
    if (!nfsPecas.trim()) {
      alert('Por favor, informe a(s) NF(s) das peças.');
      return;
    }
    if (!nfsEmbalagens.trim()) {
      alert('Por favor, informe a(s) NF(s) das embalagens.');
      return;
    }

    try {
      await updateStatusFaturamento(idCarga, 'Faturada', nfsPecas, nfsEmbalagens);
      onFaturado();
    } catch (error) {
      alert('Erro ao faturar: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 text-center p-5">
            <div className="spinner-border text-primary mx-auto mb-3"></div>
            <h5>Carregando detalhes...</h5>
          </div>
        </div>
      </div>
    );
  }

  if (!carga) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-light border-0 py-3">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">Faturamento da Carga</h5>
              <span className="text-muted small">{carga.Nome_Carga} - {carga.Cliente_Nome || 'Sem Cliente'}</span>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body p-4 bg-white">
            
            {/* Campos de NF */}
            <div className="row g-4 mb-4 pb-4 border-bottom">
              <div className="col-md-6">
                <label className="form-label fw-bold text-dark d-flex align-items-center gap-2">
                  <Hash size={16} className="text-primary"/> 
                  NF(s) das Peças <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control form-control-lg bg-light" 
                  placeholder="Ex: 1234, 1235"
                  value={nfsPecas}
                  onChange={(e) => setNfsPecas(e.target.value)}
                />
                <div className="form-text">Separe múltiplas notas por vírgula.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold text-dark d-flex align-items-center gap-2">
                  <Hash size={16} className="text-primary"/> 
                  NF(s) das Embalagens <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control form-control-lg bg-light" 
                  placeholder="Ex: 5678, 5679"
                  value={nfsEmbalagens}
                  onChange={(e) => setNfsEmbalagens(e.target.value)}
                />
                <div className="form-text">Separe múltiplas notas por vírgula.</div>
              </div>
            </div>

            {/* Tabela de Itens */}
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Package size={18}/> Itens Carregados
            </h6>
            
            {carga.Itens && carga.Itens.length > 0 ? (
              <div className="table-responsive rounded border" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small text-uppercase" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr>
                      <th>Cód. Olimpo</th>
                      <th>Peça</th>
                      <th className="text-center">Qtde. Peças</th>
                      <th>Cód. Embalagem</th>
                      <th>Embalagem</th>
                      <th className="text-center">Qtde. Emb.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carga.Itens.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold text-primary">{item.Codigo_Peca_Olimpo || '-'}</td>
                        <td className="fw-medium">{item.Nome_Peca}</td>
                        <td className="text-center fs-5 fw-bold">{item.Quantidade_Pecas}</td>
                        <td className="fw-bold text-secondary">{item.Codigo_Embalagem || '-'}</td>
                        <td className="text-muted">{item.Embalagem || '-'}</td>
                        <td className="text-center fs-5 fw-bold">{item.Quantidade_Embalagem || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold" style={{ position: 'sticky', bottom: 0, zIndex: 2, boxShadow: '0 -2px 5px rgba(0,0,0,0.05)' }}>
                    <tr>
                      <td colSpan="2" className="text-end text-uppercase text-secondary" style={{ borderTop: '2px solid #dee2e6' }}>Totais:</td>
                      <td className="text-center fs-4 text-primary" style={{ borderTop: '2px solid #dee2e6' }}>{carga.Quantidade_Total_Pecas || 0}</td>
                      <td colSpan="2" style={{ borderTop: '2px solid #dee2e6' }}></td>
                      <td className="text-center fs-4 text-primary" style={{ borderTop: '2px solid #dee2e6' }}>{carga.Quantidade_Total_Embalagens || 0}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center bg-light rounded text-muted">
                Nenhum item registrado nesta carga.
              </div>
            )}
            
          </div>

          <div className="modal-footer border-0 bg-light p-4 d-flex justify-content-between">
            <h4 className="fw-bold m-0 text-dark">Total: {Number(carga.Peso_Total_Bruto || 0).toLocaleString('pt-BR')} kg</h4>
            <div className="d-flex gap-2">
              {carga.Status_Faturamento === 'Faturada' && (
                <button 
                  className="btn btn-outline-danger btn-lg fw-bold d-flex align-items-center gap-2 shadow-sm bg-white"
                  onClick={async () => {
                    if(!window.confirm("Tem certeza que deseja excluir o faturamento desta carga? Ela voltará para o status 'Liberado'.")) return;
                    try {
                      await updateStatusFaturamento(idCarga, 'Liberado', '', '');
                      onFaturado();
                    } catch (error) {
                      alert('Erro ao excluir faturamento: ' + error.message);
                    }
                  }}
                >
                  <X size={20} />
                  Excluir Faturamento
                </button>
              )}
              <button 
                className="btn btn-success btn-lg fw-bold d-flex align-items-center gap-2 px-5 shadow-sm"
                onClick={handleFaturar}
              >
                <CheckCircle size={20} />
                {carga.Status_Faturamento === 'Faturada' ? 'Atualizar Faturamento' : 'Confirmar e Faturar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaturamentoModal;
