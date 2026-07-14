import React, { useEffect, useState } from 'react';
import { getStatusCargas, getCargas } from '../api/kanbanApi';
import KanbanColumn from './KanbanColumn';
import { socket } from '../../../services/socket';
import './KanbanBoard.css';

const KanbanBoard = ({ onCardClick }) => {
  const [columns, setColumns] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusData, cargasData] = await Promise.all([
          getStatusCargas(),
          getCargas()
        ]);
        
        const sortedColumns = statusData.sort((a, b) => a.Ordem - b.Ordem);
        setColumns(sortedColumns);
        setCargas(cargasData);
      } catch (error) {
        console.error('Erro ao buscar dados do Kanban:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Socket.io Real-time updates
    socket.on('carga_evento', (evento) => {
      if (evento.acao === 'carga_criada') {
        setCargas(prev => [...prev, evento.carga]);
      } else if (evento.acao === 'status_atualizado') {
        setCargas(prev => prev.map(c => 
          c.ID_Carga === Number(evento.idCarga) ? { ...c, ID_Status: evento.idStatus } : c
        ));
      } else if (evento.acao === 'peca_adicionada' || evento.acao === 'peca_removida') {
        setCargas(prev => prev.map(c => 
          c.ID_Carga === Number(evento.idCarga) ? { ...c, ...evento.totais } : c
        ));
      } else if (evento.acao === 'carga_atualizada') {
        setCargas(prev => prev.map(c => 
          c.ID_Carga === Number(evento.carga.ID_Carga) ? { ...c, ...evento.carga } : c
        ));
      } else if (evento.acao === 'carga_excluida') {
        setCargas(prev => prev.filter(c => c.ID_Carga !== Number(evento.idCarga)));
      } else if (evento.acao === 'carga_assinada') {
        // Atualiza temporariamente no kanban até a próxima requisição (opcional)
        // Se a assinatura vem como evento, poderíamos puxar, mas o status_atualizado já cuida do card
      } else if (evento.acao === 'fotos_adicionadas') {
        // Apenas trigger de log ou algo menor
      }
    });

    return () => {
      socket.off('carga_evento');
    };
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Carregando Quadro Kanban...</div>;
  }

  const getCargasForColumn = (column) => {
    let list = cargas.filter(c => c.ID_Status === column.ID_Status);
    
    if (column.Ordem === 3) {
      const today = new Date();
      list = list.filter(c => {
         if (!c.Data_Inicio_Carregamento) return false;
         const cargaDate = new Date(c.Data_Inicio_Carregamento);
         return cargaDate.getDate() === today.getDate() &&
                cargaDate.getMonth() === today.getMonth() &&
                cargaDate.getFullYear() === today.getFullYear();
      });
    }
    
    return list;
  };

  return (
    <div className="kanban-board-container">
      <div className="kanban-board">
        {columns.map((column) => (
          <KanbanColumn 
            key={column.ID_Status} 
            column={column} 
            cargas={getCargasForColumn(column)} 
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
