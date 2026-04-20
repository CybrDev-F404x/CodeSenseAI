import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auditService, reportService, type Audit, type Report } from '../services/api';
import toast from 'react-hot-toast';

export default function MyAuditsPage() {
  const navigate = useNavigate();
  const [audits, setAudits]   = useState<Audit[]>([]);
  const [reports, setReports] = useState<Map<string, Report>>(new Map());
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch]       = useState('');
  const [filterLang, setFilterLang]     = useState<'all' | 'python' | 'csharp'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'done' | 'failed'>('all');
  const [showFilters, setShowFilters]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [auditList, reportList] = await Promise.all([auditService.list(), reportService.list()]);
        setAudits(auditList);
        const rMap = new Map<string, Report>();
        reportList.forEach(r => rMap.set(r.audit_id, r));
        setReports(rMap);
      } catch { /* interceptor handles */ }
      setLoading(false);
    })();
  }, []);

  const filteredAudits = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Strip the "AUD-" prefix if the user types it so "AUD-38A6..." still matches the raw UUID
    const qClean = q.startsWith('aud-') ? q.slice(4) : q;

    return audits.filter(a => {
      const matchesText = !q
        || a.id.toLowerCase().includes(qClean)           // raw UUID
        || a.language.toLowerCase().includes(q)           // python / csharp
        || a.status.toLowerCase().includes(q)             // done / pending / failed / processing
        || a.code_snippet.toLowerCase().includes(q);      // snippet content

      const matchesLang   = filterLang   === 'all' || a.language === filterLang;
      const matchesStatus = filterStatus === 'all' || a.status   === filterStatus;

      return matchesText && matchesLang && matchesStatus;
    });
  }, [audits, search, filterLang, filterStatus]);


  const activeFilters = [filterLang !== 'all', filterStatus !== 'all'].filter(Boolean).length;

  const clearFilters = () => { setSearch(''); setFilterLang('all'); setFilterStatus('all'); };

  const handleDownloadCSV = () => {
    if (!filteredAudits.length) { toast.error('No hay auditorías para exportar'); return; }
    const headers = ['ID', 'Lenguaje', 'Estado', 'Puntuación', 'Fecha'];
    const rows    = filteredAudits.map(a => {
      const r     = reports.get(a.id);
      const score = r ? `${(r.score * 10).toFixed(0)}/100` : 'Pendiente';
      return [`AUD-${a.id.substring(0, 8).toUpperCase()}`, a.language, a.status, score,
        new Date(a.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })];
    });
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url; a.download = `codesenseai_auditorias_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`${filteredAudits.length} auditorías exportadas a CSV`);
  };

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-themed-primary mb-2">Mis Auditorías</h1>
          <p className="text-themed-muted font-light max-w-lg leading-relaxed">
            Gestiona y supervisa el historial de análisis de código. Identifica patrones críticos y asegura la integridad editorial del software.
          </p>
        </div>
        <button
          onClick={() => navigate('/audits/new')}
          className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-lg"
          style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 20px var(--color-accent-glow)' }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nueva Auditoría
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-themed-muted text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar por ID, lenguaje o contenido..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-panel border border-themed hover:border-themed px-10 py-2.5 rounded-xl text-sm text-themed-primary outline-none transition-all"
            style={{ '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onBlur={e =>  (e.currentTarget.style.borderColor = '')}
          />
        </div>

        {/* Filter toggle */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-panel border px-4 py-2 rounded-xl text-sm flex items-center gap-3 transition-all min-w-[140px] cursor-pointer"
            style={{ borderColor: showFilters ? 'var(--color-accent)' : 'var(--color-border)',
                     color: showFilters ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            <span>Filtros</span>
            {activeFilters > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent)' }}>
                {activeFilters}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-panel border border-themed rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 animate-fade-in space-y-5">
              {/* Language */}
              <div>
                <label className="block text-[10px] font-bold text-themed-muted uppercase tracking-widest mb-3">Lenguaje</label>
                <div className="flex gap-2">
                  {(['all', 'python', 'csharp'] as const).map(v => (
                    <button key={v} onClick={() => setFilterLang(v)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ backgroundColor: filterLang === v ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                               color: filterLang === v ? '#fff' : 'var(--color-text-muted)' }}>
                      {v === 'all' ? 'Todos' : v === 'python' ? 'Python' : 'C#'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-themed-muted uppercase tracking-widest mb-3">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'pending', 'processing', 'done', 'failed'] as const).map(v => (
                    <button key={v} onClick={() => setFilterStatus(v)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ backgroundColor: filterStatus === v ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                               color: filterStatus === v ? '#fff' : 'var(--color-text-muted)' }}>
                      {v === 'all' ? 'Todos' : v}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="w-full text-center text-xs text-themed-accent hover:underline pt-1">
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleDownloadCSV} className="p-2 rounded-lg text-themed-muted hover:bg-accent-subtle hover:text-themed-accent transition-colors" title="Descargar CSV">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>

      {showFilters && <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />}

      {/* Table */}
      <div className="bg-panel border border-themed rounded-[14px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card text-themed-muted text-[10px] uppercase tracking-[0.15em]">
                {['ID Auditoría', 'Proyecto / Lenguaje', 'Fecha', 'Puntuación', 'Estado', ''].map((h, i) => (
                  <th key={i} className={`px-6 py-4 font-medium border-b border-themed ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-themed-muted animate-pulse font-light italic">Recuperando registros del nodo central...</td></tr>
              ) : filteredAudits.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-themed-muted">
                  <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl opacity-30">search_off</span>
                    {search && !activeFilters ? (
                      <>
                        <p className="text-sm font-light">
                          No se encontraron resultados para{' '}
                          <span className="text-themed-primary font-medium">"{search}"</span>
                        </p>
                        <button
                          onClick={() => setSearch('')}
                          className="text-xs text-themed-accent hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          Limpiar búsqueda
                        </button>
                      </>
                    ) : activeFilters > 0 || search ? (
                      <>
                        <p className="text-sm font-light">
                          {search
                            ? <>No se encontraron resultados para <span className="text-themed-primary font-medium">"{search}"</span> con los filtros aplicados.</>
                            : 'No se encontraron auditorías con los filtros aplicados.'}
                        </p>
                        <button onClick={clearFilters} className="text-xs text-themed-accent hover:underline flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">filter_list_off</span>
                          Limpiar todos los filtros
                        </button>
                      </>
                    ) : (
                      <p className="text-sm font-light italic">No se encontraron auditorías registradas.</p>
                    )}
                  </div>
                </td></tr>
              ) : filteredAudits.map(audit => {
                const report = reports.get(audit.id);
                const score  = report ? report.score * 10 : null;
                return (
                  <tr key={audit.id} className="hover:bg-accent-subtle transition-colors group">
                    <td className="px-6 py-5 text-sm font-mono text-themed-accent">#AUD-{audit.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-themed-primary capitalize">{audit.language} Engine</span>
                        <span className="text-[11px] text-themed-muted font-mono opacity-60">main / {audit.id.substring(0, 7)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-themed-primary">
                      {new Date(audit.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      {score !== null ? (
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-themed-primary min-w-[45px]">{score}/100</span>
                          {/* Progress bar — fully themed */}
                          <div className="w-16 h-1 rounded-full overflow-hidden progress-track">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${score}%`,
                                backgroundColor: score >= 70 ? '#108023' : score >= 50 ? '#fcae0a' : '#9a1547',
                              }}
                            />
                          </div>
                        </div>
                      ) : <span className="text-themed-muted text-xs font-light italic">Analizando...</span>}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
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
                    <td className="px-6 py-5 text-right">
                      <Link to={`/audits/${audit.id}`} className="text-themed-muted hover:text-themed-primary transition-colors inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent-subtle">
                        <span className="material-symbols-outlined">more_horiz</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 flex items-center justify-between bg-card border-t border-themed">
          <span className="text-xs text-themed-muted">
            Mostrando <span className="text-themed-primary font-medium">{filteredAudits.length}</span> de <span className="text-themed-primary font-medium">{audits.length}</span> auditorías
          </span>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="text-xs text-themed-accent hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">filter_list_off</span>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-center gap-10 opacity-30 grayscale">
        {[['security', 'Encrypted Node Analysis'], ['verified_user', 'ISO-27001 Certified']].map(([icon, label]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">{icon}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
