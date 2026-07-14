import React from 'react';

const CarregadaTab = ({ cargas, onClickCarga }) => {
  if (cargas.length === 0) {
    return <div className="text-center text-muted mt-5">Nenhuma carga finalizada aguardando faturamento.</div>;
  }

  return (
    <div className="list-group list-group-flush w-100">
      {cargas.map(carga => (
        <div 
          key={carga.ID_Carga} 
          onClick={() => onClickCarga(carga.ID_Carga)}
          className="list-group-item border-0 border-bottom border-start border-4 border-success d-flex justify-content-between align-items-center bg-white rounded-0 opacity-75"
          style={{ padding: '1.25rem 1rem', cursor: 'pointer' }}
        >
          <div className="flex-grow-1 overflow-hidden pe-3">
            <div className="d-flex align-items-center gap-2 mb-1">
              <h6 className="fw-bold text-dark m-0 text-truncate" style={{ fontSize: '16px' }}>{carga.Nome_Carga}</h6>
              <span className="badge bg-success" style={{ fontSize: '11px' }}>Finalizada</span>
            </div>
            <p className="text-muted text-truncate m-0" style={{ fontSize: '13px' }}>
              {carga.Transportadora_Nome || carga.Cliente_Nome || 'Transp. não informada'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarregadaTab;
