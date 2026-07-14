import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Clock, Database, Printer } from 'lucide-react';
import DataTable from 'react-data-table-component';

const RelatorioTemposList = () => {
  const [cargas, setCargas] = useState([]);
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

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    // Remove the 'Z' (UTC indicator) se presente para evitar a conversão de -3h
    const localDateString = typeof dateString === 'string' && dateString.endsWith('Z') 
      ? dateString.slice(0, -1) 
      : dateString;
      
    return new Date(localDateString).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const columns = [
    {
      name: 'Data',
      selector: row => row.Data ? new Date(row.Data).toLocaleDateString('pt-BR') : '',
      sortable: true,
      wrap: true,
      minWidth: '120px'
    },
    {
      name: 'Carga',
      selector: row => row.Nome_Carga || '',
      sortable: true,
      wrap: true,
      minWidth: '200px'
    },
    {
      name: 'Prev. Chegada',
      selector: row => formatTime(row.Hora_Prevista_Chegada),
      sortable: true,
      wrap: true
    },
    {
      name: 'Chegada',
      selector: row => formatTime(row.Hora_Chegada),
      sortable: true,
      wrap: true
    },
    {
      name: 'Prev. Saída',
      selector: row => formatTime(row.Hora_Prevista_Saida),
      sortable: true,
      wrap: true
    },
    {
      name: 'Saída',
      selector: row => formatTime(row.Hora_Saida),
      sortable: true,
      wrap: true
    },
    {
      name: 'Início Carreg.',
      selector: row => formatTime(row.Data_Inicio_Carregamento),
      sortable: true,
      wrap: true
    },
    {
      name: 'Término Carreg.',
      selector: row => formatTime(row.Data_Fim_Carregamento),
      sortable: true,
      wrap: true
    },
    {
      name: 'Lib. Faturamento',
      selector: row => formatTime(row.Data_Liberacao_Faturamento),
      sortable: true,
      wrap: true
    },
    {
      name: 'Faturada',
      selector: row => formatTime(row.Data_Faturada),
      sortable: true,
      wrap: true
    }
  ];

  const filteredItems = cargas.filter(item => {
    let matchesText = true;
    if (filterText) {
      matchesText = (item.Nome_Carga && item.Nome_Carga.toLowerCase().includes(filterText.toLowerCase())) ||
                    (item.Cliente_Nome && item.Cliente_Nome.toLowerCase().includes(filterText.toLowerCase()));
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
            <Clock size={28} className="text-primary" />
            Relatório de Tempos (Gargalos)
          </h2>
          <p className="text-muted mb-0">Tabela consolidada com todos os carimbos de tempo das cargas.</p>
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
              placeholder="Buscar por nome da Carga..."
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
            noDataComponent={<div className="p-5 text-center text-muted">Nenhuma carga encontrada.</div>}
            paginationComponentOptions={{ rowsPerPageText: 'Linhas por página:', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
            customStyles={{
              headRow: { style: { backgroundColor: '#f8f9fa', fontWeight: 'bold', color: '#495057' } },
              headCells: { style: { justifyContent: 'center', textAlign: 'center', fontSize: '0.8rem' } },
              cells: { style: { justifyContent: 'center', textAlign: 'center', fontSize: '0.8rem' } }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RelatorioTemposList;
