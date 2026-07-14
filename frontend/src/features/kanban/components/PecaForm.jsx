import React, { useState, useEffect } from 'react';
import { getPecasByCliente, addPecaToCarga, updatePecaInCarga } from '../api/kanbanApi';

const PecaForm = ({ idCarga, idCliente, onSucesso, onCancelar, initialData }) => {
  const [pecasRef, setPecasRef] = useState([]);
  const [embalagensDisponiveis, setEmbalagensDisponiveis] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ID_Cadastro_Peca: initialData ? initialData.ID_Cadastro_Peca : '',
    Nome_Peca: initialData ? initialData.Nome_Peca : '',
    Cod_Olimpo: initialData ? initialData.Codigo_Peca_Olimpo || '' : '',
    Quantidade_Pecas: initialData ? initialData.Quantidade_Pecas : 1,
    Peso_Peca: initialData ? initialData.Peso_Peca : 0,
    ID_Cadastro_Embalagem: initialData ? (initialData.ID_Cadastro_Embalagem || '') : '',
    Embalagem: initialData ? (initialData.Embalagem || '') : '',
    Quantidade_Embalagem: initialData ? (initialData.Quantidade_Embalagem || 0) : 0,
    Peso_Total_Embalagem: initialData ? (initialData.Peso_Total_Embalagem || 0) : 0
  });

  useEffect(() => {
    const carregar = async () => {
      if (!idCliente) return;
      try {
        const pData = await getPecasByCliente(idCliente);
        setPecasRef(pData);
        
        // Se for edição, também precisamos carregar as embalagens disponíveis da peça atual
        if (initialData && initialData.ID_Cadastro_Peca) {
           const pecaSelecionada = pData.find(p => p.ID_Cadastro_Peca === parseInt(initialData.ID_Cadastro_Peca));
           if (pecaSelecionada) {
             setEmbalagensDisponiveis(pecaSelecionada.embalagens || []);
           }
        }
      } catch (err) {
        console.error("Erro ao carregar ref de peças por cliente", err);
      }
    };
    carregar();
  }, [idCliente, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setForm(prev => {
      let updated = { ...prev, [name]: value };
      
      // Ao trocar a Peça
      if (name === 'ID_Cadastro_Peca') {
        const pecaSelecionada = pecasRef.find(p => p.ID_Cadastro_Peca === parseInt(value));
        if (pecaSelecionada) {
          updated.Nome_Peca = pecaSelecionada.Nome_Peca;
          updated.Cod_Olimpo = pecaSelecionada.Cod_Olimpo;
          updated.Peso_Peca = pecaSelecionada.Peso_Liquido || 0;
          setEmbalagensDisponiveis(pecaSelecionada.embalagens || []);
          
          // Resetar embalagem ao trocar peça
          updated.ID_Cadastro_Embalagem = '';
          updated.Embalagem = '';
          updated.Quantidade_Embalagem = 0;
          updated.Peso_Total_Embalagem = 0;
        } else {
          setEmbalagensDisponiveis([]);
        }
      }
      
      // Ao trocar a Embalagem
      if (name === 'ID_Cadastro_Embalagem') {
        const emb = embalagensDisponiveis.find(e => e.ID_Cadastro_Embalagem === parseInt(value));
        if (emb) {
          updated.Embalagem = emb.Nome_Embalagem;
          // Matemática Automática Inicial: Math.ceil(Qtd Peças / Capacidade)
          if (emb.Quantidade_Por_Embalagem > 0) {
            updated.Quantidade_Embalagem = Math.ceil((updated.Quantidade_Pecas || 0) / emb.Quantidade_Por_Embalagem);
          }
          updated.Peso_Total_Embalagem = (updated.Quantidade_Embalagem || 0) * (emb.Peso_Tara || 0);
        }
      }

      // Ao trocar a Quantidade de Peças, recalcular Quantidade de Embalagem (se existir embalagem selecionada)
      if (name === 'Quantidade_Pecas') {
        if (updated.ID_Cadastro_Embalagem) {
           const emb = embalagensDisponiveis.find(e => e.ID_Cadastro_Embalagem === parseInt(updated.ID_Cadastro_Embalagem));
           if (emb && emb.Quantidade_Por_Embalagem > 0) {
              updated.Quantidade_Embalagem = Math.ceil((parseInt(value) || 0) / emb.Quantidade_Por_Embalagem);
              updated.Peso_Total_Embalagem = updated.Quantidade_Embalagem * (emb.Peso_Tara || 0);
           }
        }
      }

      // Se o líder alterar a quantidade de embalagens manualmente
      if (name === 'Quantidade_Embalagem') {
        const emb = embalagensDisponiveis.find(e => e.ID_Cadastro_Embalagem === parseInt(updated.ID_Cadastro_Embalagem));
        if (emb) {
          updated.Peso_Total_Embalagem = (parseInt(value) || 0) * (emb.Peso_Tara || 0);
        }
      }
      
      return updated;
    });
  };

  const handleAumentarQtde = () => handleChange({ target: { name: 'Quantidade_Pecas', value: parseInt(form.Quantidade_Pecas || 0) + 1 }});
  const handleDiminuirQtde = () => handleChange({ target: { name: 'Quantidade_Pecas', value: Math.max(1, parseInt(form.Quantidade_Pecas || 0) - 1) }});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ID_Cadastro_Peca) return alert("Selecione uma peça");
    
    setLoading(true);
    try {
      const payload = {
        ...form,
        Quantidade_Pecas: parseInt(form.Quantidade_Pecas),
        Peso_Peca: parseFloat(form.Peso_Peca),
        Quantidade_Embalagem: parseInt(form.Quantidade_Embalagem || 0),
        Peso_Total_Embalagem: parseFloat(form.Peso_Total_Embalagem || 0)
      };
      
      let pecaSalva;
      if (initialData && initialData.ID_Item_Carga) {
         pecaSalva = await updatePecaInCarga(idCarga, initialData.ID_Item_Carga, payload);
      } else {
         pecaSalva = await addPecaToCarga(idCarga, payload);
      }
      
      onSucesso(pecaSalva);
    } catch (err) {
      alert("Erro ao salvar peça: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const pesoTotalPecasCalc = (parseFloat(form.Peso_Peca || 0) * parseInt(form.Quantidade_Pecas || 0)).toFixed(2);

  if (!idCliente) {
     return <div className="alert alert-warning">Por favor, selecione um Cliente na aba principal da carga antes de adicionar peças.</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row mb-3">
        <div className="col-8">
          <label>Peça (Filtrada por Cliente) *</label>
          <select className="form-select form-select-lg" name="ID_Cadastro_Peca" value={form.ID_Cadastro_Peca} onChange={handleChange} required>
            <option value="">Selecione...</option>
            {pecasRef.map(p => (
              <option key={p.ID_Cadastro_Peca} value={p.ID_Cadastro_Peca}>{p.Nome_Peca}</option>
            ))}
          </select>
          {pecasRef.length === 0 && <small className="text-danger mt-1 d-block">Nenhuma peça parametrizada (Cód. Olimpo) para este cliente.</small>}
        </div>
        <div className="col-4">
          <label>Cód. Olimpo</label>
          <input type="text" className="form-control form-control-lg bg-light" value={form.Cod_Olimpo || ''} readOnly placeholder="Automático" />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label>Quantidade de Peças</label>
          <div className="input-group input-group-lg">
            <button className="btn btn-outline-secondary px-4 fw-bold" type="button" onClick={handleDiminuirQtde}>-</button>
            <input type="number" className="form-control text-center fw-bold" name="Quantidade_Pecas" value={form.Quantidade_Pecas} onChange={handleChange} min="1" required />
            <button className="btn btn-outline-secondary px-4 fw-bold" type="button" onClick={handleAumentarQtde}>+</button>
          </div>
        </div>
        <div className="col-6">
          <label>Peso Total (Peças)</label>
          <input type="text" className="form-control form-control-lg bg-light text-danger fw-bold text-end" value={`${pesoTotalPecasCalc} kg`} disabled />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-6">
          <label>Embalagem</label>
          <select className="form-select" name="ID_Cadastro_Embalagem" value={form.ID_Cadastro_Embalagem} onChange={handleChange}>
            <option value="">Nenhuma (Avulsa)</option>
            {embalagensDisponiveis.map(e => (
              <option key={e.ID_Cadastro_Embalagem} value={e.ID_Cadastro_Embalagem}>
                {e.Nome_Embalagem} (Max: {e.Quantidade_Por_Embalagem})
              </option>
            ))}
          </select>
        </div>
        <div className="col-6">
          <label>Quantidade de Embalagens</label>
          <input type="number" className="form-control" name="Quantidade_Embalagem" value={form.Quantidade_Embalagem} onChange={handleChange} min="0" />
          <small className="text-muted">Calculado auto., editável</small>
        </div>
      </div>

      <div className="d-flex gap-3 pt-3 border-top">
        <button type="button" className="btn btn-light py-2 flex-grow-1" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-danger py-2 flex-grow-1 fw-bold shadow-sm" disabled={loading}>
          {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Confirmar Inclusão'}
        </button>
      </div>
    </form>
  );
};

export default PecaForm;
