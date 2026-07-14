import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, UploadCloud, X, Lock, Unlock } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { getCargaById, saveAssinatura, updateStatusCarga, addFotosCarga, getFotosCarga, getStatusCargas, updateObservacoesCarga } from '../../features/kanban/api/kanbanApi';

const FinalizarCarregamento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const sigCanvas = useRef({});
  
  const [carga, setCarga] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignatureLocked, setIsSignatureLocked] = useState(true);
  
  const [fotosUpload, setFotosUpload] = useState([]);
  const [fotosGaleria, setFotosGaleria] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getCargaById(id);
        setCarga(data);
        const fotosBD = await getFotosCarga(id);
        setFotosGaleria(fotosBD);
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      }
    };
    loadData();
  }, [id]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFotosUpload(prev => [...prev, ...newFiles]);
    }
  };

  const removeFotoUpload = (index) => {
    setFotosUpload(prev => prev.filter((_, i) => i !== index));
  };

  const limparAssinatura = () => {
    sigCanvas.current.clear();
  };

  const handleSubmit = async () => {
    if (sigCanvas.current.isEmpty()) {
      alert('A assinatura do operador é obrigatória!');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload das fotos
      if (fotosUpload.length > 0) {
        await addFotosCarga(id, fotosUpload);
      }

      // 2. Salvar assinatura
      let base64 = '';
      try {
        base64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      } catch (e) {
        base64 = sigCanvas.current.getCanvas().toDataURL('image/png');
      }
      await saveAssinatura(id, base64);

      // 3. Mudar status para 'Carregada' dinamicamente pela Ordem 3
      const statusList = await getStatusCargas();
      const statusCarregada = statusList.find(s => s.Ordem === 3);
      
      if (!statusCarregada) {
        throw new Error("Status 'Carregada' (Ordem 3) não encontrado no banco de dados.");
      }
      
      await updateStatusCarga(id, statusCarregada.ID_Status);
      
      navigate('/');
    } catch (error) {
      console.error("Erro no catch:", error);
      alert(`Erro ao finalizar: ${error.message || 'Verifique o console'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!carga) return <div className="p-4 text-center">Carregando...</div>;

  const formatTime = (t) => t ? (t.includes('T') ? new Date(t).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : t.substring(0, 5)) : '--:--';

  return (
    <div className="bg-light min-vh-100 d-flex flex-column pb-5 mb-5">
      <div className="bg-white p-3 d-flex align-items-center shadow-sm position-sticky top-0 z-3">
        <button className="btn btn-link text-dark p-0 me-3" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h5 className="m-0 fw-bold">Finalizar Carregamento</h5>
      </div>

      <div className="p-3">
        {/* CABEÇALHO DA CARGA */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body pb-2">
            <h5 className="fw-bold text-dark mb-1">{carga.Nome_Carga}</h5>
            <p className="text-muted small mb-2">
              {carga.Transportadora_Nome || carga.Cliente_Nome || 'Transportadora não informada'}
            </p>
            <div className="d-flex justify-content-between border-top pt-2">
              <div className="text-muted small">
                <strong>Chegada Prev.:</strong> <span className="text-dark fw-semibold">{formatTime(carga.Hora_Prevista_Chegada)}</span>
              </div>
              <div className="text-muted small">
                <strong>Saída Prev.:</strong> <span className="text-dark fw-semibold">{formatTime(carga.Hora_Prevista_Saida)}</span>
              </div>
            </div>
          </div>
        </div>
        {/* PEÇAS */}
        {carga.Itens && carga.Itens.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold mb-2">Peças Conferidas</h6>
            <div className="table-responsive bg-white rounded shadow-sm">
              <table className="table table-sm table-striped mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Peça</th>
                    <th className="text-center">Qtd</th>
                    <th>Emb.</th>
                    <th className="text-center">Q.Emb</th>
                  </tr>
                </thead>
                <tbody>
                  {carga.Itens.map(item => (
                    <tr key={item.ID_Item_Carga}>
                      <td className="text-truncate" style={{maxWidth: '120px'}}>{item.Nome_Peca}</td>
                      <td className="text-center fw-bold">{item.Quantidade_Pecas}</td>
                      <td className="text-truncate" style={{maxWidth: '100px'}}>{item.Embalagem || '-'}</td>
                      <td className="text-center">{item.Quantidade_Embalagem || 0}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr className="small text-muted fw-bold">
                    <td className="text-start">Totais:</td>
                    <td className="text-center text-dark">{carga.Itens.reduce((acc, curr) => acc + (curr.Quantidade_Pecas || 0), 0)}</td>
                    <td></td>
                    <td className="text-center text-dark">{carga.Itens.reduce((acc, curr) => acc + (curr.Quantidade_Embalagem || 0), 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* TOTAIS DE PESOS FORA DA TABELA PARA ECONOMIZAR ESPAÇO */}
            <div className="d-flex justify-content-between bg-light p-3 rounded border mt-3 shadow-sm">
              <div className="text-secondary small">
                <strong>Peso Peças:</strong> <span className="text-danger">{carga.Itens.reduce((acc, curr) => acc + (curr.Peso_Total_Pecas || 0), 0).toLocaleString('pt-BR')} kg</span>
              </div>
              <div className="text-secondary small">
                <strong>Peso Bruto:</strong> <span className="text-dark fw-bold">{carga.Itens.reduce((acc, curr) => acc + (curr.Peso_Total_Bruto || 0), 0).toLocaleString('pt-BR')} kg</span>
              </div>
            </div>
          </div>
        )}

        {/* FOTOS DA CARGA */}
        <div className="mb-4 bg-white p-3 rounded shadow-sm">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <Camera size={18} /> Fotos da Carga
          </h6>
          
          <div className="d-flex flex-wrap gap-2 mb-3">
            {fotosGaleria.map(f => (
              <div key={f.ID_Carga_Foto} className="position-relative" style={{width: '80px', height: '80px'}}>
                <img 
                  src={`http://localhost:4000${f.Caminho_Arquivo}`} 
                  alt="Foto" 
                  className="w-100 h-100 object-fit-cover rounded border" 
                />
              </div>
            ))}
            
            {fotosUpload.map((file, idx) => (
              <div key={idx} className="position-relative" style={{width: '80px', height: '80px'}}>
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Preview" 
                  className="w-100 h-100 object-fit-cover rounded border" 
                />
                <button 
                  type="button"
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center m-1 shadow"
                  style={{width: '24px', height: '24px', zIndex: 10}}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFotoUpload(idx);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            <label className="btn btn-outline-primary d-flex flex-column align-items-center justify-content-center rounded" style={{width: '80px', height: '80px'}}>
              <UploadCloud size={24} />
              <small style={{fontSize: '10px'}} className="mt-1">Adicionar</small>
              <input type="file" multiple accept="image/*" className="d-none" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {/* OBSERVAÇÕES */}
        <div className="mb-4 bg-white p-3 rounded shadow-sm">
          <h6 className="fw-bold mb-2">Observações</h6>
          <textarea 
            className="form-control bg-light border text-dark small" 
            style={{ minHeight: '80px', resize: 'none' }} 
            placeholder="Adicione observações aqui..."
            value={carga.Observacoes || ''}
            onChange={(e) => setCarga({...carga, Observacoes: e.target.value})}
            onBlur={async () => {
              try { await updateObservacoesCarga(carga.ID_Carga, carga.Observacoes); } catch(e) {}
            }}
          />
        </div>

        {/* ASSINATURA */}
        <div className="mb-4 bg-white p-3 rounded shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold m-0">Termo de Responsabilidade</h6>
            <button 
              className={`btn btn-sm ${isSignatureLocked ? 'btn-danger' : 'btn-outline-secondary'}`}
              onClick={() => setIsSignatureLocked(!isSignatureLocked)}
              title={isSignatureLocked ? 'Desbloquear para assinar' : 'Bloquear assinatura'}
            >
              {isSignatureLocked ? <Lock size={16} className="me-1" /> : <Unlock size={16} className="me-1" />}
              {isSignatureLocked ? 'Bloqueado' : 'Desbloqueado'}
            </button>
          </div>
          <p className="text-muted small mb-3">Eu, Operador Logístico, atesto que as peças listadas foram devidamente amarradas, verificadas e carregadas no veículo {carga.Veiculo} - {carga.Placa}.</p>
          <div className="border rounded bg-white shadow-sm mb-2 position-relative" style={{ touchAction: isSignatureLocked ? 'auto' : 'none' }}>
            {isSignatureLocked && (
              <div 
                className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', zIndex: 1, cursor: 'pointer' }}
                onClick={() => setIsSignatureLocked(false)}
              >
                <Lock size={32} className="text-danger mb-2" />
                <span className="fw-bold text-danger">Toque para desbloquear e assinar</span>
              </div>
            )}
            <SignatureCanvas 
              ref={sigCanvas} 
              penColor="black"
              canvasProps={{ className: 'w-100', height: 280 }} 
            />
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={limparAssinatura} disabled={isSignatureLocked}>
            Limpar Assinatura
          </button>
        </div>
      </div>

      <div 
        className="p-3 border-top position-fixed bottom-0 start-0 w-100 pb-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(10px)', zIndex: 1020 }}
      >
        <button 
          className="btn btn-success w-100 py-3 fw-bold fs-5 shadow-sm"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Finalizando...' : 'Concluir Carregamento'}
        </button>
      </div>
    </div>
  );
};

export default FinalizarCarregamento;
