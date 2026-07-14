import React from 'react';
import { PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CarregandoTab = ({ cargas, onClickCarga }) => {

  if (cargas.length === 0) {
    return <div className="p-4 text-center text-muted">Nenhuma carga em processo de carregamento.</div>;
  }

  return (
    <div className="list-group list-group-flush w-100">
      {cargas.map(carga => (
        <div 
          key={carga.ID_Carga} 
          className="list-group-item border-0 border-bottom border-start border-4 border-info d-flex justify-content-between align-items-center bg-white rounded-0"
          style={{ cursor: 'pointer', padding: '1.25rem 1rem' }}
          onClick={() => onClickCarga(carga.ID_Carga)}
        >
          <div className="flex-grow-1 overflow-hidden pe-3">
            <h6 className="fw-bold text-dark mb-1 text-truncate" style={{ fontSize: '16px' }}>{carga.Nome_Carga}</h6>
            <p className="text-muted text-truncate m-0" style={{ fontSize: '13px' }}>
              {carga.Transportadora_Nome || carga.Cliente_Nome || 'Transp. não informada'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarregandoTab;
