import React, { useState, useEffect, useContext, useRef } from 'react';
import { getClientes, getTransportadoras, getStatusCargas, createCarga, getCargaById, updateCarga, deleteCarga, removePecaFromCarga, getFotosCarga, removeFotoCarga, getSequenciaDia, uploadOFCarga, addFotosCarga, saveAssinatura } from '../api/kanbanApi';
import { AuthContext } from '../../../context/AuthContext';
import SignatureCanvas from 'react-signature-canvas';
import api from '../../../services/api';
import Drawer from '../../../components/ui/Drawer';
import PecaForm from './PecaForm';
import { FaTrashAlt, FaUpload, FaCheckCircle, FaEdit } from 'react-icons/fa';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CargaDrawer = ({ show, onClose, cargaId }) => {
  const { user } = useContext(AuthContext);
  const permissoes = user?.permissoes || [];
  const isAdmin = user?.perfil === 'Admin' || permissoes.includes('*');
  const [ofFile, setOfFile] = useState(null);
  const fileInputRef = useRef(null);

  const [clientes, setClientes] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [statusList, setStatusList] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [cargaSalva, setCargaSalva] = useState(null);
  
  const [formData, setFormData] = useState({
    Data: new Date().toISOString().split('T')[0],
    Nome_Carga: '',
    ID_Cliente: '',
    ID_Transportadora: '',
    ID_Status: '',
    Criticidade: 'Média',
    Tipo_Carregamento: 'Carga',
    Hora_Prevista_Chegada: '',
    Hora_Prevista_Saida: '',
    Veiculo: '',
    Placa: '',
    Observacoes: '',
    Status_Faturamento: 'Não Liberado'
  });

  const [showPecaForm, setShowPecaForm] = useState(false);
  const [pecaEmEdicao, setPecaEmEdicao] = useState(null);
  const [pecasAdicionadas, setPecasAdicionadas] = useState([]);
  const [fotosGaleria, setFotosGaleria] = useState([]);
  const [fotosUpload, setFotosUpload] = useState([]);
  const sigCanvas = useRef({});
  const [isSignatureLocked, setIsSignatureLocked] = useState(true);
  
  const [veiculosPortaria, setVeiculosPortaria] = useState([]);
  const [responsabilidades, setResponsabilidades] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [showAtrasoModal, setShowAtrasoModal] = useState(false);
  const [atrasoTempData, setAtrasoTempData] = useState({ ID_Responsabilidade_Atraso: '', ID_Motivo_Atraso: '' });
  
  // RBAC Edit Lock Logic
  const isLider = permissoes.includes('CARGA_CRIAR') && !isAdmin;
  const isFaturamento = permissoes.includes('TELA_FATURAMENTO') && !isAdmin && !isLider;
  const isOperador = !isAdmin && !isLider && !isFaturamento;

  const isStatusAguardando = cargaSalva?.ID_Status === 1 || !cargaSalva;
  const isStatusJaCarregada = cargaSalva?.ID_Status >= 3;
  const isLiberadoOuFaturado = cargaSalva?.Status_Faturamento === 'Liberado' || cargaSalva?.Status_Faturamento === 'Faturada';

  const lockMasterFields = isAdmin ? false : isLider ? (!isStatusAguardando || isLiberadoOuFaturado) : true;
  const lockPlanningFields = isAdmin ? false : isLider ? isLiberadoOuFaturado : true;
  const lockOF = isAdmin ? false : isLider ? (cargaSalva?.Status_Faturamento === 'Liberado' || cargaSalva?.Status_Faturamento === 'Faturada') : true;
  const lockFlowFields = isAdmin ? false : isStatusJaCarregada;
  const lockStatus = isAdmin ? false : isStatusJaCarregada;
  const lockFaturamento = isAdmin ? false : isLider ? false : true;
  const lockObservacao = isAdmin ? false : isLiberadoOuFaturado;
  const lockAssinatura = isOperador ? (cargaSalva?.Assinatura ? true : false) : true;
  const lockFotos = (isAdmin || isLider) ? false : isOperador ? (cargaSalva?.Assinatura ? true : false) : true;
  const isLockedGlobally = false; // We won't use a universal lock anymore

  useEffect(() => {
    if (show) {
      setCargaSalva(null);
      setPecasAdicionadas([]);
      setShowPecaForm(false);
      setPecaEmEdicao(null);
      setFotosGaleria([]);
      setFotosUpload([]);
      setOfFile(null);
      if (sigCanvas.current && sigCanvas.current.clear) sigCanvas.current.clear();
      setIsSignatureLocked(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      const loadFormData = async () => {
        let currentSortedStatus = [];
        try {
          const [statusRes, clientesRes, transRes, portariaRes, respRes, motivosRes] = await Promise.all([
            api.get('/status-carga'),
            api.get('/clientes'),
            api.get('/transportadoras'),
            api.get('/portaria/disponiveis'),
            api.get('/config-atrasos/responsabilidades'),
            api.get('/config-atrasos/motivos')
          ]);
          currentSortedStatus = statusRes.data.sort((a,b) => a.Ordem - b.Ordem);
          setStatusList(currentSortedStatus);
          setClientes(clientesRes.data);
          setTransportadoras(transRes.data);
          setVeiculosPortaria(portariaRes.data);
          setResponsabilidades(respRes.data.filter(r => r.Ativo));
          setMotivos(motivosRes.data.filter(m => m.Ativo));
        } catch (e) {
          console.error("Erro ao carregar dados de suporte", e);
        }

        try {
          if (cargaId) {
            setLoading(true);
            const cargaCompleta = await getCargaById(cargaId);
            setCargaSalva(cargaCompleta);
            setPecasAdicionadas(cargaCompleta.Itens || []);
            
            try {
              const fotos = await getFotosCarga(cargaId);
              setFotosGaleria(fotos || []);
            } catch (e) {
              console.error("Erro ao carregar fotos", e);
            }
            
            const formatDateTimeLocal = (dateString) => {
              if (!dateString) return '';
              if (dateString.includes('T')) return dateString.substring(0, 16);
              const date = new Date(dateString);
              return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            };

            setFormData({
              Data: cargaCompleta.Data ? cargaCompleta.Data.substring(0, 10) : '',
              Nome_Carga: cargaCompleta.Nome_Carga || '',
              ID_Cliente: cargaCompleta.ID_Cliente || '',
              ID_Transportadora: cargaCompleta.ID_Transportadora || '',
              ID_Status: cargaCompleta.ID_Status || '',
              Criticidade: cargaCompleta.Criticidade || 'Média',
              Tipo_Carregamento: cargaCompleta.Tipo_Carregamento || 'Carga',
              Hora_Prevista_Chegada: formatDateTimeLocal(cargaCompleta.Hora_Prevista_Chegada),
              Hora_Prevista_Saida: formatDateTimeLocal(cargaCompleta.Hora_Prevista_Saida),
              Veiculo: cargaCompleta.Veiculo || '',
              Placa: cargaCompleta.Placa || '',
              Observacoes: cargaCompleta.Observacoes || '',
              Status_Faturamento: cargaCompleta.Status_Faturamento || 'Não Liberado',
              ID_Responsabilidade_Atraso: cargaCompleta.ID_Responsabilidade_Atraso || '',
              ID_Motivo_Atraso: cargaCompleta.ID_Motivo_Atraso || ''
            });
            setLoading(false);
          } else {
            setFormData({
              Data: new Date().toISOString().split('T')[0],
              Nome_Carga: '',
              ID_Cliente: '',
              ID_Transportadora: '',
              ID_Status: currentSortedStatus.length > 0 ? currentSortedStatus[0].ID_Status : '',
              Criticidade: 'Média',
              Tipo_Carregamento: 'Carga',
              Hora_Prevista_Chegada: '',
              Hora_Prevista_Saida: '',
              Veiculo: '',
              Placa: '',
              Observacoes: '',
              Status_Faturamento: 'Não Liberado',
              ID_Responsabilidade_Atraso: '',
              ID_Motivo_Atraso: ''
            });
          }
        } catch (error) {
          console.error('Erro ao carregar dados do drawer', error);
          setLoading(false);
        }
      };
      
      loadFormData();
    }
  }, [show, cargaId]);

  const handleVincularPortaria = async (idPortaria) => {
    if (!idPortaria) return;
    if (!cargaSalva?.ID_Carga) {
      toast.error('Salve a carga primeiro antes de vincular o veículo da portaria.');
      return;
    }
    try {
      await api.patch(`/portaria/${idPortaria}/vincular`, { idCarga: cargaSalva.ID_Carga });
      toast.success('Veículo vinculado com sucesso!');
      const v = veiculosPortaria.find(x => x.ID_Portaria === parseInt(idPortaria));
      if (v) {
        setFormData(prev => ({ ...prev, Placa: v.Placa, Veiculo: v.Veiculo }));
        setCargaSalva(prev => ({ ...prev, ID_Portaria: parseInt(idPortaria), Portaria_Status: v.Status }));
      }
      setVeiculosPortaria(prev => prev.filter(x => x.ID_Portaria !== parseInt(idPortaria)));
    } catch (error) {
      toast.error('Erro ao vincular veículo.');
    }
  };

  const handleDesvincularPortaria = async () => {
    if (!cargaSalva?.ID_Portaria) return;
    try {
      await api.patch(`/portaria/${cargaSalva.ID_Portaria}/desvincular`);
      toast.success('Veículo desvinculado com sucesso!');
      setFormData(prev => ({ ...prev, Placa: '', Veiculo: '' }));
      setCargaSalva(prev => ({ ...prev, ID_Portaria: null, Portaria_Status: null }));
      const portariaRes = await api.get('/portaria/disponiveis');
      setVeiculosPortaria(portariaRes.data);
    } catch (error) {
      toast.error('Erro ao desvincular veículo.');
    }
  };

  const handleLiberarDescida = async () => {
    if (!cargaSalva?.ID_Portaria) return;
    try {
      await api.patch(`/portaria/${cargaSalva.ID_Portaria}/liberar-descida`);
      toast.success('Veículo liberado! O porteiro foi notificado.');
      setCargaSalva(prev => ({ ...prev, Portaria_Status: 'Aguardando Descida' }));
    } catch (error) {
      toast.error('Erro ao liberar veículo.');
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'ID_Cliente' || name === 'Data') {
      const clienteId = name === 'ID_Cliente' ? value : formData.ID_Cliente;
      const dateVal = name === 'Data' ? value : formData.Data;
      
      if (clienteId && dateVal) {
        try {
          const seq = await getSequenciaDia(clienteId, dateVal);
          const cliente = clientes.find(c => c.ID_Cliente === parseInt(clienteId));
          const nomeCliente = cliente ? cliente.Razao_Social : '';
          const formatSeq = String(seq).padStart(2, '0');
          setFormData(prev => ({
            ...prev,
            Nome_Carga: `${nomeCliente} - Carga ${formatSeq}`
          }));
        } catch (err) {
          console.error("Erro ao puxar sequencia", err);
        }
      }
    }
  };

  const salvarCargaSilencioso = async () => {
    if (!formData.Nome_Carga) {
      alert("Por favor, preencha pelo menos o Nome/Identificador da Carga.");
      return false;
    }
    
    const selectedCliente = clientes.find(c => c.ID_Cliente === parseInt(formData.ID_Cliente));
    const requerOF = selectedCliente ? selectedCliente.Requer_OF : false;

    if (formData.Status_Faturamento === 'Liberado' && requerOF) {
       if (!cargaSalva?.Arquivo_OF && !ofFile) {
          alert("Obrigatório: O cliente desta carga exige que o documento OF (PDF) seja anexado antes de liberar o faturamento.");
          if (fileInputRef.current) fileInputRef.current.focus();
          return false;
       }
    }

    // Check loading time limit
    if (cargaSalva && formData.ID_Status) {
      const oldStatus = statusList.find(s => s.ID_Status === cargaSalva.ID_Status);
      const newStatus = statusList.find(s => s.ID_Status === parseInt(formData.ID_Status));
      
      // Verifica se a alteração de status para Carregada (ou superior) exige Tipo de Carregamento
      if (newStatus && newStatus.Ordem >= 4) {
        if (!formData.Tipo_Carregamento) {
          toast.error('Informe o Tipo de Carregamento (Operação) antes de finalizar a carga.');
          setLoading(false);
          return false;
        }
      }

      if (oldStatus && newStatus && oldStatus.Ordem < 4 && newStatus.Ordem >= 4) {
        if (cargaSalva.Data_Inicio_Carregamento && cargaSalva.Tempo_Limite_Minutos) {
            const start = new Date(cargaSalva.Data_Inicio_Carregamento);
            const end = new Date();
            
            try {
              const checkRes = await api.post('/config-atrasos/calcular-minutos-uteis', {
                start: start.toISOString(),
                end: end.toISOString()
              });
              const elapsedMins = checkRes.data.minutos || 0;
              const limiteTotal = cargaSalva.Tempo_Limite_Minutos + (cargaSalva.Tolerancia_Minutos || 0);
              
              if (elapsedMins > limiteTotal) {
                  if (!formData.ID_Responsabilidade_Atraso || !formData.ID_Motivo_Atraso) {
                    setShowAtrasoModal(true);
                    setLoading(false);
                    return false;
                  }
              }
            } catch (e) {
              console.error("Erro ao validar limite de tempo", e);
            }
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        ID_Cliente: formData.ID_Cliente ? parseInt(formData.ID_Cliente) : null,
        ID_Transportadora: formData.ID_Transportadora ? parseInt(formData.ID_Transportadora) : null,
        ID_Status: formData.ID_Status ? parseInt(formData.ID_Status) : 1
      };

      let novaOuAtualizada;
      if (cargaSalva) {
        novaOuAtualizada = await updateCarga(cargaSalva.ID_Carga, payload);
      } else {
        novaOuAtualizada = await createCarga(payload);
      }
      
      if (ofFile) {
         try {
           await uploadOFCarga(novaOuAtualizada.ID_Carga, ofFile);
           setOfFile(null);
           if (fileInputRef.current) fileInputRef.current.value = '';
         } catch (err) {
           alert("Carga salva, mas erro ao enviar OF: " + (err.response?.data?.message || err.message));
         }
      }

      if (fotosUpload.length > 0) {
        try {
          await addFotosCarga(novaOuAtualizada.ID_Carga, fotosUpload);
          setFotosUpload([]);
        } catch(e) {
          alert("Erro ao fazer upload de fotos.");
        }
      }

      if (sigCanvas.current && typeof sigCanvas.current.isEmpty === 'function' && !sigCanvas.current.isEmpty()) {
         try {
           let base64 = '';
           try { base64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'); } catch (e) { base64 = sigCanvas.current.getCanvas().toDataURL('image/png'); }
           await saveAssinatura(novaOuAtualizada.ID_Carga, base64);
           sigCanvas.current.clear();
         } catch(e) {
           alert("Erro ao salvar assinatura.");
         }
      }

      novaOuAtualizada = await getCargaById(novaOuAtualizada.ID_Carga);
      setCargaSalva(novaOuAtualizada);
      return true;
    } catch (error) {
      alert('Erro ao salvar carga em background: ' + (error.response?.data?.message || error.message));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirNovaPeca = async () => {
    const sucesso = await salvarCargaSilencioso();
    if (sucesso) {
      setShowPecaForm(true);
      setPecaEmEdicao(null);
    }
  };

  const handlePecaSucesso = async () => {
    setShowPecaForm(false);
    setPecaEmEdicao(null);
    try {
      const cargaCompleta = await getCargaById(cargaSalva.ID_Carga);
      setPecasAdicionadas(cargaCompleta.Itens || []);
    } catch (e) { console.error(e); }
  };

  const handleRemoverPeca = async (idPeca) => {
    if (!window.confirm("Deseja realmente excluir esta peça?")) return;
    try {
      await removePecaFromCarga(idPeca);
      setPecasAdicionadas(prev => prev.filter(p => p.ID_Item_Carga !== idPeca));
    } catch (error) {
      alert("Erro ao remover peça: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteFoto = async (e, idFoto) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Excluir foto do servidor permanentemente?")) return;
    try {
      await removeFotoCarga(idFoto);
      setFotosGaleria(prev => prev.filter(f => f.ID_Foto !== idFoto));
    } catch (error) {
      alert("Erro ao remover foto: " + (error.response?.data?.message || error.message));
    }
  };

  const handleExcluirCarga = async () => {
    if (!cargaSalva) return;
    if (!window.confirm("Deseja realmente excluir esta carga? Esta ação não pode ser desfeita e removerá todas as peças e fotos associadas.")) return;
    
    setLoading(true);
    try {
      await deleteCarga(cargaSalva.ID_Carga);
      onClose(); // close drawer
    } catch (error) {
      alert('Erro ao excluir carga: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarEFechar = async () => {
    const sucesso = await salvarCargaSilencioso();
    if (sucesso) {
      onClose();
    }
  };

  const hasDeletePerm = isAdmin || permissoes.includes('CARGA_DELETAR');
  const headerRight = (cargaSalva && hasDeletePerm) ? (
    <button className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center p-2" onClick={handleExcluirCarga} disabled={loading} title="Excluir Carga">
      <FaTrashAlt size={16} />
    </button>
  ) : null;

  const footer = (
    <>
      <button className="btn btn-light btn-lg px-4 border" onClick={onClose} disabled={loading}>Cancelar</button>
      {!isLockedGlobally && (
        <button className="btn btn-primary btn-lg px-5 shadow-sm fw-bold" onClick={handleSalvarEFechar} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Carga'}
        </button>
      )}
    </>
  );

  return (
    <Drawer 
      isOpen={show} 
      onClose={onClose} 
      title={cargaSalva ? "Editar Carga" : "Planejar Carga"} 
      width="850px"
      headerRight={headerRight}
      footer={footer}
    >
      
      {/* === SEÇÃO 1: INFORMAÇÕES DA CARGA === */}
      <div className="mb-4">
        <label className="d-block mb-3 fs-5 text-dark fw-bold">Informações da Carga</label>
        <div className="mb-4">
          <label>Data</label>
          <input type="date" className="form-control form-control-lg" name="Data" value={formData.Data} onChange={handleChange} disabled={lockMasterFields} />
        </div>
        
        <div className="mb-4">
          <label>Cliente</label>
          <select className="form-select form-select-lg" name="ID_Cliente" value={formData.ID_Cliente} onChange={handleChange} disabled={lockMasterFields}>
            <option value="">Selecione um cliente...</option>
            {clientes.filter(c => c.Ativo).map(c => (
              <option key={c.ID_Cliente} value={c.ID_Cliente}>{c.Razao_Social}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label>Nome Carga (Identificador) *</label>
          <input type="text" className="form-control form-control-lg" name="Nome_Carga" value={formData.Nome_Carga} onChange={handleChange} disabled={lockMasterFields} required />
        </div>

        <div className="mb-4">
          <label>Transportadora</label>
          <select className="form-select form-select-lg" name="ID_Transportadora" value={formData.ID_Transportadora} onChange={handleChange} disabled={lockMasterFields}>
            <option value="">Selecione uma transportadora...</option>
            {transportadoras.filter(t => t.Ativo).map(t => (
              <option key={t.ID_Transportadora} value={t.ID_Transportadora}>{t.Razao_Social}</option>
            ))}
          </select>
        </div>

        <div className="row mb-4">
          <div className="col-12 col-md-6 mb-3 mb-md-0">
             <label>Hora Prevista Chegada</label>
             <input type="datetime-local" className="form-control form-control-lg" name="Hora_Prevista_Chegada" value={formData.Hora_Prevista_Chegada} onChange={handleChange} disabled={lockPlanningFields} />
          </div>
          <div className="col-12 col-md-6">
             <label>Hora Prevista Saída</label>
             <input type="datetime-local" className="form-control form-control-lg" name="Hora_Prevista_Saida" value={formData.Hora_Prevista_Saida} onChange={handleChange} disabled={lockPlanningFields} />
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12 col-md-3 mb-3 mb-md-0">
            <label>Status</label>
            <select className="form-select form-select-lg" name="ID_Status" value={formData.ID_Status} onChange={handleChange} disabled={lockStatus}>
              {statusList.map(s => <option key={s.ID_Status} value={s.ID_Status}>{s.Nome}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3 mb-3 mb-md-0">
            <label>Criticidade</label>
            <select className="form-select form-select-lg" name="Criticidade" value={formData.Criticidade} onChange={handleChange} disabled={lockPlanningFields}>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div className="col-12 col-md-3 mb-3 mb-md-0">
            <label>Operação</label>
            <select className="form-select form-select-lg" name="Tipo_Carregamento" value={formData.Tipo_Carregamento} onChange={handleChange} disabled={lockPlanningFields}>
              <option value="Carga">Carga</option>
              <option value="Carga e Descarga">Carga e Descarga</option>
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label>Faturamento</label>
            {!isAdmin && formData.Status_Faturamento === 'Liberado' && isLider ? (
              <select className="form-select form-select-lg" disabled>
                <option value="Liberado">Liberado</option>
              </select>
            ) : (
            <select className="form-select form-select-lg" name="Status_Faturamento" value={formData.Status_Faturamento} onChange={handleChange} disabled={lockFaturamento}>
              <option value="Não Liberado">Não Liberado</option>
              <option value="Liberado">Liberado</option>
              <option value="Somente Embalagens">Somente Embalagens</option>
            </select>
            )}
          </div>
        </div>
        
        {!isOperador && (
          <div className="mt-3 p-3 bg-light rounded border">
            <label className="d-flex align-items-center gap-2 fw-bold text-dark mb-2">
              Anexar Documento OF (PDF)
              {clientes.find(c => c.ID_Cliente === parseInt(formData.ID_Cliente))?.Requer_OF && <span className="text-danger">*</span>}
            </label>
            {cargaSalva?.Arquivo_OF && (
              <div className="d-flex align-items-center justify-content-between p-2 border rounded bg-white mb-2">
                <span className="text-success fw-bold"><FaCheckCircle className="me-2"/>OF Anexada</span>
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${cargaSalva.Arquivo_OF}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">Ver/Baixar</a>
              </div>
            )}
            
            {!lockOF && (
              <div>
                <span className="text-secondary small">{cargaSalva?.Arquivo_OF ? "Substituir documento:" : "Nenhum documento anexado."}</span>
                <input type="file" className="form-control form-control-sm mt-2" ref={fileInputRef} accept="application/pdf" onChange={(e) => setOfFile(e.target.files[0])} />
                {ofFile && <span className="text-success small mt-1 d-block">Arquivo selecionado: {ofFile.name}</span>}
              </div>
            )}
            {!lockOF && <div className="form-text mt-1">O arquivo será salvo ao clicar em "Salvar Carga"</div>}
            {lockOF && !cargaSalva?.Arquivo_OF && <span className="text-secondary small">Nenhum documento anexado. Edição bloqueada.</span>}
          </div>
        )}
      </div>

      {/* === SEÇÃO 2: PEÇAS === */}
      <div className="mt-5 pt-4 border-top">
        <label className="d-block mb-3 fs-5 text-dark fw-bold">Itens da Carga (Peças)</label>

        {pecasAdicionadas.length > 0 && (
          <>
          <div className="table-responsive mb-4">
            <table className="table table-hover border align-middle shadow-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Peça</th>
                  <th className="text-center">Qtd. Peças</th>
                  <th className="text-center">Embalagem</th>
                  <th className="text-center">Qtd. Emb.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pecasAdicionadas.map((p) => (
                  <tr key={p.ID_Item_Carga}>
                    <td className="fw-semibold">{p.Nome_Peca}</td>
                    <td className="text-center">{p.Quantidade_Pecas}</td>
                    <td className="text-center text-muted small">{p.Embalagem || '-'}</td>
                    <td className="text-center">{p.Quantidade_Embalagem || 0}</td>
                    <td className="text-end">
                      {!lockPlanningFields && (
                        <>
                          <button 
                            className="btn btn-sm btn-outline-primary border-0 me-2" 
                            title="Editar Peça"
                            onClick={() => {
                              setPecaEmEdicao(p);
                              setShowPecaForm(true);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button className="btn btn-sm text-danger border-0" onClick={() => handleRemoverPeca(p.ID_Item_Carga)} title="Remover">
                            <FaTrashAlt />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="small text-muted fw-bold">
                  <td className="text-start">Totais:</td>
                  <td className="text-center text-dark">{pecasAdicionadas.reduce((acc, curr) => acc + (curr.Quantidade_Pecas || 0), 0)}</td>
                  <td></td>
                  <td className="text-center text-dark">{pecasAdicionadas.reduce((acc, curr) => acc + (curr.Quantidade_Embalagem || 0), 0)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border mb-4 shadow-sm">
            <div className="w-100 d-flex justify-content-around">
              <div className="text-center">
                <span className="text-muted small d-block">Peso das Peças</span>
                <span className="fw-bold fs-6 text-danger">
                  {pecasAdicionadas.reduce((acc, curr) => acc + (curr.Peso_Total_Pecas || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                </span>
              </div>
              <div className="text-center">
                <span className="text-muted small d-block">Peso Bruto Total</span>
                <span className="fw-bold fs-5 text-dark">
                  {pecasAdicionadas.reduce((acc, curr) => acc + (curr.Peso_Total_Bruto || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                </span>
              </div>
            </div>
          </div>
          </>
        )}

        {!lockMasterFields && (
          showPecaForm ? (
            <div className="mt-3 bg-white p-3 border rounded shadow-sm">
              <h6 className="fw-bold text-primary mb-3">{pecaEmEdicao ? 'Editar Peça' : 'Adicionar Nova Peça'}</h6>
              <PecaForm 
                idCarga={cargaSalva.ID_Carga} 
                idCliente={formData.ID_Cliente}
                initialData={pecaEmEdicao}
                onSucesso={handlePecaSucesso}
                onCancelar={() => {
                  setShowPecaForm(false);
                  setPecaEmEdicao(null);
                }}
              />
            </div>
          ) : (
            <div className="d-grid mb-4">
              <button 
                className="btn btn-light border text-danger fw-bold py-3 fs-5 shadow-sm" 
                onClick={handleAbrirNovaPeca}
                disabled={loading}
              >
                + Adicionar Peça (Código Olimpo)
              </button>
            </div>
          )
        )}
      </div>

      {/* === SEÇÃO 3: INFORMAÇÕES DO VEÍCULO === */}
      <div className="mt-5 pt-4 border-top">
        <label className="d-block mb-3 fs-5 text-dark fw-bold">Informações do Veículo</label>
        <div className="bg-light p-4 rounded border">
          {!lockFlowFields && veiculosPortaria.filter(v => (isAdmin || isLider) ? true : v.Status === 'No Pátio').length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <label className="form-label text-primary fw-bold">Vincular Veículo da Portaria</label>
                <select 
                  className="form-select border-primary bg-white shadow-sm" 
                  onChange={(e) => {
                    handleVincularPortaria(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">Selecione um veículo no pátio...</option>
                  {veiculosPortaria.filter(v => (isAdmin || isLider) ? true : v.Status === 'No Pátio').map(v => (
                    <option key={v.ID_Portaria} value={v.ID_Portaria}>
                      {v.Placa} - {v.Motorista} ({v.Veiculo}) {v.Cliente_Destino ? `- ${v.Cliente_Destino}` : ''}
                    </option>
                  ))}
                </select>
                <small className="text-muted d-block mt-1">Ao vincular, a placa e o tipo de veículo serão preenchidos automaticamente e o tempo de pátio começará a contar da hora de chegada.</small>
              </div>
            </div>
          )}

          {cargaSalva?.ID_Portaria && (
            <div className="row mb-4">
              <div className="col-12">
                <div className={`alert ${cargaSalva.Portaria_Status === 'Na Portaria' ? 'alert-warning' : cargaSalva.Portaria_Status === 'Aguardando Descida' ? 'alert-info' : 'alert-success'} d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-0`}>
                  <div>
                    <strong>Veículo Vinculado:</strong> Status Portaria: {cargaSalva.Portaria_Status}
                  </div>
                  <div className="d-flex gap-2">
                    {cargaSalva.Portaria_Status === 'Na Portaria' && (isAdmin || isLider) && (
                      <button className="btn btn-warning fw-bold text-dark btn-sm" onClick={handleLiberarDescida}>
                        Liberar Descida
                      </button>
                    )}
                    {(isAdmin || isLider) && (
                      <button className="btn btn-outline-danger btn-sm bg-white" onClick={handleDesvincularPortaria}>
                        Desvincular
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <label className="form-label text-muted">Veículo</label>
              <select className="form-select form-select-lg" name="Veiculo" value={formData.Veiculo} onChange={handleChange} disabled={lockFlowFields}>
                <option value="">Selecione...</option>
                <option value="Rodotrem">Rodotrem</option>
                <option value="Carreta">Carreta</option>
                <option value="Truck e Outros">Truck e Outros</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label text-muted">Placa</label>
              <input type="text" className="form-control form-control-lg text-uppercase" name="Placa" value={formData.Placa} onChange={handleChange} disabled={lockFlowFields} placeholder="ABC-1234" />
            </div>
          </div>
        </div>
      </div>

      {/* === SEÇÃO 4: FOTOS === */}
      <div className="mt-5 pt-4 border-top">
        <label className="d-block mb-3 fs-5 text-dark fw-bold">Fotos da Carga (Galeria)</label>
        <div className="bg-light p-4 rounded border">
          {fotosGaleria.length === 0 ? (
            <div className="text-secondary small">Nenhuma foto anexada.</div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {fotosGaleria.map(f => (
                <div key={f.ID_Foto} className="position-relative" style={{width: '90px', height: '90px'}}>
                  <img 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${f.Caminho_Arquivo}`} 
                    alt="Foto Carga" 
                    className="w-100 h-100 object-fit-cover rounded border shadow-sm"
                    onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${f.Caminho_Arquivo}`, '_blank')}
                    style={{cursor: 'pointer'}}
                  />
                  <button 
                    type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center m-1 shadow"
                    style={{width: '24px', height: '24px', zIndex: 10}}
                    onClick={(e) => handleDeleteFoto(e, f.ID_Foto)}
                    title="Excluir Foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!lockFotos && (
            <div className="mt-3">
              <label className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                <FaUpload /> Adicionar Fotos
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="d-none" 
                  onChange={(e) => {
                    if (e.target.files) setFotosUpload(prev => [...prev, ...Array.from(e.target.files)]);
                  }} 
                />
              </label>
              {fotosUpload.length > 0 && (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {fotosUpload.map((f, i) => (
                    <div key={i} className="position-relative" style={{width: '60px', height: '60px'}}>
                      <img src={URL.createObjectURL(f)} alt="Upload" className="w-100 h-100 object-fit-cover rounded border" />
                      <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 rounded-circle m-1" style={{width: '18px', height: '18px', fontSize: '10px'}} onClick={() => setFotosUpload(prev => prev.filter((_, idx) => idx !== i))}><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === SEÇÃO 5: OBSERVAÇÕES === */}
      <div className="mt-5 pt-4 border-top">
        <label className="d-block mb-3 fs-5 text-dark fw-bold">Observações Adicionais</label>
        <textarea 
          className="form-control form-control-lg border shadow-sm" 
          name="Observacoes" 
          rows="4" 
          placeholder="Digite os detalhes, avarias ou recomendações importantes para o transporte..." 
          value={formData.Observacoes} 
          onChange={handleChange} 
          disabled={lockObservacao}
        ></textarea>
      </div>

      {/* === SEÇÃO 6: ASSINATURA === */}
      <div className="mt-5 pt-4 border-top">
        <label className="d-block mb-3 fs-5 text-dark fw-bold">Assinatura do Operador (Responsável)</label>
        
        {cargaSalva && cargaSalva.Assinatura ? (
          <div className="bg-light p-3 rounded border text-center">
            <div className="bg-white border rounded p-2 mx-auto" style={{maxWidth: '400px'}}>
              <img src={cargaSalva.Assinatura} alt="Assinatura" className="img-fluid" />
            </div>
            <p className="text-muted small mt-2 mb-0">Assinatura digitalizada e vinculada.</p>
          </div>
        ) : (
          !lockAssinatura && (
            <div className="bg-light p-3 rounded border">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Termo de Responsabilidade</span>
                <button 
                  className={`btn btn-sm ${isSignatureLocked ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => setIsSignatureLocked(!isSignatureLocked)}
                  type="button"
                >
                  {isSignatureLocked ? 'Desbloquear para assinar' : 'Bloqueado'}
                </button>
              </div>
              <p className="small mb-3">Atesto que as peças listadas foram verificadas e carregadas.</p>
              
              <div className="border rounded bg-white shadow-sm position-relative" style={{ touchAction: isSignatureLocked ? 'auto' : 'none' }}>
                {isSignatureLocked && (
                  <div 
                    className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', zIndex: 1, cursor: 'pointer' }}
                    onClick={() => setIsSignatureLocked(false)}
                  >
                    <span className="fw-bold text-danger">Toque para desbloquear e assinar</span>
                  </div>
                )}
                <SignatureCanvas 
                  ref={sigCanvas} 
                  penColor="black" 
                  canvasProps={{ width: 500, height: 200, className: 'w-100 border-0 rounded bg-transparent' }} 
                />
              </div>
              <div className="text-end mt-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => sigCanvas.current.clear()}>Limpar Assinatura</button>
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-4 p-3 bg-light rounded border d-flex justify-content-between align-items-center">
        <div>
          <label className="d-flex align-items-center gap-2 fw-bold text-dark mb-1">
            Relatório da Carga (PDF)
          </label>
          <span className="text-secondary small">Gerado automaticamente ao salvar.</span>
        </div>
        {cargaSalva?.PDF_Carga ? (
          <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${cargaSalva.PDF_Carga}`} target="_blank" rel="noreferrer" className="btn btn-primary">
            📄 Visualizar PDF
          </a>
        ) : (
           <span className="badge bg-secondary">Indisponível</span>
        )}
      </div>

      {showAtrasoModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-warning text-dark border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">⚠️ Tempo de Carregamento Excedido</h5>
                <button type="button" className="btn-close" onClick={() => setShowAtrasoModal(false)}></button>
              </div>
              <div className="modal-body pt-4">
                <p className="text-muted mb-4">
                  O tempo limite total para esta carga foi ultrapassado.
                  Para prosseguir com o fechamento, é obrigatório informar a responsabilidade e o motivo do atraso.
                </p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!formData.ID_Responsabilidade_Atraso || !formData.ID_Motivo_Atraso) {
                    toast.error('Preencha os campos obrigatórios!');
                    return;
                  }
                  setShowAtrasoModal(false);
                  salvarCargaSilencioso();
                }}>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Responsabilidade *</label>
                    <select 
                      className="form-select" 
                      name="ID_Responsabilidade_Atraso" 
                      value={formData.ID_Responsabilidade_Atraso} 
                      onChange={(e) => setFormData(prev => ({ ...prev, ID_Responsabilidade_Atraso: e.target.value, ID_Motivo_Atraso: '' }))} 
                      required
                    >
                      <option value="">Selecione...</option>
                      {responsabilidades.map(r => (
                        <option key={r.ID_Responsabilidade} value={r.ID_Responsabilidade}>{r.Nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Motivo *</label>
                    <select 
                      className="form-select" 
                      name="ID_Motivo_Atraso" 
                      value={formData.ID_Motivo_Atraso} 
                      onChange={handleChange} 
                      required
                      disabled={!formData.ID_Responsabilidade_Atraso}
                    >
                      <option value="">Selecione...</option>
                      {motivos.filter(m => m.ID_Responsabilidade === parseInt(formData.ID_Responsabilidade_Atraso)).map(m => (
                        <option key={m.ID_Motivo} value={m.ID_Motivo}>{m.Nome_Motivo}</option>
                      ))}
                    </select>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-light" onClick={() => setShowAtrasoModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-warning fw-medium px-4">Confirmar e Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </Drawer>
  );
};

export default CargaDrawer;
