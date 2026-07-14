import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, Clock, CheckCircle, XCircle, Printer, CalendarX, Moon } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const GestaoClientesDashboard = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(() => localStorage.getItem('gestao_clienteId') || '');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(() => localStorage.getItem('gestao_startDate') || todayStr);
  const [endDate, setEndDate] = useState(() => localStorage.getItem('gestao_endDate') || todayStr);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('gestao_startDate', startDate);
    localStorage.setItem('gestao_endDate', endDate);
    localStorage.setItem('gestao_clienteId', selectedCliente);
  }, [startDate, endDate, selectedCliente]);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (selectedCliente && startDate && endDate) {
      fetchDashboardData();
    } else {
      setDashboardData(null);
    }
  }, [selectedCliente, startDate, endDate]);

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/gestao-clientes', {
        params: { clienteId: selectedCliente, startDate, endDate }
      });
      setDashboardData(res.data);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const localDateString = typeof dateString === 'string' && dateString.endsWith('Z') 
      ? dateString.slice(0, -1) : dateString;
    return new Date(localDateString).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const tableCustomStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8f9fa',
        minHeight: '40px',
      },
    },
    headCells: {
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        paddingLeft: '6px',
        paddingRight: '6px',
      },
    },
    cells: {
      style: {
        fontSize: '11px',
        paddingLeft: '6px',
        paddingRight: '6px',
      },
    },
    rows: {
      style: {
        minHeight: '40px',
      }
    }
  };

  const columns = [
    {
      name: 'Data',
      selector: row => row.Data ? new Date(row.Data).toLocaleDateString('pt-BR') : '',
      sortable: true,
      width: '100px'
    },
    {
      name: 'Carga',
      selector: row => row.Nome_Carga || '',
      sortable: true,
      wrap: true,
      minWidth: '200px'
    },
    {
      name: 'Chegada',
      selector: row => formatTime(row.Hora_Chegada),
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
      name: 'Classificação',
      selector: row => row.Classificacao || '',
      sortable: true,
      cell: row => {
        let badgeClass = "badge rounded-pill text-white ";
        if (row.Classificacao === 'No Prazo') badgeClass += "bg-success";
        else if (row.Classificacao === 'Atraso Sideral') badgeClass += "bg-danger";
        else if (row.Classificacao === 'Atraso Cliente') badgeClass += "bg-warning text-dark";
        else if (row.Classificacao === 'Em Andamento') badgeClass += "bg-info text-dark";
        else badgeClass += "bg-secondary";
        return <span className={badgeClass}>{row.Classificacao}</span>;
      }
    },
    {
      name: 'Atraso (H)',
      selector: row => row.Minutos_Atraso ? (row.Minutos_Atraso / 60).toFixed(1) : '0.0',
      sortable: true,
      right: true
    }
  ];

  const pieData = dashboardData ? [
    { name: 'No Prazo', value: dashboardData.kpis.No_Prazo, color: '#198754' },
    { name: 'Atraso Cliente/Transp.', value: dashboardData.kpis.Atraso_Cliente, color: '#ffc107' },
    { name: 'Atraso Sideral', value: dashboardData.kpis.Atraso_Sideral, color: '#dc3545' },
    { name: 'Em Andamento', value: dashboardData.kpis.Em_Andamento, color: '#0dcaf0' },
    { name: 'Sem Janela', value: dashboardData.kpis.Sem_Janela, color: '#6c757d' }
  ].filter(item => item.value > 0) : [];

  const percentNoPrazo = dashboardData && dashboardData.kpis.Total_Cargas > 0 
    ? ((dashboardData.kpis.No_Prazo / dashboardData.kpis.Total_Cargas) * 100).toFixed(1) 
    : 0;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Users size={28} className="text-primary" />
            Gestão de Clientes
          </h2>
          <p className="text-muted mb-0">Relatório de eficiência e métricas de entregas por cliente</p>
        </div>
        <button 
          className="btn btn-outline-primary d-flex align-items-center gap-2" 
          onClick={() => window.print()}
          disabled={!dashboardData}
        >
          <Printer size={18} />
          Imprimir Relatório
        </button>
      </div>

      <div className="card shadow-sm border-0 mb-4 no-print">
        <div className="card-body py-3 d-flex flex-wrap gap-3 align-items-end">
          <div style={{ minWidth: '250px', flex: 1 }}>
            <label className="form-label text-muted fw-bold mb-1">Selecione o Cliente</label>
            <select 
              className="form-select"
              value={selectedCliente}
              onChange={e => setSelectedCliente(e.target.value)}
            >
              <option value="">-- Escolha um Cliente --</option>
              {clientes.map(c => (
                <option key={c.ID_Cliente} value={c.ID_Cliente}>{c.Razao_Social}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label text-muted fw-bold mb-1">Data Inicial</label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label text-muted fw-bold mb-1">Data Final</label>
            <input 
              type="date" 
              className="form-control" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!selectedCliente && (
        <div className="text-center p-5 text-muted printable-area">
          <Search size={48} className="mb-3 opacity-50" />
          <h4>Nenhum cliente selecionado</h4>
          <p>Selecione um cliente no filtro acima para visualizar o relatório de gestão.</p>
        </div>
      )}

      {loading && selectedCliente && (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Carregando métricas...</p>
        </div>
      )}

      {dashboardData && !loading && (
        <div className="printable-area">
          <div className="d-none d-print-block text-center mb-4">
            <h2 className="fw-bold text-dark">Relatório de Gestão: {clientes.find(c => c.ID_Cliente == selectedCliente)?.Razao_Social}</h2>
            <p className="text-muted">Período: {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100 bg-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-semibold">Total de Cargas</span>
                    <Search size={20} className="text-primary" />
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">{dashboardData.kpis.Total_Cargas}</h3>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100 bg-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-semibold">No Prazo (%)</span>
                    <CheckCircle size={20} className="text-success" />
                  </div>
                  <h3 className="fw-bold mb-0 text-success">{percentNoPrazo}%</h3>
                  <small className="text-muted">{dashboardData.kpis.No_Prazo} entregas perfeitas</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100 bg-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-semibold">Cargas Atrasadas</span>
                    <XCircle size={20} className="text-danger" />
                  </div>
                  <h3 className="fw-bold mb-0 text-danger">{dashboardData.kpis.Atraso_Sideral + dashboardData.kpis.Atraso_Cliente}</h3>
                  <small className="text-muted">Desvios de SLA</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100 bg-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-semibold">Horas de Atraso</span>
                    <Clock size={20} className="text-warning" />
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">{(dashboardData.kpis.Minutos_Atraso_Total / 60).toFixed(1)} h</h3>
                  <small className="text-muted">Soma global de retenção</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100 bg-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-semibold">Fora de Janela</span>
                    <CalendarX size={20} className="text-info" />
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">{dashboardData.kpis.Qtd_Fora_Janela || 0}</h3>
                  <small className="text-muted">Chegadas divergentes da previsão</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100 bg-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-semibold">Fora do Expediente</span>
                    <Moon size={20} className="text-secondary" />
                  </div>
                  <h3 className="fw-bold mb-0 text-dark">{dashboardData.kpis.Qtd_Fora_Expediente || 0}</h3>
                  <small className="text-muted">Fora do horário comercial</small>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-12">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="mb-0 fw-bold text-dark">Distribuição de Responsabilidades (Cargas)</h6>
                </div>
                <div className="card-body d-flex justify-content-center align-items-center" style={{ height: '350px' }}>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted">Nenhum dado para exibir neste período.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="mb-0 fw-bold text-dark">Detalhamento das Cargas</h6>
            </div>
            <div className="card-body p-0">
              <DataTable
                columns={columns}
                data={dashboardData.cargas}
                pagination
                highlightOnHover
                striped
                noDataComponent={<div className="p-5 text-center text-muted">Nenhuma carga encontrada.</div>}
                customStyles={tableCustomStyles}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoClientesDashboard;
