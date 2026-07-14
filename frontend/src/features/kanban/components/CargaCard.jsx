import React, { useContext } from 'react';
import { FaTruck, FaBuilding, FaBoxOpen, FaCube, FaWeightHanging, FaFilePdf } from 'react-icons/fa';
import api from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext';

const CargaCard = ({ carga, columnColor, onClick }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.perfil === 'Admin';
  const permissoes = user?.permissoes || [];
  const isLider = permissoes.includes('CARGA_CRIAR') && !isAdmin;
  const isFaturamento = permissoes.includes('TELA_FATURAMENTO') && !isAdmin && !isLider;
  const isOperador = !isAdmin && !isLider && !isFaturamento;

  // O backend retorna 'Data' (que pode ser ISO string ou data nativa)
  const dataFormatada = carga.Data 
    ? new Date(carga.Data).toLocaleDateString('pt-BR') 
    : 'Data Inválida';
  // Define a cor da borda com base na Criticidade
  const borderLeftColor = carga.Criticidade === 'Alta' ? '#dc3545' : 
                          carga.Criticidade === 'Baixa' ? '#0dcaf0' : 
                          '#ffc107'; // Média

  return (
    <div 
      className="kanban-card p-2 mb-2 bg-white shadow-sm"
      style={{ borderLeft: `6px solid ${borderLeftColor}`, borderRadius: '8px', cursor: 'pointer' }}
      onClick={() => onClick && onClick(carga.ID_Carga)}
    >
      {/* Topo do Card: Data e ID */}
      <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
        <span className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
          {dataFormatada}
        </span>
        <div className="d-flex align-items-center gap-1 flex-wrap justify-content-end">
          {carga.PDF_Carga && (
            <span 
              className="badge bg-primary text-white border" 
              title="Visualizar Relatório (PDF)" 
              style={{cursor: 'pointer', fontSize: '0.65rem', padding: '0.2rem 0.4rem'}} 
              onClick={(e) => { 
                 e.stopPropagation(); 
                 window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${carga.PDF_Carga}`, '_blank'); 
              }}
            >
              <FaFilePdf size={12} className="me-1" /> PDF
            </span>
          )}
          {!isOperador && carga.Arquivo_OF && (
            <span 
              className="badge bg-danger text-white border" 
              title="Documento OF Anexado" 
              style={{cursor: 'pointer', fontSize: '0.65rem', padding: '0.2rem 0.4rem'}} 
              onClick={(e) => { 
                 e.stopPropagation(); 
                 window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${carga.Arquivo_OF}`, '_blank'); 
              }}
            >
              <FaFilePdf size={12} className="me-1" /> OF
            </span>
          )}
          <span className={`badge ${
            carga.Status_Faturamento === 'Liberado' ? 'bg-success' : 
            carga.Status_Faturamento === 'Somente Embalagens' ? 'bg-warning text-dark' : 
            carga.Status_Faturamento === 'Faturada' ? 'bg-success' : 
            'bg-secondary'
          }`} title="Status de Faturamento" style={{fontSize: '0.65rem', padding: '0.2rem 0.4rem'}}>
             {carga.Status_Faturamento || 'Não Liberado'}
          </span>
        </div>
      </div>
      
      {/* Nome da Carga (O mais importante, estilo Appsheet) */}
      <div className="mb-1 mt-1">
        <h6 className="m-0 fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }} title={carga.Nome_Carga || 'Sem nome'}>
          {carga.Nome_Carga || 'Carga Sem Identificação'}
        </h6>
      </div>

      {/* Cliente e Transportadora */}
      <div className="mb-2">
        <div className="text-truncate text-secondary mb-1" style={{ fontSize: '0.75rem' }} title={carga.Cliente_Nome}>
          <FaBuilding className="me-1" />
          {carga.Cliente_Nome || 'Cliente não informado'}
        </div>
        <div className="text-truncate text-secondary" style={{ fontSize: '0.75rem' }} title={carga.Transportadora_Nome}>
          <FaTruck className="me-1" />
          {carga.Transportadora_Nome || 'Transp. não informada'}
          {carga.ID_Portaria && (
            <span className="ms-1 badge border border-primary text-primary bg-light rounded-pill" style={{fontSize: '0.6rem', padding: '0.15rem 0.3rem'}} title={`Placa: ${carga.Placa || 'Vinculado'}`}>
              VINCULADO
            </span>
          )}
        </div>
      </div>
      
      {/* Rodapé: Quantidades e Status Adicional */}
      <div className="d-flex justify-content-between align-items-center pt-1 border-top flex-wrap gap-1">
        <div className="d-flex align-items-center text-secondary" style={{ fontSize: '0.75rem' }} title="Total de Peças">
          <FaBoxOpen className="me-1" size={12} />
          <strong className="text-dark">{carga.Quantidade_Total_Pecas || 0}</strong>
        </div>
        <div className="d-flex align-items-center text-secondary" style={{ fontSize: '0.75rem' }} title="Total de Embalagens">
          <FaCube className="me-1" size={12} />
          <strong className="text-dark">{carga.Quantidade_Total_Embalagens || 0}</strong>
        </div>
        <div className="d-flex align-items-center text-secondary" style={{ fontSize: '0.75rem' }} title="Peso Bruto Total">
          <FaWeightHanging className="me-1" size={12} />
          <strong className="text-dark">{(carga.Peso_Total_Bruto || 0).toLocaleString('pt-BR')} kg</strong>
        </div>
      </div>
    </div>
  );
};

export default CargaCard;
