import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Calendar, Info, AlertCircle, Clock, CalendarX, Moon } from 'lucide-react';
import DataTable from 'react-data-table-component';

const AtrasosDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [horasAtrasoSideral, setHorasAtrasoSideral] = useState(0);
  const [horasAtrasoCliente, setHorasAtrasoCliente] = useState(0);
  const [qtdSideral, setQtdSideral] = useState(0);
  const [qtdCliente, setQtdCliente] = useState(0);
  const [qtdForaJanela, setQtdForaJanela] = useState(0);
  const [qtdForaExpediente, setQtdForaExpediente] = useState(0);
  const [pieData, setPieData] = useState([]);
  
  const [dateRange, setDateRange] = useState(() => {
    const saved = localStorage.getItem('atrasos_date_range');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      startDate: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    localStorage.setItem('atrasos_date_range', JSON.stringify(dateRange));
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/atrasos', { params: dateRange });
      const rawData = res.data;
      setData(rawData);

      let tSideral = 0;
      let tCliente = 0;
      let foraJanela = 0;
      let foraExpediente = 0;
      const classif = {};

      rawData.forEach(c => {
        if (c.Is_Fora_Janela) foraJanela++;
        if (c.Is_Fora_Expediente) foraExpediente++;
        
        classif[c.Classificacao] = (classif[c.Classificacao] || 0) + 1;

        if (c.Hora_Saida && c.Hora_Prevista_Saida) {
          const diff = (new Date(c.Hora_Saida) - new Date(c.Hora_Prevista_Saida)) / (1000 * 60 * 60);
          if (diff > 0) {
            if (c.Classificacao === 'Atraso Sideral') tSideral += diff;
            if (c.Classificacao === 'Atraso Cliente') tCliente += diff;
          }
        }
      });

      setHorasAtrasoSideral(tSideral);
      setHorasAtrasoCliente(tCliente);
      setQtdSideral(classif['Atraso Sideral'] || 0);
      setQtdCliente(classif['Atraso Cliente'] || 0);
      setQtdForaJanela(foraJanela);
      setQtdForaExpediente(foraExpediente);
      setPieData(Object.keys(classif).map(key => ({ name: key, value: classif[key] })));

    } catch (error) {
      toast.error('Erro ao buscar dados de atrasos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatHoursToHHMM = (decimalHours) => {
    if (isNaN(decimalHours) || decimalHours <= 0) return '00:00';
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const localDateString = typeof dateStr === 'string' && dateStr.endsWith('Z') 
      ? dateStr.slice(0, -1) 
      : dateStr;
    return new Date(localDateString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const respCounts = data.reduce((acc, curr) => {
    if (curr.Responsabilidade_Atraso_Nome) {
      acc[curr.Responsabilidade_Atraso_Nome] = (acc[curr.Responsabilidade_Atraso_Nome] || 0) + 1;
    }
    return acc;
  }, {});

  const pieRespData = Object.keys(respCounts).map(key => ({
    name: key,
    value: respCounts[key],
    fill: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
  }));

  const motivoCounts = data.reduce((acc, curr) => {
    if (curr.Motivo_Atraso_Nome) {
      acc[curr.Motivo_Atraso_Nome] = (acc[curr.Motivo_Atraso_Nome] || 0) + 1;
    }
    return acc;
  }, {});

  const pieMotivoData = Object.keys(motivoCounts).map(key => ({
    name: key,
    value: motivoCounts[key],
    fill: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
  }));

  const COLORS = {
    'No Prazo': '#22c55e',
    'Atraso Cliente': '#eab308',
    'Atraso Sideral': '#ef4444',
    'Sem Janela': '#9ca3af'
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{fontSize: '12px', fontWeight: 'bold'}}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const sideralDelays = data.filter(d => d.Classificacao === 'Atraso Sideral');
  
  const avgSideralTimes = sideralDelays.length > 0 ? [
    { name: 'Liberação (Líder)', minutos: Math.round(sideralDelays.reduce((sum, d) => sum + (d.Tempo_Espera_Liberacao || 0), 0) / sideralDelays.length) },
    { name: 'Descida (Porteiro)', minutos: Math.round(sideralDelays.reduce((sum, d) => sum + (d.Tempo_Espera_Descida || 0), 0) / sideralDelays.length) },
    { name: 'Fila Pátio', minutos: Math.round(sideralDelays.reduce((sum, d) => sum + (d.Tempo_Espera_Carregamento || 0), 0) / sideralDelays.length) },
    { name: 'Carregamento', minutos: Math.round(sideralDelays.reduce((sum, d) => sum + (d.Tempo_Carregamento || 0), 0) / sideralDelays.length) },
    { name: 'Faturamento', minutos: Math.round(sideralDelays.reduce((sum, d) => sum + (d.Tempo_Espera_Faturamento || 0), 0) / sideralDelays.length) },
    { name: 'Retenção Saída', minutos: Math.round(sideralDelays.reduce((sum, d) => sum + (d.Tempo_Retencao_Saida || 0), 0) / sideralDelays.length) }
  ] : [];

  const clientDelays = data.reduce((acc, curr) => {
    if (curr.Classificacao === 'Atraso Sideral' || curr.Classificacao === 'Atraso Cliente') {
      const client = curr.Cliente_Nome || 'Desconhecido';
      if (!acc[client]) acc[client] = { name: client, 'Atraso Sideral': 0, 'Atraso Cliente': 0 };
      acc[client][curr.Classificacao] += 1;
    }
    return acc;
  }, {});
  
  const chartClientDelays = Object.values(clientDelays)
    .sort((a, b) => (b['Atraso Sideral'] + b['Atraso Cliente']) - (a['Atraso Sideral'] + a['Atraso Cliente']))
    .slice(0, 10);

  const delaysByDay = data.reduce((acc, curr) => {
    if (curr.Classificacao === 'Atraso Sideral' || curr.Classificacao === 'Atraso Cliente') {
      const date = curr.Hora_Saida ? curr.Hora_Saida.split('T')[0] : (curr.Data ? curr.Data.split('T')[0] : null);
      if (date) {
        if (!acc[date]) acc[date] = { date, 'Atraso Sideral': 0, 'Atraso Cliente': 0 };
        acc[date][curr.Classificacao] += 1;
      }
    }
    return acc;
  }, {});

  const chartDailyDelays = Object.values(delaysByDay)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(d => ({
      ...d,
      dateStr: d.date.split('-').reverse().slice(0, 2).join('/')
    }));

  const tableCustomStyles = {
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
  };

  const columns = [
    { name: 'Carga', selector: row => row.Nome_Carga, sortable: true, minWidth: '180px', wrap: true },
    { name: 'Cliente', selector: row => row.Cliente_Nome, sortable: true, wrap: true },
    { 
      name: 'Classif.', 
      selector: row => row.Classificacao, 
      sortable: true,
      cell: row => (
        <span className={`badge ${
          row.Classificacao === 'No Prazo' ? 'bg-success' : 
          row.Classificacao === 'Atraso Cliente' ? 'bg-warning text-dark' : 
          row.Classificacao === 'Atraso Sideral' ? 'bg-danger' : 'bg-secondary'
        }`}>
          {row.Classificacao}
        </span>
      )
    },
    { name: 'Veículo', selector: row => row.Veiculo || '-', sortable: true, width: '100px' },
    { name: 'Liberador', selector: row => row.Quem_Liberou_Veiculo || '-', sortable: true },
    { name: 'Resp.', selector: row => row.Responsabilidade_Atraso_Nome || '-', sortable: true },
    { name: 'Motivo', selector: row => row.Motivo_Atraso_Nome || '-', sortable: true, wrap: true },
    { 
      name: 'Prev. Chegada', 
      selector: row => row.Hora_Prevista_Chegada,
      sortable: true,
      format: row => formatDateTime(row.Hora_Prevista_Chegada)
    },
    { 
      name: 'Chegada', 
      selector: row => row.Hora_Chegada,
      sortable: true,
      format: row => formatDateTime(row.Hora_Chegada)
    },
    { 
      name: 'Prev. Saída', 
      selector: row => row.Hora_Prevista_Saida,
      sortable: true,
      format: row => formatDateTime(row.Hora_Prevista_Saida)
    },
    { 
      name: 'Saída', 
      selector: row => row.Hora_Saida,
      sortable: true,
      format: row => formatDateTime(row.Hora_Saida)
    }
  ];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-dark fw-bold">Gestão de Atrasos</h2>
          <p className="text-muted mb-0">Análise de responsabilidade e gargalos de tempo.</p>
        </div>
        
        <div className="d-flex gap-3 align-items-center bg-white p-3 rounded shadow-sm border">
          <Calendar className="text-primary" />
          <div className="d-flex gap-2 align-items-center">
            <input 
              type="date" 
              className="form-control form-control-sm" 
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
            <span className="text-muted">até</span>
            <input 
              type="date" 
              className="form-control form-control-sm" 
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
            <button className="btn btn-primary btn-sm px-3 fw-bold" onClick={fetchData}>
              Filtrar
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="card-body py-2">
              <p className="text-muted mb-0 text-uppercase fw-bold" style={{fontSize: '0.70rem'}}>Total Horas</p>
              <h6 className="mb-0 text-dark fw-bold" style={{fontSize: '0.9rem'}}>Atraso Sideral</h6>
              <h2 className="fs-3 fw-bold text-danger mt-0 mb-0">{formatHoursToHHMM(horasAtrasoSideral)}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="card-body py-2">
              <p className="text-muted mb-0 text-uppercase fw-bold" style={{fontSize: '0.70rem'}}>Total Horas</p>
              <h6 className="mb-0 text-dark fw-bold" style={{fontSize: '0.9rem'}}>Atraso Cliente</h6>
              <h2 className="fs-3 fw-bold text-warning mt-0 mb-0">{formatHoursToHHMM(horasAtrasoCliente)}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="card-body py-2">
              <p className="text-muted mb-0 text-uppercase fw-bold" style={{fontSize: '0.70rem'}}>Ocorrências</p>
              <h6 className="mb-0 text-dark fw-bold" style={{fontSize: '0.9rem'}}>Atraso Sideral</h6>
              <h2 className="fs-3 fw-bold text-danger mt-0 mb-0">{qtdSideral}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="card-body py-2">
              <p className="text-muted mb-0 text-uppercase fw-bold" style={{fontSize: '0.70rem'}}>Ocorrências</p>
              <h6 className="mb-0 text-dark fw-bold" style={{fontSize: '0.9rem'}}>Atraso Cliente</h6>
              <h2 className="fs-3 fw-bold text-warning mt-0 mb-0">{qtdCliente}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-4 border-info h-100">
            <div className="card-body py-2">
              <p className="text-muted mb-0 text-uppercase fw-bold" style={{fontSize: '0.70rem'}}>Ocorrências</p>
              <h6 className="mb-0 text-dark fw-bold" style={{fontSize: '0.9rem'}}>Fora da Janela</h6>
              <h2 className="fs-3 fw-bold text-info mt-0 mb-0">{qtdForaJanela}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-4 border-secondary h-100">
            <div className="card-body py-2">
              <p className="text-muted mb-0 text-uppercase fw-bold" style={{fontSize: '0.70rem'}}>Ocorrências</p>
              <h6 className="mb-0 text-dark fw-bold" style={{fontSize: '0.9rem'}}>Fora Expediente</h6>
              <h2 className="fs-3 fw-bold text-secondary mt-0 mb-0">{qtdForaExpediente}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold text-dark mb-4">Visão Global de Responsabilidades</h5>
              <div style={{ height: 300 }}>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                    Nenhum dado no período
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart: Responsabilidades (Limites) */}
        <div className="col-12 col-xl-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold text-dark mb-4">Responsabilidades (Excedentes)</h5>
              <div style={{ height: 300 }}>
                {pieRespData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieRespData}
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {pieRespData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                    Sem registros
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart: Motivos */}
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold text-dark mb-4">Motivos (Excedentes)</h5>
              <div style={{ height: 300 }}>
                {pieMotivoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieMotivoData}
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {pieMotivoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                    Sem registros
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">

        {/* Bar Chart: Onde a Sideral gargala? */}
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                Média de Tempos Internos (Atrasos Sideral)
                <span 
                  title="Detalhes de cada etapa:&#10;• Liberação: Caminhão chegou na portaria até o Líder autorizar a entrada.&#10;• Descida: Líder autorizou até o Porteiro confirmar a descida.&#10;• Fila Pátio: Caminhão desceu até o Operador iniciar o carregamento.&#10;• Carregamento: Operador iniciou até finalizar o carregamento.&#10;• Faturamento: Operador finalizou até o Líder/Qualidade liberar para faturar.&#10;• Retenção Saída: Liberação para faturar até o caminhão cruzar a portaria de saída."
                  style={{ cursor: 'help' }}
                >
                  <Info size={18} className="text-secondary" />
                </span>
              </h5>
              <p className="text-muted small mb-4">Média em minutos de cada etapa para as cargas em Atraso Sideral.</p>
              <div style={{ height: 300 }}>
                {avgSideralTimes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={avgSideralTimes} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" unit=" min" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <RechartsTooltip cursor={{fill: '#f8f9fa'}} />
                      <Bar dataKey="minutos" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                    Sem atrasos Sideral no período
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Atrasos por Dia */}
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold text-dark mb-1">Ocorrências por Dia</h5>
              <p className="text-muted small mb-4">Evolução diária de atrasos Cliente vs Sideral.</p>
              <div style={{ height: 300 }}>
                {chartDailyDelays.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDailyDelays} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="dateStr" tick={{fontSize: 12}} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip cursor={{fill: '#f8f9fa'}} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="Atraso Sideral" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Atraso Cliente" fill="#eab308" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                    Nenhum atraso registrado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Bar Chart: Atrasos por Cliente */}
        <div className="col-12">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold text-dark mb-1">Atrasos por Cliente (Top 10)</h5>
              <p className="text-muted small mb-4">Comparativo de atrasos de responsabilidade da Sideral vs Cliente.</p>
              <div style={{ height: 350 }}>
                {chartClientDelays.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartClientDelays} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 12}} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip cursor={{fill: '#f8f9fa'}} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="Atraso Sideral" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={40} />
                      <Bar dataKey="Atraso Cliente" stackId="a" fill="#eab308" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                    Nenhum atraso registrado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="p-4 border-bottom">
            <h5 className="card-title fw-bold text-dark mb-0">Detalhamento de Cargas</h5>
          </div>
          <DataTable
            columns={columns}
            data={data}
            pagination
            progressPending={loading}
            customStyles={tableCustomStyles}
            highlightOnHover
            noDataComponent={<div className="p-4 text-muted">Nenhum dado encontrado para este período.</div>}
          />
        </div>
      </div>
    </div>
  );
};

export default AtrasosDashboard;
