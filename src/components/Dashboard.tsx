import React from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CalendarCheck, UserX, UserCheck, RefreshCw, Calendar, X, DollarSign, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { cn } from '../utils/cn';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

type KpiType = 'ingresados' | 'agendados' | 'noAsisten' | 'convierten' | 'montoInvertido' | 'costoCliente' | 'ingresos' | 'roas';

export const Dashboard: React.FC = () => {
  const { filteredData, filteredMetrics, availableMonths, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, availableYears, isLoading, error } = useData();
  const [selectedKpi, setSelectedKpi] = React.useState<KpiType | null>(null);

  const chartData = filteredData.map(c => ({
    ...c,
    roas: c.montoInvertido > 0 ? Number((c.ingresos / c.montoInvertido).toFixed(2)) : 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
        {isLoading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Cargando datos...</span>
          </div>
        )}
      </div>

      {/* Year and Month Tabs */}
      {availableMonths.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 font-medium rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-px">
            <Calendar className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
            {availableMonths.map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  selectedMonth === month
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Leads Ingresados" 
          value={filteredMetrics.totalLeadsIngresados.toString()} 
          icon={<Users className="w-6 h-6 text-blue-500" />} 
          color="bg-blue-50"
          onClick={() => setSelectedKpi('ingresados')}
        />
        <KpiCard 
          title="Leads Agendados" 
          value={filteredMetrics.totalLeadsAgendados.toString()} 
          icon={<CalendarCheck className="w-6 h-6 text-emerald-500" />} 
          color="bg-emerald-50"
          onClick={() => setSelectedKpi('agendados')}
        />
        <KpiCard 
          title="No Asisten" 
          value={filteredMetrics.totalNoAsisten.toString()} 
          icon={<UserX className="w-6 h-6 text-rose-500" />} 
          color="bg-rose-50"
          onClick={() => setSelectedKpi('noAsisten')}
        />
        <KpiCard 
          title="Convierten" 
          value={filteredMetrics.totalConvierten.toString()} 
          icon={<UserCheck className="w-6 h-6 text-indigo-500" />} 
          color="bg-indigo-50"
          onClick={() => setSelectedKpi('convierten')}
        />
        <KpiCard 
          title="Monto Invertido" 
          value={`$${filteredMetrics.totalMontoInvertido.toLocaleString()}`} 
          icon={<DollarSign className="w-6 h-6 text-violet-500" />} 
          color="bg-violet-50"
          onClick={() => setSelectedKpi('montoInvertido')}
        />
        <KpiCard 
          title="Costo por Cliente" 
          value={`$${filteredMetrics.costoPromedioPorCliente.toLocaleString(undefined, {maximumFractionDigits: 2})}`} 
          icon={<TrendingDown className="w-6 h-6 text-cyan-500" />} 
          color="bg-cyan-50"
          onClick={() => setSelectedKpi('costoCliente')}
        />
        <KpiCard 
          title="Ingresos" 
          value={`$${filteredMetrics.totalIngresos.toLocaleString()}`} 
          icon={<TrendingUp className="w-6 h-6 text-green-500" />} 
          color="bg-green-50"
          onClick={() => setSelectedKpi('ingresos')}
        />
        <KpiCard 
          title="ROAS" 
          value={`${filteredMetrics.roas.toFixed(1)}x`} 
          icon={<Target className="w-6 h-6 text-amber-500" />} 
          color="bg-amber-50"
          onClick={() => setSelectedKpi('roas')}
        />
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">ROAS por Campaña ({selectedMonth} {selectedYear})</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="campaign" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => `${value}x`}
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="roas" name="ROAS (Multiplicador)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Detalle por Campaña ({selectedMonth} {selectedYear})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Campaña</th>
                <th className="px-6 py-3 text-right">Ingresados</th>
                <th className="px-6 py-3 text-right">Agendados</th>
                <th className="px-6 py-3 text-right">No Asisten</th>
                <th className="px-6 py-3 text-right">Convierten</th>
                <th className="px-6 py-3 text-right">Monto Inv.</th>
                <th className="px-6 py-3 text-right">Costo x Cliente</th>
                <th className="px-6 py-3 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr key={i} className="bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.campaign}</td>
                  <td className="px-6 py-4 text-right">{row.leadsIngresados}</td>
                  <td className="px-6 py-4 text-right">{row.leadsAgendados}</td>
                  <td className="px-6 py-4 text-right">{row.leadsNoAsisten}</td>
                  <td className="px-6 py-4 text-right">{row.leadsConvierten}</td>
                  <td className="px-6 py-4 text-right">${row.montoInvertido.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">${(row.leadsConvierten > 0 ? row.montoInvertido / row.leadsConvierten : 0).toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                  <td className="px-6 py-4 text-right">${row.ingresos.toLocaleString()}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No hay datos para este mes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle KPI */}
      {selectedKpi && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedKpi === 'ingresados' && 'Detalle: Leads Ingresados'}
                  {selectedKpi === 'agendados' && 'Detalle: Leads Agendados'}
                  {selectedKpi === 'noAsisten' && 'Detalle: No Asisten'}
                  {selectedKpi === 'convierten' && 'Detalle: Convierten a Pacientes'}
                  {selectedKpi === 'montoInvertido' && 'Detalle: Monto Invertido'}
                  {selectedKpi === 'costoCliente' && 'Detalle: Costo por Cliente'}
                  {selectedKpi === 'ingresos' && 'Detalle: Ingresos Totales'}
                  {selectedKpi === 'roas' && 'Detalle: ROAS (Retorno Inversión)'}
                </h3>
                <p className="text-sm text-slate-500">Desglose por campaña - {selectedMonth} {selectedYear}</p>
              </div>
              <button onClick={() => setSelectedKpi(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {filteredData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No hay datos registrados para {selectedMonth}.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredData.map((c, i) => {
                    let valueStr = '';
                    let secondaryStr = '';
                    if (selectedKpi === 'ingresados') {
                      valueStr = `${c.leadsIngresados}`;
                      secondaryStr = 'leads';
                    } else if (selectedKpi === 'agendados') {
                      valueStr = `${c.leadsAgendados}`;
                      secondaryStr = 'leads';
                    } else if (selectedKpi === 'noAsisten') {
                      valueStr = `${c.leadsNoAsisten}`;
                      const pct = c.leadsAgendados > 0 ? ((c.leadsNoAsisten / c.leadsAgendados) * 100).toFixed(1) : '0';
                      secondaryStr = `leads (${pct}%)`;
                    } else if (selectedKpi === 'convierten') {
                      valueStr = `${c.leadsConvierten}`;
                      const pct = c.leadsAgendados > 0 ? ((c.leadsConvierten / c.leadsAgendados) * 100).toFixed(1) : '0';
                      secondaryStr = `pacientes (${pct}%)`;
                    } else if (selectedKpi === 'montoInvertido') {
                      valueStr = `$${c.montoInvertido.toLocaleString()}`;
                      secondaryStr = 'invertidos';
                    } else if (selectedKpi === 'costoCliente') {
                      const costo = c.leadsConvierten > 0 ? c.montoInvertido / c.leadsConvierten : 0;
                      valueStr = `$${costo.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
                      secondaryStr = 'por cliente convertido';
                    } else if (selectedKpi === 'ingresos') {
                      valueStr = `$${c.ingresos.toLocaleString()}`;
                      secondaryStr = 'ingresos generados';
                    } else if (selectedKpi === 'roas') {
                      const cRoas = c.montoInvertido > 0 ? (c.ingresos / c.montoInvertido) : 0;
                      valueStr = `${cRoas.toFixed(1)}x`;
                      secondaryStr = 'retorno s/ inversión';
                    }

                    return (
                      <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
                        <span className="font-medium text-slate-700">{c.campaign}</span>
                        <div className="text-right">
                          <span className="font-bold text-lg text-indigo-600 block leading-none">{valueStr}</span>
                          <span className="text-xs text-slate-500 font-medium">{secondaryStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4",
        onClick && "cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.98]"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className={cn("p-2 rounded-lg", color)}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {onClick && <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-md">Ver detalle</span>}
      </div>
    </div>
  );
};
