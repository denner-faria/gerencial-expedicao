import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Package, Search, Filter, Printer } from 'lucide-react';
import DataTable from 'react-data-table-component';

const PecasExpedidasList = () => {
  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(() => localStorage.getItem('relatorio_startDate') || todayStr);
  const [endDate, setEndDate] = useState(() => localStorage.getItem('relatorio_endDate') || todayStr);

  useEffect(() => {
    localStorage.setItem('relatorio_startDate', startDate);
    localStorage.setItem('relatorio_endDate', endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchPecas();
  }, []);

  const fetchPecas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/relatorios/pecas-expedidas');
      setPecas(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar peças expedidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      name: 'Data',
      selector: row => row.Data ? new Date(row.Data).toLocaleDateString('pt-BR') : '',
      sortable: true,
      wrap: true
    },
    {
      name: 'Cód. Olimpo',
      selector: row => row.Codigo_Olimpo || '',
      sortable: true,
      wrap: true
    },
    {
      name: 'Peça',
      selector: row => row.Peca || '',
      sortable: true,
      wrap: true
    },
    {
      name: 'Qtd. Peças',
      selector: row => row.Quantidade_Pecas || 0,
      sortable: true,
      right: true
    },
    {
      name: 'Peso Total Peça (kg)',
      selector: row => row.Peso_Total_Peca ? Number(row.Peso_Total_Peca).toLocaleString('pt-BR') : '0',
      sortable: true,
      right: true
    },
    {
      name: 'Embalagem',
      selector: row => row.Embalagem || '-',
      sortable: true,
      wrap: true
    },
    {
      name: 'Peso Embal. (kg)',
      selector: row => row.Peso_Embalagem ? Number(row.Peso_Embalagem).toLocaleString('pt-BR') : '0',
      sortable: true,
      right: true
    },
    {
      name: 'Total Embal. (kg)',
      selector: row => row.Peso_Total_Embalagem ? Number(row.Peso_Total_Embalagem).toLocaleString('pt-BR') : '0',
      sortable: true,
      right: true
    },
    {
      name: 'Peso Total Bruto (kg)',
      selector: row => row.Peso_Total ? Number(row.Peso_Total).toLocaleString('pt-BR') : '0',
      sortable: true,
      right: true,
      style: { fontWeight: 'bold' }
    },
    {
      name: 'Nome da Carga',
      selector: row => row.Nome_Carga || '',
      sortable: true,
      wrap: true,
      minWidth: '250px'
    }
  ];

  const filteredItems = pecas.filter(item => {
    let matchesText = true;
    if (filterText) {
      matchesText = 
        (item.Codigo_Olimpo && item.Codigo_Olimpo.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.Peca && item.Peca.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.Nome_Carga && item.Nome_Carga.toLowerCase().includes(filterText.toLowerCase()));
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
            <Package size={28} className="text-primary" />
            Peças Expedidas
          </h2>
          <p className="text-muted mb-0">Histórico de envio de peças e suas respectivas cargas</p>
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
            <span className="input-group-text bg-light border-end-0"><Search size={18} className="text-muted" /></span>
            <input 
              type="text" 
              className="form-control border-start-0 bg-light" 
              placeholder="Buscar por Peça, Cód. Olimpo ou Carga..."
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
            striped
            progressPending={loading}
            progressComponent={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}
            noDataComponent={<div className="p-5 text-center text-muted">Nenhuma peça encontrada.</div>}
            paginationComponentOptions={{ rowsPerPageText: 'Linhas por página:', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
            customStyles={{
              headRow: { style: { backgroundColor: '#f8f9fa', fontWeight: 'bold', color: '#495057' } },
              headCells: { style: { justifyContent: 'center', textAlign: 'center' } },
              cells: { style: { justifyContent: 'center', textAlign: 'center' } }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PecasExpedidasList;
