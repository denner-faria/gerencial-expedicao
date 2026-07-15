import React, { useState, useEffect, useRef } from 'react';
import { getCargaById, updateCarga, addFotosCarga, saveAssinatura } from '../api/kanbanApi';
import api from '../../../services/api';
import Drawer from '../../../components/ui/Drawer';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, PenTool, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CargaQuickAction = ({ show, onClose, cargaId, onOpenFullDrawer }) => {
  const [carga, setCarga] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data for Selects
  const [veiculosPortaria, setVeiculosPortaria] = useState([]);
  const [responsabilidades, setResponsabilidades] = useState([]);
  const [motivos, setMotivos] = useState([]);
  
  // State for form
  const [veiculoPortariaId, setVeiculoPortariaId] = useState('');
  const [veiculoManual, setVeiculoManual] = useState('');
  const [placaManual, setPlacaManual] = useState('');
  
  const [tipoCarregamento, setTipoCarregamento] = useState('Carga');
  const [fotos, setFotos] = useState([]);
  const sigCanvas = useRef({});
  
  const [isAtrasado, setIsAtrasado] = useState(false);
  const [idResponsabilidade, setIdResponsabilidade] = useState('');
  const [idMotivo, setIdMotivo] = useState('');

  useEffect(() => {
    if (show && cargaId) {
      loadData();
    }
  }, [show, cargaId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cargaRes = await getCargaById(cargaId);
      setCarga(cargaRes);
      
      // Defaults
      setVeiculoManual(cargaRes.Veiculo || '');
      setPlacaManual(cargaRes.Placa || '');
      setTipoCarregamento(cargaRes.Tipo_Carregamento || 'Carga');
      setFotos([]);
      setIdResponsabilidade('');
      setIdMotivo('');
      if (sigCanvas.current && sigCanvas.current.clear) sigCanvas.current.clear();

      // Load supporting data
      const [portariaRes, respRes, motivosRes] = await Promise.all([
        api.get('/portaria/disponiveis'),
        api.get('/config-atrasos/responsabilidades'),
        api.get('/config-atrasos/motivos')
      ]);
      
      setVeiculosPortaria(portariaRes.data);
      setResponsabilidades(respRes.data.filter(r => r.Ativo));
      setMotivos(motivosRes.data.filter(m => m.Ativo));

      // Check delay if in "Carregando"
      if (cargaRes.ID_Status === 2 && cargaRes.Data_Inicio_Carregamento && cargaRes.Tempo_Limite_Minutos) {
        const start = new Date(cargaRes.Data_Inicio_Carregamento);
        const end = new Date();
        const checkRes = await api.post('/config-atrasos/calcular-minutos-uteis', {
          start: start.toISOString(),
          end: end.toISOString()
        });
        const elapsedMins = checkRes.data.minutos || 0;
        const limiteTotal = cargaRes.Tempo_Limite_Minutos + (cargaRes.Tolerancia_Minutos || 0);
        if (elapsedMins > limiteTotal) {
          setIsAtrasado(true);
        } else {
          setIsAtrasado(false);
        }
      } else {
        setIsAtrasado(false);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados da carga');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarCarregamento = async () => {
    if (!carga.ID_Portaria && !veiculoPortariaId && (!veiculoManual || !placaManual)) {
      toast.error('Informe a Placa e Veículo ou vincule um veículo da portaria.');
      return;
    }

    setSaving(true);
    try {
      // If portaria selected, bind it
      let placaFinal = carga.Placa || placaManual;
      let veiculoFinal = carga.Veiculo || veiculoManual;
      let portariaFinal = null;

      if (veiculoPortariaId) {
        await api.patch(`/portaria/${veiculoPortariaId}/vincular`, { idCarga: carga.ID_Carga });
        const v = veiculosPortaria.find(x => x.ID_Portaria === parseInt(veiculoPortariaId));
        if (v) {
          placaFinal = v.Placa;
          veiculoFinal = v.Veiculo;
          portariaFinal = v.ID_Portaria;
        }
      }

      await updateCarga(carga.ID_Carga, {
        ...carga,
        ID_Status: 2, // Carregando
        Veiculo: veiculoFinal,
        Placa: placaFinal,
        ID_Portaria: portariaFinal || carga.ID_Portaria
      });

      toast.success('Carregamento iniciado!');
      onClose();
    } catch (error) {
      toast.error('Erro ao iniciar carregamento');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizarCarregamento = async () => {
    // Validações
    if (!tipoCarregamento) {
      toast.error('Informe o Tipo de Operação.');
      return;
    }
    
    if (fotos.length === 0 && (!carga.Fotos || carga.Fotos.length === 0)) { 
      toast.error('Obrigatório anexar pelo menos 1 foto da carga.');
      return;
    }

    if (sigCanvas.current.isEmpty() && !carga.Assinatura) {
      toast.error('Obrigatório coletar a assinatura do motorista/conferente.');
      return;
    }

    if (isAtrasado && (!idResponsabilidade || !idMotivo)) {
      toast.error('Tempo limite estourado. A justificativa de atraso é obrigatória.');
      return;
    }

    setSaving(true);
    try {
      // 1. Upload Fotos
      if (fotos.length > 0) {
        await addFotosCarga(carga.ID_Carga, fotos);
      }

      // 2. Upload Assinatura
      if (!sigCanvas.current.isEmpty()) {
        let base64 = '';
        try { 
          base64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'); 
        } catch (e) { 
          base64 = sigCanvas.current.getCanvas().toDataURL('image/png'); 
        }
        await saveAssinatura(carga.ID_Carga, base64);
      }

      // 3. Atualizar Carga e Status
      await updateCarga(carga.ID_Carga, {
        ...carga,
        ID_Status: 3, // Carregada
        Tipo_Carregamento: tipoCarregamento,
        ID_Responsabilidade_Atraso: idResponsabilidade || carga.ID_Responsabilidade_Atraso,
        ID_Motivo_Atraso: idMotivo || carga.ID_Motivo_Atraso
      });

      toast.success('Carregamento concluído!');
      onClose();
    } catch (error) {
      toast.error('Erro ao finalizar carregamento');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const renderAguardando = () => (
    <div className="p-3">
      <div className="alert alert-warning border-warning">Esta carga está <strong>Aguardando</strong>. Preencha os dados do veículo para iniciar o carregamento.</div>
      
      {carga.ID_Portaria ? (
        <div className="mb-4">
          <div className={`alert ${carga.Portaria_Status === 'Na Portaria' ? 'alert-warning' : carga.Portaria_Status === 'Aguardando Descida' ? 'alert-info' : 'alert-success'} d-flex flex-column mb-0 shadow-sm border`}>
            <strong>Veículo Vinculado (Portaria):</strong> 
            <span>Placa: {carga.Placa}</span>
            <span>Status: {carga.Portaria_Status}</span>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <label className="fw-bold mb-2">Vincular Veículo no Pátio (Portaria)</label>
          <select 
            className="form-select form-select-lg shadow-sm border-primary" 
            value={veiculoPortariaId} 
            onChange={(e) => {
              setVeiculoPortariaId(e.target.value);
              setVeiculoManual('');
              setPlacaManual('');
            }}
          >
            <option value="">(Nenhum, inserir manualmente)</option>
            {veiculosPortaria.length === 0 && <option value="" disabled>Nenhum veículo no pátio.</option>}
            {veiculosPortaria.map(v => (
              <option key={v.ID_Portaria} value={v.ID_Portaria}>
                {v.Placa} - {v.Motorista} ({v.Veiculo})
              </option>
            ))}
          </select>
        </div>
      )}

      {!veiculoPortariaId && !carga.ID_Portaria && (
        <div className="row g-3">
          <div className="col-12">
            <label className="fw-bold">Veículo *</label>
            <select className="form-select form-select-lg shadow-sm" value={veiculoManual} onChange={e => setVeiculoManual(e.target.value)}>
              <option value="">Selecione...</option>
              <option value="Rodotrem">Rodotrem</option>
              <option value="Carreta">Carreta</option>
              <option value="Truck e Outros">Truck e Outros</option>
            </select>
          </div>
          <div className="col-12">
            <label className="fw-bold">Placa *</label>
            <input 
              type="text" 
              className="form-control form-control-lg text-uppercase shadow-sm" 
              value={placaManual} 
              onChange={e => setPlacaManual(e.target.value)} 
              placeholder="ABC-1234"
            />
          </div>
        </div>
      )}

      <button className="btn btn-success btn-lg w-100 mt-4 fw-bold shadow" onClick={handleIniciarCarregamento} disabled={saving}>
        {saving ? 'Iniciando...' : '▶ Iniciar Carregamento'}
      </button>
    </div>
  );

  const renderCarregando = () => (
    <div className="p-3">
      <div className="alert alert-info border-info">Esta carga está <strong>Carregando</strong>. Preencha os obrigatórios para finalizar.</div>

      {isAtrasado && (
        <div className="alert alert-danger mb-4 border-danger shadow-sm">
          <h6 className="fw-bold"><AlertTriangle size={18} className="me-2" />Tempo Limite Estourado</h6>
          <p className="small mb-3">O tempo planejado de carregamento foi excedido. A justificativa de atraso é obrigatória.</p>
          
          <label className="fw-bold small text-dark">Responsabilidade *</label>
          <select className="form-select mb-3 border-danger" value={idResponsabilidade} onChange={e => setIdResponsabilidade(e.target.value)}>
            <option value="">Selecione...</option>
            {responsabilidades.map(r => <option key={r.ID_Responsabilidade} value={r.ID_Responsabilidade}>{r.Nome}</option>)}
          </select>

          <label className="fw-bold small text-dark">Motivo *</label>
          <select className="form-select border-danger" value={idMotivo} onChange={e => setIdMotivo(e.target.value)}>
            <option value="">Selecione...</option>
            {motivos.map(m => <option key={m.ID_Motivo} value={m.ID_Motivo}>{m.Nome}</option>)}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="fw-bold mb-2">Operação *</label>
        <select className="form-select form-select-lg shadow-sm" value={tipoCarregamento} onChange={e => setTipoCarregamento(e.target.value)}>
          <option value="Carga">Carga</option>
          <option value="Carga e Descarga">Carga e Descarga</option>
        </select>
      </div>

      <div className="mb-4 p-3 bg-light rounded border shadow-sm">
        <label className="fw-bold mb-2 d-flex align-items-center gap-2 text-dark"><Camera size={18} className="text-primary"/> Fotos Obrigatórias *</label>
        
        {carga.Fotos?.length > 0 && (
           <div className="alert alert-success py-2 px-3 small mb-2 d-flex align-items-center gap-2">
             ✓ Já possui fotos salvas no sistema.
           </div>
        )}

        <div className="d-flex flex-wrap gap-2 mt-2">
          {fotos.map((f, idx) => (
            <div key={idx} className="position-relative" style={{width: '75px', height: '75px'}}>
              <img src={URL.createObjectURL(f)} alt="preview" className="w-100 h-100 object-fit-cover rounded border border-secondary" />
              <button 
                type="button" 
                className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 rounded-circle" 
                style={{width:'22px',height:'22px', transform:'translate(30%,-30%)'}}
                onClick={() => setFotos(prev => prev.filter((_, i) => i !== idx))}
              ><X size={12}/></button>
            </div>
          ))}
          <label className="btn btn-outline-primary d-flex flex-column align-items-center justify-content-center border-dashed" style={{width: '75px', height: '75px', cursor:'pointer', borderStyle: 'dashed'}}>
            <Camera size={24}/>
            <small className="fw-bold mt-1">Adic.</small>
            <input type="file" multiple accept="image/*" className="d-none" capture="environment" onChange={(e) => {
              if (e.target.files) setFotos(prev => [...prev, ...Array.from(e.target.files)]);
            }} />
          </label>
        </div>
      </div>

      <div className="mb-4 p-3 bg-light rounded border shadow-sm">
        <label className="fw-bold mb-2 d-flex align-items-center gap-2 text-dark"><PenTool size={18} className="text-primary"/> Assinatura Obrigatória *</label>
        
        {carga.Assinatura && (
           <div className="alert alert-success py-2 px-3 small mb-2 d-flex align-items-center gap-2">
             ✓ Assinatura já coletada.
           </div>
        )}

        <div className="border bg-white rounded shadow-inner" style={{ touchAction: 'none' }}>
          <SignatureCanvas 
            ref={sigCanvas} 
            penColor="blue"
            canvasProps={{className: 'w-100 rounded', style: {height: '150px'}}} 
          />
        </div>
        <button className="btn btn-sm btn-outline-secondary mt-2 w-100 fw-bold" onClick={() => sigCanvas.current.clear()}>Limpar Assinatura</button>
      </div>

      <button className="btn btn-primary btn-lg w-100 mt-2 fw-bold shadow" onClick={handleFinalizarCarregamento} disabled={saving}>
        {saving ? 'Finalizando...' : '✔ Concluir Carregamento'}
      </button>
    </div>
  );

  return (
    <Drawer 
      isOpen={show} 
      onClose={onClose} 
      title={carga ? `Ação Rápida: ${carga.Nome_Carga}` : 'Ação Rápida'} 
      width="100%"
    >
      {loading ? (
        <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>
      ) : carga ? (
        <div className="d-flex flex-column pb-4" style={{ overflowY: 'auto' }}>
          
          {carga.ID_Status === 1 && renderAguardando()}
          {carga.ID_Status === 2 && renderCarregando()}
          {(carga.ID_Status !== 1 && carga.ID_Status !== 2) && (
             <div className="p-4 text-center text-muted">
                <p className="fs-5 fw-bold text-dark">Nenhuma ação rápida pendente.</p>
                <p className="small">Esta carga já está Carregada ou não precisa de ação imediata pelo assistente de passos.</p>
             </div>
          )}

          <div className="mt-4 px-3 mb-4 d-flex flex-column gap-2">
             <hr className="text-muted" />
             {carga.Arquivo_OF && (
               <a 
                 href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${carga.Arquivo_OF}`} 
                 target="_blank" 
                 rel="noreferrer" 
                 className="btn btn-outline-primary w-100 fw-bold py-2 shadow-sm"
               >
                 Abrir PDF da OF
               </a>
             )}
             <button className="btn btn-light border-secondary text-secondary w-100 fw-bold py-2 shadow-sm" onClick={() => {
               onClose();
               onOpenFullDrawer(carga.ID_Carga);
             }}>
               Abrir Detalhes Completos da Carga
             </button>
          </div>

        </div>
      ) : (
        <div className="p-3 text-center text-danger">Erro ao carregar dados. Tente novamente.</div>
      )}
    </Drawer>
  );
};

export default CargaQuickAction;
