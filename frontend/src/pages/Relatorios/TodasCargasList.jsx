import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Package, Truck, Database, Printer } from 'lucide-react';
import DataTable from 'react-data-table-component';
import CargaDrawer from '../../features/kanban/components/CargaDrawer';

const TodasCargasList = () => {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(() => localStorage.getItem('relatorio_startDate') || todayStr);
  const [endDate, setEndDate] = useState(() => localStorage.getItem('relatorio_endDate') || todayStr);

  useEffect(() => {
    localStorage.setItem('relatorio_startDate', startDate);
    localStorage.setItem('relatorio_endDate', endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchCargas();
  }, []);

  const fetchCargas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cargas');
      setCargas(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar cargas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (row) => {
    setSelectedCargaId(row.ID_Carga);
    setIsDrawerOpen(true);
  };

  const columns = [
    {
      name: 'Data',
      selector: row => row.Data ? new Date(row.Data).toLocaleDateString('pt-BR') : '',
      sortable: true,
      wrap: true
    },
    {
      name: 'Nome da Carga',
      selector: row => row.Nome_Carga || '',
      sortable: true,
      wrap: true,
      minWidth: '250px'
    },
    {
      name: 'Cliente',
      selector: row => row.Cliente_Nome || '',
      sortable: true,
      wrap: true,
      minWidth: '250px',
      style: {
        justifyContent: 'flex-start',
        textAlign: 'left'
      }
    },
    {
      name: 'Transportadora',
      selector: row => row.Transportadora_Nome || '',
      sortable: true,
      wrap: true
    },
    {
      name: 'Qtde Peças',
      selector: row => row.Quantidade_Total_Pecas || 0,
      sortable: true,
      right: true
    },
    {
      name: 'Peso Total Peças (kg)',
      selector: row => row.Peso_Total_Pecas ? Number(row.Peso_Total_Pecas).toLocaleString('pt-BR') : '0',
      sortable: true,
      right: true
    },
    {
      name: 'Peso Total Bruto (kg)',
      selector: row => row.Peso_Total_Bruto ? Number(row.Peso_Total_Bruto).toLocaleString('pt-BR') : '0',
      sortable: true,
      right: true
    },
    {
      name: 'Status',
      selector: row => row.Status_Nome || '',
      sortable: true,
      cell: row => (
        <span className="badge rounded-pill text-white" style={{ backgroundColor: row.Cor_Kanban || '#6c757d' }}>
          {row.Status_Nome}
        </span>
      )
    }
  ];

  const filteredItems = cargas.filter(item => {
    let matchesText = true;
    if (filterText) {
      matchesText = 
        (item.Nome_Carga && item.Nome_Carga.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.Cliente_Nome && item.Cliente_Nome.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.Transportadora_Nome && item.Transportadora_Nome.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.Status_Nome && item.Status_Nome.toLowerCase().includes(filterText.toLowerCase()));
    }
    
    let matchesDate = true;
    if (startDate || endDate) {
      if (!item.Data) {
        matchesDate = false;
      } else {
        const itemDateStr = new Date(item.Data).toISOString().split('T')[0];
        if (startDate && itemDateStr < startDate) matchesDate = false;
        if (endDate && itemDateStr > endDate) matchesDate = false;
      }
    }
    
    return matchesText && matchesDate;
  });

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Database size={28} className="text-primary" />
            Todas as Cargas
          </h2>
          <p className="text-muted mb-0">Relatório consolidado de todas as cargas do sistema</p>
        </div>
        <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={() => window.print()}>
          <Printer size={18} />
          Imprimir Tabela
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-3 no-print">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted fw-bold">Período:</span>
            <input 
              type="date" 
              className="form-control form-control-sm" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span className="text-muted">até</span>
            <input 
              type="date" 
              className="form-control form-control-sm" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light border-end-0"><Database size={18} className="text-muted" /></span>
            <input 
              type="text" 
              className="form-control border-start-0 bg-light" 
              placeholder="Buscar por Carga, Cliente, Transportadora ou Status..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body p-0 printable-area">
          <DataTable
            columns={columns}
            data={filteredItems}
            pagination
            highlightOnHover
            pointerOnHover
            striped
            onRowClicked={handleRowClick}
            progressPending={loading}
            progressComponent={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}
            noDataComponent={<div className="p-5 text-center text-muted">Nenhuma carga encontrada.</div>}
            paginationComponentOptions={{ rowsPerPageText: 'Linhas por página:', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
            customStyles={{
              headRow: { style: { backgroundColor: '#f8f9fa', fontWeight: 'bold', color: '#495057' } },
              headCells: { style: { justifyContent: 'center', textAlign: 'center' } },
              cells: { style: { justifyContent: 'center', textAlign: 'center' } }
            }}
          />
        </div>
      </div>

      <CargaDrawer 
        show={isDrawerOpen} 
        cargaId={selectedCargaId}
        onClose={() => {
          setIsDrawerOpen(false);
          fetchCargas();
        }} 
      />
    </div>
  );
};

export default TodasCargasList;
