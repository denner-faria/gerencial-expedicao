import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Tv, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfiguracoesGerais() {
  const [config, setConfig] = useState({ TV_Painel_Ativo: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config-globais');
      const data = res.data;
      const painelAtivo = data.find(d => d.Chave === 'TV_Painel_Ativo');
      setConfig({
        TV_Painel_Ativo: painelAtivo ? painelAtivo.Valor === 'true' : false
      });
    } catch (error) {
      console.error('Erro ao buscar configurações', error);
      toast.error('Erro ao buscar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const newVal = !config.TV_Painel_Ativo;
    setConfig({ ...config, TV_Painel_Ativo: newVal });
    
    try {
      await api.put('/config-globais', {
        chave: 'TV_Painel_Ativo',
        valor: newVal ? 'true' : 'false'
      });
      toast.success('Configuração atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar', error);
      toast.error('Erro ao atualizar configuração');
      // revert on error
      setConfig({ ...config, TV_Painel_Ativo: !newVal });
    }
  };

  if (loading) {
    return <div className="p-4">Carregando configurações...</div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-4">
        <Settings className="text-primary me-2" size={28} />
        <h2 className="mb-0 text-dark fw-bold">Configurações Gerais</h2>
      </div>

      <div className="card shadow-sm border-0 mb-4" style={{ maxWidth: '600px' }}>
        <div className="card-body">
          <h5 className="card-title fw-bold mb-4">Integrações</h5>
          
          <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded border">
            <div className="d-flex align-items-center">
              <Tv className="text-secondary me-3" size={24} />
              <div>
                <h6 className="mb-0 fw-bold">Painel de TV (Expedição)</h6>
                <small className="text-muted">Ativa ou desativa a rota de dados para a tela da TV.</small>
              </div>
            </div>
            <div className="form-check form-switch fs-4 mb-0">
              <input 
                className="form-check-input cursor-pointer" 
                type="checkbox" 
                role="switch" 
                id="tvSwitch" 
                checked={config.TV_Painel_Ativo}
                onChange={handleToggle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
