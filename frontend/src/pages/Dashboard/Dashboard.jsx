import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { Calendar, Package, Weight, Loader, LayoutDashboard, Clock, CalendarX, Moon } from 'lucide-react';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Período Padrão: Últimos 30 dias
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard?startDate=${startDate}&endDate=${endDate}`);
      
      const fetchedData = response.data;
      if (fetchedData.chartToneladasPorCliente) {
         const sorted = [...fetchedData.chartToneladasPorCliente].sort((a, b) => {
            const valA = parseFloat(a.value) || 0;
            const valB = parseFloat(b.value) || 0;
            return valB - valA;
         });
         
         if (sorted.length > 10) {
            const top10 = sorted.slice(0, 10);
            const othersValue = sorted.slice(10).reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
            if (othersValue > 0) {
               top10.push({ name: 'Outros', value: othersValue });
            }
            fetchedData.chartToneladasPorCliente = top10.sort((a, b) => {
               const valA = parseFloat(a.value) || 0;
               const valB = parseFloat(b.value) || 0;
               return valB - valA;
            });
         } else {
            fetchedData.chartToneladasPorCliente = sorted;
         }
      }
      
      setData(fetchedData);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="fw-bold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {Number(entry.value).toLocaleString('pt-BR')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <LayoutDashboard size={28} className="text-primary" />
            Dashboard Gerencial
          </h2>
          <p className="text-muted mb-0">Visão geral da produção e expedição</p>
        </div>
        
        <div className="d-flex align-items-center gap-3 bg-white p-2 rounded shadow-sm border">
          <Calendar size={20} className="text-muted" />
          <div className="d-flex align-items-center gap-2">
            <input 
              type="date" 
              className="form-control form-control-sm border-0" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
            <span className="text-muted">até</span>
            <input 
              type="date" 
              className="form-control form-control-sm border-0" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="row mb-4 g-3">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-primary text-white h-100 p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                    <Weight size={32} />
                  </div>
                  <div>
                    <p className="text-white-50 mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Peso Total Expedido</p>
                    <h3 className="fw-bold mb-0">{(Number(data.kpis.Peso_Total || 0) / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ton</h3>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-success text-white h-100 p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                    <Package size={32} />
                  </div>
                  <div>
                    <p className="text-white-50 mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Unidades Expedidas</p>
                    <h3 className="fw-bold mb-0">{Number(data.kpis.Pecas_Total || 0).toLocaleString('pt-BR')}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 text-white h-100 p-3" style={{ backgroundColor: '#6f42c1' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-white-50 mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>TMPV Global</p>
                    <h3 className="fw-bold mb-0">{Number(data.kpis.TMPV_Global || 0).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} h</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-info text-white h-100 p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-white-50 mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Média de Carregamento</p>
                    <h3 className="fw-bold mb-0">{Number(data.kpis.Media_Horas_Total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} h</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4 g-3">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 text-white h-100 p-3" style={{ backgroundColor: '#fd7e14' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-white-50 mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Média Carreg. Rodotrem</p>
                    <h3 className="fw-bold mb-0">{Number(data.kpis.Media_Horas_Rodotrem || 0).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} h</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 text-white h-100 p-3" style={{ backgroundColor: '#e83e8c' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-white-50 mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Média Carreg. Carreta LS</p>
                    <h3 className="fw-bold mb-0">{Number(data.kpis.Media_Horas_Carreta_LS || 0).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} h</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-danger text-white h-100 p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-white-50 mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Média Carreta Vanderleia</p>
                    <h3 className="fw-bold mb-0">{Number(data.kpis.Media_Horas_Carreta_Vanderleia || 0).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} h</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-secondary text-white h-100 p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-white-50 mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Média Truck/Outros</p>
                    <h3 className="fw-bold mb-0">{Number(data.kpis.Media_Horas_Outros || 0).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} h</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4 g-3">
            <div className="col-md-6">
              <div className="card shadow-sm border-0 text-dark h-100 p-3" style={{ backgroundColor: '#e0f2fe' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white p-3 rounded-circle shadow-sm">
                    <CalendarX size={32} className="text-info" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Fora de Janela</p>
                    <h3 className="fw-bold mb-0">{data.kpis.Qtd_Fora_Janela || 0} cargas</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0 text-dark h-100 p-3" style={{ backgroundColor: '#f1f5f9' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white p-3 rounded-circle shadow-sm">
                    <Moon size={32} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 fw-semibold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Fora do Expediente</p>
                    <h3 className="fw-bold mb-0">{data.kpis.Qtd_Fora_Expediente || 0} cargas</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="row g-4 mb-4">
            {/* Gráfico de Pizza: Toneladas por Cliente */}
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-0 pt-4 pb-0">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <PieChart size={18} className="text-primary"/> 
                    Peso Expedido por Cliente (kg)
                  </h6>
                </div>
                <div className="card-body" style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.chartToneladasPorCliente}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {data.chartToneladasPorCliente.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                         verticalAlign="bottom" 
                         wrapperStyle={{ fontSize: '11px', paddingTop: '5px', lineHeight: '1.2', margin: 0 }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Gráfico de Barras: Tempo de Carregamento por Veículo */}
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-0 pt-4 pb-0">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <Clock size={18} className="text-warning"/> 
                    Tempo Médio de Carregamento (Minutos) por Veículo
                  </h6>
                </div>
                <div className="card-body" style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.chartTempoCarregamento}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.5}/>
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8f9fa'}}/>
                      <Bar dataKey="avg_minutos" name="Média (Minutos)" fill="#FFBB28" radius={[0, 4, 4, 0]}>
                        {data.chartTempoCarregamento.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico Misto: Evolução Diária */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <Loader size={18} className="text-success"/> 
                    Evolução Diária de Expedição
                  </h6>
                  <small className="text-muted">Barras = Peso, Linha = Unidades</small>
                </div>
                <div className="card-body" style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data.chartEvolucaoDiaria}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                      <XAxis dataKey="data" tickFormatter={(val) => new Date(val + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} />
                      
                      {/* Eixo Y para Peso */}
                      <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                      {/* Eixo Y para Unidades */}
                      <YAxis yAxisId="right" orientation="right" stroke="#00C49F" />
                      
                      <Tooltip 
                        labelFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('pt-BR')}
                        content={<CustomTooltip />}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="peso" name="Peso Bruto (kg)" fill="#0088FE" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      <Line yAxisId="right" type="monotone" dataKey="unidades" name="Unidades (Qtd)" stroke="#00C49F" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
};

export default Dashboard;
