import api from '../../../services/api';
import { addToOfflineQueue } from '../../../services/offlineSync';

const handleOffline = (url, method, data, mockReturnData = { success: true, offline: true }) => {
  if (!navigator.onLine) {
    addToOfflineQueue({ url, method, data });
    return mockReturnData;
  }
  return null;
};

export const getStatusCargas = async () => {
  const response = await api.get('/status-carga');
  return response.data;
};

export const getCargas = async () => {
  const response = await api.get('/cargas');
  return response.data;
};

export const getCargaById = async (id) => {
  const response = await api.get(`/cargas/${id}`);
  return response.data;
};

export const getSequenciaDia = async (idCliente, data) => {
  const url = data ? `/cargas/sequencia/${idCliente}?data=${data}` : `/cargas/sequencia/${idCliente}`;
  const response = await api.get(url);
  return response.data.sequencia;
};

export const getClientes = async () => {
  const response = await api.get('/clientes');
  return response.data;
};

export const getTransportadoras = async () => {
  const response = await api.get('/transportadoras');
  return response.data;
};

export const getPecas = async () => {
  const response = await api.get('/pecas');
  return response.data;
};

export const getPecasByCliente = async (idCliente) => {
  const response = await api.get(`/pecas/cliente/${idCliente}`);
  return response.data;
};

export const getEmbalagens = async () => {
  const response = await api.get('/embalagens');
  return response.data;
};

export const createCarga = async (cargaData) => {
  const response = await api.post('/cargas', cargaData);
  return response.data;
};

export const updateCarregandoInfo = async (id, data) => {
  const offlineMock = handleOffline(`/cargas/${id}/carregando`, 'patch', data, { ID_Carga: id, ...data });
  if (offlineMock) return offlineMock;

  const response = await api.patch(`/cargas/${id}/carregando`, data);
  return response.data;
};

export const updateObservacoesCarga = async (id, observacoes) => {
  const offlineMock = handleOffline(`/cargas/${id}/observacoes`, 'patch', { Observacoes: observacoes }, { ID_Carga: id, Observacoes: observacoes });
  if (offlineMock) return offlineMock;

  const response = await api.patch(`/cargas/${id}/observacoes`, { Observacoes: observacoes });
  return response.data;
};

export const saveAssinatura = async (id, base64) => {
  const offlineMock = handleOffline(`/cargas/${id}/assinatura`, 'patch', { Assinatura: base64 }, { ID_Carga: id });
  if (offlineMock) return offlineMock;

  const response = await api.patch(`/cargas/${id}/assinatura`, { Assinatura: base64 });
  return response.data;
};

export const addFotosCarga = async (id, files) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('fotos', file);
  }
  const response = await api.post(`/cargas/${id}/fotos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getFotosCarga = async (id) => {
  const response = await api.get(`/cargas/${id}/fotos`);
  return response.data;
};

export const removeFotoCarga = async (idFoto) => {
  const response = await api.delete(`/cargas/fotos/${idFoto}`);
  return response.data;
};

export const addPecaToCarga = async (idCarga, data) => {
  const response = await api.post(`/cargas/${idCarga}/pecas`, data);
  return response.data;
};

export const updatePecaInCarga = async (idCarga, idPeca, data) => {
  const response = await api.put(`/cargas/${idCarga}/pecas/${idPeca}`, data);
  return response.data;
};

export const toggleSaldoPecaInCarga = async (idCarga, idPeca, checado) => {
  const response = await api.patch(`/cargas/${idCarga}/pecas/${idPeca}/saldo`, { Saldo_Checado: checado });
  return response.data;
};

export const updateCarga = async (id, data) => {
  const response = await api.put(`/cargas/${id}`, data);
  return response.data;
};

export const deleteCarga = async (id) => {
  const response = await api.delete(`/cargas/${id}`);
  return response.data;
};

export const updateStatusCarga = async (idCarga, idStatus) => {
  const offlineMock = handleOffline(`/cargas/${idCarga}/status`, 'patch', { ID_Status: idStatus }, { ID_Carga: idCarga, ID_Status: idStatus });
  if (offlineMock) return offlineMock;

  const response = await api.patch(`/cargas/${idCarga}/status`, { ID_Status: idStatus });
  return response.data;
};

export const removePecaFromCarga = async (idPeca) => {
  const response = await api.delete(`/cargas/pecas/${idPeca}`);
  return response.data;
};

export const updateStatusFaturamento = async (id, statusFaturamento, nfsPecas, nfsEmbalagens) => {
  const response = await api.patch(`/cargas/${id}/faturamento`, { 
    Status_Faturamento: statusFaturamento,
    NFs_Pecas: nfsPecas,
    NFs_Embalagens: nfsEmbalagens
  });
  return response.data;
};

export const uploadOFCarga = async (id, file) => {
  const formData = new FormData();
  formData.append('of', file);
  const response = await api.post(`/cargas/${id}/upload-of`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
