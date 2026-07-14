import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getCargaById, updateCarregandoInfo, getStatusCargas, updateStatusCarga } from '../../features/kanban/api/kanbanApi';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const IniciarCarregamento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [carga, setCarga] = useState(null);
  const [formData, setFormData] = useState({ Veiculo: '', Placa: '' });
  const [loading, setLoading] = useState(false);
  const [veiculosPortaria, setVeiculosPortaria] = useState([]);
  const { user } = useContext(AuthContext);
  const permissoes = user?.permissoes || [];
  const isAdmin = user?.perfil === 'Admin' || permissoes.includes('*');
  const isLider = permissoes.includes('CARGA_CRIAR') && !isAdmin;

  useEffect(() => {
    const loadCarga = async () => {
      try {
        const data = await getCargaById(id);
        setCarga(data);
        setFormData({
          Veiculo: data.Veiculo || '',
          Placa: data.Placa || ''
        });
      } catch (error) {
        console.error("Erro ao carregar carga", error);
      }
      
      try {
        const vData = await api.get('/portaria/disponiveis').then(r => r.data);
        setVeiculosPortaria(vData || []);
      } catch (e) {
        console.error("Erro ao carregar veículos da portaria", e);
      }
    };
    loadCarga();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCarregandoInfo(id, formData);
      
      const statusData = await getStatusCargas();
      const statusCarregando = statusData.find(s => s.Ordem === 2);
      if (statusCarregando) {
        await updateStatusCarga(id, statusCarregando.ID_Status);
      }

      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Erro ao iniciar carregamento');
    } finally {
      setLoading(false);
    }
  };

  const handleVincularPortaria = async (idPortaria) => {
    if (!idPortaria || !id) return;
    try {
      await api.patch(`/portaria/${idPortaria}/vincular`, { idCarga: id });
      toast.success('Veículo vinculado com sucesso!');
      const v = veiculosPortaria.find(x => x.ID_Portaria === parseInt(idPortaria));
      if (v) {
        setFormData(prev => ({ ...prev, Placa: v.Placa, Veiculo: v.Veiculo }));
      }
      setVeiculosPortaria(prev => prev.filter(x => x.ID_Portaria !== parseInt(idPortaria)));
    } catch (error) {
      toast.error('Erro ao vincular veículo.');
    }
  };

  if (!carga) return <div className="p-4 text-center">Carregando...</div>;

  const formatTime = (t) => t ? (t.includes('T') ? new Date(t.endsWith('Z') ? t.slice(0, -1) : t).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : t.substring(0, 5)) : '--:--';

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <div className="bg-white p-3 d-flex align-items-center shadow-sm position-sticky top-0 z-3">
        <button className="btn btn-link text-dark p-0 me-3" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h5 className="m-0 fw-bold">Iniciar Carregamento</h5>
      </div>
      
      <div className="p-3 flex-grow-1 overflow-auto">
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body pb-2">
            <h5 className="fw-bold text-dark mb-1">{carga.Nome_Carga}</h5>
            <p className="text-muted small mb-2">
              {carga.Transportadora_Nome || carga.Cliente_Nome || 'Transportadora não informada'}
            </p>
            <div className="d-flex justify-content-between border-top pt-2">
              <div className="text-muted small">
                <strong>Prev. Chegada:</strong> <span className="text-dark fw-semibold">{formatTime(carga.Hora_Prevista_Chegada)}</span>
              </div>
              <div className="text-muted small">
                <strong>Prev. Saída:</strong> <span className="text-dark fw-semibold">{formatTime(carga.Hora_Prevista_Saida)}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {veiculosPortaria.filter(v => (isAdmin || isLider) ? true : v.Status === 'No Pátio').length > 0 && (
            <div className="mb-4 bg-light p-3 rounded border">
              <label className="form-label text-primary fw-bold">Vincular Veículo da Portaria</label>
              <select 
                className="form-select border-primary" 
                onChange={(e) => {
                  handleVincularPortaria(e.target.value);
                  e.target.value = '';
                }}
              >
                <option value="">Selecione um veículo no pátio...</option>
                {veiculosPortaria.filter(v => (isAdmin || isLider) ? true : v.Status === 'No Pátio').map(v => (
                  <option key={v.ID_Portaria} value={v.ID_Portaria}>
                    {v.Placa} - {v.Motorista} ({v.Veiculo})
                  </option>
                ))}
              </select>
              <small className="text-muted d-block mt-2" style={{fontSize: '0.8rem'}}>
                Puxe os dados de quem já fez check-in para facilitar e travar a hora de chegada correta.
              </small>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-bold">Tipo de Veículo</label>
            <select 
              className="form-select form-select-lg"
              value={formData.Veiculo}
              onChange={(e) => setFormData({...formData, Veiculo: e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              <option value="Rodotrem">Rodotrem</option>
              <option value="Carreta">Carreta</option>
              <option value="Truck e Outros">Truck e Outros</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold">Placa do Veículo</label>
            <input 
              type="text" 
              className="form-control form-control-lg text-uppercase" 
              placeholder="ABC-1234"
              value={formData.Placa}
              onChange={(e) => setFormData({...formData, Placa: e.target.value.toUpperCase()})}
              required
            />
          </div>

          {carga.Itens && carga.Itens.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Peças para Carregar</h6>
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
        </form>
      </div>

      <div className="p-3 bg-white border-top shadow-sm">
        <button 
          className="btn btn-primary w-100 py-3 fw-bold fs-5 shadow-sm"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Confirmar Veículo e Iniciar'}
        </button>
      </div>
    </div>
  );
};

export default IniciarCarregamento;
