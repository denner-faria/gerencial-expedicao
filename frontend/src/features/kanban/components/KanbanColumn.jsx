import React from 'react';
import CargaCard from './CargaCard';

const KanbanColumn = ({ column, cargas, onCardClick }) => {
  return (
    <div className="kanban-column shadow-sm">
      <div 
        className="kanban-column-header"
        style={{ borderBottom: `3px solid ${column.Cor_Kanban || 'var(--primary-red)'}` }}
      >
        <h5 className="m-0 py-2 d-flex justify-content-between align-items-center">
          {column.Nome}
          <span className="badge bg-secondary rounded-pill">{cargas.length}</span>
        </h5>
      </div>
      
      <div className="kanban-column-body mt-3">
        {cargas.length === 0 ? (
          <div className="text-muted text-center small py-3">Nenhuma carga</div>
        ) : (
          cargas.map(carga => (
            <CargaCard 
              key={carga.ID_Carga} 
              carga={carga} 
              columnColor={column.Cor_Kanban} 
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
