import React, { useState, useContext } from 'react';
import KanbanBoard from '../../features/kanban/components/KanbanBoard';
import CargaDrawer from '../../features/kanban/components/CargaDrawer';
import { AuthContext } from '../../context/AuthContext';

const Kanban = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCargaId, setSelectedCargaId] = useState(null);

  const { user } = useContext(AuthContext);
  const permissoes = user?.permissoes || [];
  const isAdmin = user?.perfil === 'Admin' || permissoes.includes('*');
  const canCreate = isAdmin || permissoes.includes('CARGA_CRIAR');

  const handleOpenNewCarga = () => {
    setSelectedCargaId(null);
    setIsDrawerOpen(true);
  };

  const handleCardClick = (idCarga) => {
    setSelectedCargaId(idCarga);
    setIsDrawerOpen(true);
  };

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="m-0 text-dark fw-bold">Planejamento de Cargas</h2>
        {canCreate && (
          <button 
            className="btn btn-danger fw-bold shadow-sm" 
            onClick={handleOpenNewCarga}
          >
            + Planejar Carga
          </button>
        )}
      </div>
      
      <div className="flex-grow-1 overflow-hidden">
        <KanbanBoard onCardClick={handleCardClick} />
      </div>

      <CargaDrawer 
        show={isDrawerOpen} 
        cargaId={selectedCargaId}
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
};

export default Kanban;
