import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auditService, reportService, type Audit, type Report } from '../services/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits]     = useState<Audit[]>([]);
  const [reports, setReports]   = useState<Report[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [auditList, reportList] = await Promise.all([auditService.list(), reportService.list()]);
      setAudits(auditList);
      setReports(reportList);
    } catch {
      toast.error('Error al sincronizar con el nodo central');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Metrics ────────────────────────────────────────────────
  const totalAudits   = audits.length;
  const pendingAudits = audits.filter(a => a.status === 'pending' || a.status === 'processing').length;
  const avgScore      = reports.length
    ? (reports.reduce((s, r) => s + r.score, 0) / reports.length).toFixed(1)
    : '0.0';
  const totalReports = reports.length;

  // ── Weekly activity ────────────────────────────────────────
  const getWeeklyActivity = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const now  = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      return {
        label: days[d.getDay()],
        value: audits.filter(a => { const dt = new Date(a.created_at); return dt >= d && dt < next; }).length,
      };
    });
  };

  const activityData  = getWeeklyActivity();
  const hasRealData   = activityData.some(d => d.value > 0);
  const maxActivity   = Math.max(...activityData.map(d => d.value), 1);

  const recentAudits = [...audits]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats = [
    { icon: 'data_exploration', label: 'Total Auditorías', value: totalAudits },
    { icon: 'pending_actions',  label: 'Pendientes',       value: pendingAudits, warning: true },
    { icon: 'verified',         label: 'Score Promedio',   value: avgScore },
    { icon: 'description',      label: 'Reportes',         value: totalReports },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in space-y-10 pb-20">
        <div className="flex justify-between items-end">
          <div>
            <div className="h-8 w-64 bg-panel rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-panel rounded-lg animate-pulse mt-3" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-10 bg-panel rounded-xl animate-pulse" />
            <div className="h-10 w-36 bg-panel rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-panel border border-themed rounded-[20px] p-6 min-h-[150px] animate-pulse">
              <div className="h-3 w-24 bg-card rounded mb-6" />
              <div className="h-10 w-16 bg-card rounded mt-4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-panel border border-themed rounded-[24px] p-8">
            <div className="h-5 w-48 bg-card rounded mb-10 animate-pulse" />
            <div className="h-[260px] flex items-end justify-between gap-4 px-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <div className="w-full max-w-[40px] bg-card rounded-t-xl animate-pulse" style={{ height: `${30 + Math.random() * 50}%` }} />
                  <div className="h-3 w-6 bg-card rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 bg-panel border border-themed rounded-[24px] p-8 animate-pulse">
            <div className="h-4 w-32 bg-card rounded mb-8" />
            <div className="h-20 bg-card rounded mt-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-themed-primary">Resumen de Auditoría</h2>
          <p className="text-themed-muted font-light mt-1 italic">
            Bienvenido, Curador {user?.full_name || user?.email?.split('@')[0]}.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-themed text-themed-muted hover:text-themed-accent hover:bg-accent-subtle transition-all flex items-center justify-center disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-xl ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          <button
            onClick={() => navigate('/audits/new')}
            className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all text-white"
            style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 20px var(--color-accent-glow)' }}
          >
            Nueva Auditoría
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-panel border border-themed rounded-[20px] p-6 flex flex-col justify-between min-h-[150px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-bl-[40px] group-hover:bg-accent-subtle transition-colors" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-themed-muted text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
              <span
                className="material-symbols-outlined opacity-40"
                style={{ color: s.warning ? 'var(--color-warning)' : 'var(--color-accent)' }}
              >
                {s.icon}
              </span>
            </div>
            <div className="mt-4 relative z-10">
              <h3 className="text-4xl font-light text-themed-primary font-mono tracking-tighter">{s.value}</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full h-1 rounded-full overflow-hidden progress-track">
                  <div className="h-full progress-fill" style={{ width: '70%' }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bar chart */}
        <div className="lg:col-span-8 bg-panel border border-themed rounded-[24px] p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-lg font-medium text-themed-primary tracking-tight">Actividad en Tiempo Real</h4>
              <p className="text-sm text-themed-muted">Auditorías procesadas en los últimos 7 días</p>
            </div>
            <div className="flex items-center gap-3">
              {!hasRealData && (
                <span className="px-2.5 py-1 rounded-lg badge-accent text-[10px] font-bold uppercase tracking-widest"
                      style={{ backgroundColor: 'rgba(252,174,10,0.10)', borderColor: 'rgba(252,174,10,0.20)', color: '#fcae0a', border: '1px solid' }}>
                  Demo
                </span>
              )}
              <div className="px-3 py-1.5 rounded-lg bg-card border border-themed text-[10px] font-bold text-themed-accent uppercase tracking-widest">
                Live Feed
              </div>
            </div>
          </div>

          {/* Bars — use CSS var for color so they respond to theme */}
          <div className="h-[260px] w-full flex items-end justify-between gap-4 px-4">
            {activityData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                <div className="relative w-full flex flex-col items-end justify-end h-[200px]">
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold py-1 px-2 rounded-md mb-2 pointer-events-none whitespace-nowrap z-20 chart-tooltip">
                    {d.value} auditorías
                  </div>
                  {/* Bar — uses .bar-accent class which reads CSS vars */}
                  <div
                    className="w-full max-w-[32px] mx-auto bar-accent rounded-t-lg transition-all duration-700"
                    style={{ height: `${Math.max((d.value / maxActivity) * 100, 5)}%` }}
                  />
                </div>
                <span className="text-[10px] text-themed-muted uppercase font-mono font-bold">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insight card */}
        <div className="lg:col-span-4 bg-panel border border-themed rounded-[24px] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl glow-accent-orb group-hover:scale-110 transition-transform duration-700" />
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-themed-accent" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <h4 className="text-themed-primary font-medium uppercase tracking-widest text-xs">Curator Insight</h4>
            </div>
            {totalAudits === 0 ? (
              <p className="text-sm text-themed-muted leading-relaxed font-light italic">
                Inicia tu primera auditoría para permitir que la IA perfile tu arquitectura.
              </p>
            ) : (
              <p className="text-sm text-themed-muted leading-relaxed font-light italic">
                Has mantenido un flujo de <strong className="text-themed-primary">{totalAudits}</strong> auditorías.
                El sistema registra un score promedio de <strong className="text-themed-accent">{avgScore}/10</strong> en la seguridad de tus módulos.
              </p>
            )}
          </div>
          <div className="mt-8 pt-8 border-t border-themed space-y-4">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-themed-muted">
              <span>Salud Estructural</span>
              <span className="text-themed-accent">{avgScore}/10</span>
            </div>
            {/* Progress bar — fully themed */}
            <div className="h-1 rounded-full overflow-hidden progress-track">
              <div className="h-full progress-fill" style={{ width: `${Number(avgScore) * 10}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent audits table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-xl font-light text-themed-primary tracking-tight">Actividad Reciente</h4>
          <Link to="/audits" className="text-themed-accent text-xs font-bold uppercase tracking-widest hover:underline underline-offset-8">
            Ver Archivo Completo
          </Link>
        </div>

        <div className="bg-panel border border-themed rounded-[24px] overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card text-themed-muted text-[10px] uppercase tracking-[0.2em]">
                <th className="px-8 py-5 font-bold">Identificador</th>
                <th className="px-8 py-5 font-bold">Entorno</th>
                <th className="px-8 py-5 font-bold">Estado del Nodo</th>
                <th className="px-8 py-5 font-bold">Registro</th>
                <th className="px-8 py-5 font-bold text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentAudits.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-themed-muted font-light italic">No se han registrado auditorías recientes en este nodo.</td></tr>
              ) : recentAudits.map((audit) => (
                <tr
                  key={audit.id}
                  className="hover:bg-accent-subtle transition-colors group cursor-pointer border-b border-themed last:border-0"
                  onClick={() => navigate(`/audits/${audit.id}`)}
                >
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs text-themed-accent font-bold tracking-wider">
                      AUD-{audit.id.substring(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[9px] bg-accent-subtle text-themed-accent">
                        {audit.language === 'python' ? 'PY' : 'CS'}
                      </div>
                      <span className="text-themed-primary font-light capitalize">{audit.language} Engine</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      audit.status === 'done'   ? 'bg-[#108023]/10 text-[#108023] border-[#108023]/20' :
                      audit.status === 'failed' ? 'bg-[#9a1547]/10 text-[#9a1547] border-[#9a1547]/20' :
                                                  'bg-[#fcae0a]/10 text-[#fcae0a] border-[#fcae0a]/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${
                        audit.status === 'done'   ? 'bg-[#108023]' :
                        audit.status === 'failed' ? 'bg-[#9a1547]' : 'bg-[#fcae0a] animate-pulse'
                      }`} />
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-themed-muted font-mono text-xs font-medium">
                    {new Date(audit.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="material-symbols-outlined text-themed-muted group-hover:text-themed-accent transition-all transform group-hover:translate-x-1">arrow_forward_ios</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
