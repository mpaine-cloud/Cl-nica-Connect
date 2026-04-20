import React, { useState } from 'react';
import { useData, handleFirestoreError } from '../context/DataContext';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { CampaignData } from '../types';

export const CampaignForm: React.FC = () => {
  const { availableMonths, data, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, availableYears } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [mes, setMes] = useState(selectedMonth);
  const [anio, setAnio] = useState<number>(selectedYear);
  const [campaign, setCampaign] = useState('');
  const [leadsIngresados, setLeadsIngresados] = useState<number | ''>('');
  const [leadsNoAsisten, setLeadsNoAsisten] = useState<number | ''>('');
  const [leadsConvierten, setLeadsConvierten] = useState<number | ''>('');
  const [montoInvertido, setMontoInvertido] = useState<number | ''>('');
  const [ingresos, setIngresos] = useState<number | ''>('');

  const num = (val: string | number) => Number(val) || 0;
  
  const calculatedAgendados = num(leadsNoAsisten) + num(leadsConvierten);
  const calculatedCostoCliente = num(leadsConvierten) > 0 ? num(montoInvertido) / num(leadsConvierten) : 0;

  const resetForm = () => {
    setCampaign('');
    setLeadsIngresados('');
    setLeadsNoAsisten('');
    setLeadsConvierten('');
    setMontoInvertido('');
    setIngresos('');
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (c: CampaignData) => {
    setEditingId(c.id || null);
    setMes(c.mes);
    setAnio(c.anio || new Date().getFullYear());
    setCampaign(c.campaign);
    setLeadsIngresados(c.leadsIngresados);
    setLeadsNoAsisten(c.leadsNoAsisten);
    setLeadsConvierten(c.leadsConvierten);
    setMontoInvertido(c.montoInvertido);
    setIngresos(c.ingresos);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta campaña?')) return;
    
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (err: any) {
      handleFirestoreError(err, 'delete' as any, `campaigns/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setError(null);
    setIsLoading(true);

    const num = (val: string | number) => Number(val) || 0;

    const payload = {
      userId: auth.currentUser.uid,
      mes,
      anio: Number(anio),
      campaign,
      leadsIngresados: num(leadsIngresados),
      leadsAgendados: calculatedAgendados,
      leadsNoAsisten: num(leadsNoAsisten),
      leadsConvierten: num(leadsConvierten),
      montoInvertido: num(montoInvertido),
      montoPorCliente: calculatedCostoCliente,
      ingresos: num(ingresos),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'campaigns', editingId), payload);
      } else {
        await addDoc(collection(db, 'campaigns'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar los datos por el mes y año seleccionado en la vista
  const currentMonthData = data.filter(d => d.mes === selectedMonth && d.anio === selectedYear);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Ingreso de Datos</h2>
        {!isAdding && (
          <button 
            onClick={() => { resetForm(); setMes(selectedMonth); setIsAdding(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nueva Campaña
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? 'Editar Campaña' : 'Añadir Nueva Campaña'}
            </h3>
            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                  <input 
                    type="number" 
                    value={anio} 
                    onChange={(e) => setAnio(Number(e.target.value) || new Date().getFullYear())}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mes</label>
                  <select 
                    value={mes} 
                    onChange={(e) => setMes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    required
                  >
                    {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Campaña</label>
                <input 
                  type="text" 
                  value={campaign} 
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="Ej. Facebook Verano"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leads Ingresados</label>
                <input 
                  type="number" 
                  min="0"
                  value={leadsIngresados} 
                  onChange={(e) => setLeadsIngresados(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leads Agendados (Automático)</label>
                <input 
                  type="number" 
                  value={calculatedAgendados} 
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No Asisten</label>
                <input 
                  type="number" 
                  min="0"
                  value={leadsNoAsisten} 
                  onChange={(e) => setLeadsNoAsisten(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Convierten a Pacientes</label>
                <input 
                  type="number" 
                  min="0"
                  value={leadsConvierten} 
                  onChange={(e) => setLeadsConvierten(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto Invertido ($)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoInvertido} 
                  onChange={(e) => setMontoInvertido(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo por Cliente ($) (Automático)</label>
                <input 
                  type="text" 
                  value={calculatedCostoCliente.toFixed(2)} 
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ingresos ($)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={ingresos} 
                  onChange={(e) => setIngresos(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : (
                  <>
                    <Check className="w-5 h-5" />
                    {editingId ? 'Actualizar' : 'Guardar'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Database View filter */}
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
          {availableMonths.map(month => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedMonth === month
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">Registros en {selectedMonth} {selectedYear}</h3>
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
                <th className="px-6 py-3 text-right">Ingresos</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentMonthData.map((row, i) => (
                <tr key={row.id || i} className="bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.campaign}</td>
                  <td className="px-6 py-4 text-right">{row.leadsIngresados}</td>
                  <td className="px-6 py-4 text-right">{row.leadsAgendados}</td>
                  <td className="px-6 py-4 text-right">{row.leadsNoAsisten}</td>
                  <td className="px-6 py-4 text-right">{row.leadsConvierten}</td>
                  <td className="px-6 py-4 text-right">${row.montoInvertido.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">${row.ingresos.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(row)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => row.id && handleDelete(row.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentMonthData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No hay campañas registradas para este mes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
