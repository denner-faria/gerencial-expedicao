import api from './api';

export const getPecas = async () => {
    const { data } = await api.get('/pecas');
    return data;
};

export const createPeca = async (peca) => {
    const { data } = await api.post('/pecas', peca);
    return data;
};

export const updatePeca = async (id, peca) => {
    const { data } = await api.put(`/pecas/${id}`, peca);
    return data;
};

export const deletePeca = async (id) => {
    const { data } = await api.delete(`/pecas/${id}`);
    return data;
};

// Precisamos de clientes e embalagens para popular os selects no modal
export const getClientes = async () => {
    const { data } = await api.get('/clientes');
    return data;
};

export const getEmbalagens = async () => {
    const { data } = await api.get('/embalagens');
    return data;
};
