import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService, type Report } from '../services/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports]           = useState<Report[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    reportService.list()
      .then(setReports)
      .catch(() => toast.error('Error al sincronizar con el nodo de reportes'))
      .finally(() => setLoading(false));
  }, []);

  // ── Metrics ──────────────────────────────────────────────────────
  const totalScore  = reports.reduce((s, r) => s + r.score, 0);
  const avgScoreRaw = reports.length ? totalScore / reports.length : 0;
  const avgScore    = avgScoreRaw.toFixed(1);
  const allFindings = reports.flatMap(r => r.findings.issues || []);
  const severityData = {
    critical: allFindings.filter(i => i.severity === 'high').length,
    warning:  allFindings.filter(i => i.severity === 'medium').length,
    success:  allFindings.filter(i => i.severity === 'low').length,
  };
  const findingsByType = allFindings.reduce((acc: Record<string, number>, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1; return acc;
  }, {});
  const topIssues = Object.entries(findingsByType)
    .map(([type, count]) => ({
      type, count,
      severity: allFindings.find(f => f.type === type)?.severity ?? 'low',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const categoryFindings = selectedCategory ? allFindings.filter(f => f.type === selectedCategory) : [];

  const handleExportJSON = () => {
    if (!reports.length) { toast.error('No hay datos para exportar'); return; }
    const data = { exported_at: new Date().toISOString(),
      summary: { total_reports: reports.length, average_score: avgScoreRaw, total_findings: allFindings.length, severity_distribution: severityData },
      reports: reports.map(r => ({ id: r.id, audit_id: r.audit_id, score: r.score, findings: r.findings, created_at: r.created_at })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `codesenseai_reportes_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`${reports.length} reportes exportados a JSON`);
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-10">
        <div className="max-w-3xl">
          <div className="h-10 w-64 bg-card rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-card rounded-lg animate-pulse mt-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-panel border border-themed rounded-[24px] h-60 animate-pulse" />
          <div className="bg-panel border border-themed rounded-[24px] h-60 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-panel border border-themed rounded-[24px] h-80 animate-pulse" />
          <div className="lg:col-span-7 bg-panel border border-themed rounded-[24px] h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header */}
      <div className="max-w-3xl">
        <h2 className="text-3xl font-light tracking-tight text-themed-primary">Inteligencia Editorial</h2>
        <p className="text-themed-muted font-light mt-1">Análisis panorámico de la salud estructural y seguridad de tu base de código global.</p>
      </div>

      {/* Bento top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Global Score — circular SVG arc themed */}
        <div className="md:col-span-2 bg-panel border border-themed rounded-[24px] p-8 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl glow-accent-orb" />

          {/* Circle — stroke uses CSS var via inline style */}
          <div className="relative w-40 h-40 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" fill="transparent" r="74" stroke="var(--color-surface-high)" strokeWidth="10" />
              <circle
                cx="80" cy="80" fill="transparent" r="74"
                stroke="var(--color-accent)"
                strokeWidth="10"
                strokeDasharray="465"
                strokeDashoffset={465 - 465 * (Number(avgScore) / 10)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-mono font-bold text-themed-primary">{avgScore}</span>
              <span className="text-[10px] uppercase tracking-widest text-themed-muted font-bold">Global Score</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-light text-themed-primary">Estado de Curaduría</h3>
            <p className="text-sm text-themed-muted leading-relaxed font-light italic">
              {Number(avgScore) >= 8
                ? '"Tu base de código analizada mantiene un estándar de calidad superior al promedio de la industria."'
                : Number(avgScore) >= 5
                ? '"El sistema detecta áreas de mejora moderadas. Priorizar la reducción de deuda técnica."'
                : '"Se requiere atención inmediata en la estructura del código. El riesgo de mantenimiento es alto."'}
            </p>
            <div className="flex gap-6 pt-2">
              <div>
                <p className="text-[10px] text-themed-muted uppercase font-bold tracking-widest mb-1">Muestras Analizadas</p>
                <p className="text-xl font-mono text-themed-accent">{reports.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-themed-muted uppercase font-bold tracking-widest mb-1">Total Hallazgos</p>
                <p className="text-xl font-mono text-themed-accent">{allFindings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Severity distribution — status colors are semantic, not themed */}
        <div className="bg-panel border border-themed rounded-[24px] p-8 flex flex-col justify-between shadow-2xl">
          <h4 className="text-[10px] font-bold text-themed-muted uppercase tracking-widest mb-6">Distribución de Riesgo</h4>
          <div className="space-y-6">
            {[
              { label: 'CRÍTICO',    count: severityData.critical, color: '#9a1547', total: allFindings.length },
              { label: 'ADVERTENCIA',count: severityData.warning,  color: '#fcae0a', total: allFindings.length },
              { label: 'LÍMPIO',     count: severityData.success,  color: '#108023', total: allFindings.length },
            ].map(({ label, count, color, total }) => (
              <div key={label} className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span style={{ color }}>{label}</span>
                  </div>
                  <span className="text-themed-primary">{count}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden progress-track">
                  <div className="h-full rounded-full" style={{ width: `${(count / (total || 1)) * 100}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patterns panel */}
        <div className="lg:col-span-5 bg-panel border border-themed rounded-[24px] p-8 shadow-2xl">
          <h4 className="text-[10px] font-bold text-themed-muted uppercase tracking-widest mb-8">Patrones Identificados</h4>
          <div className="space-y-1">
            {topIssues.length === 0 ? (
              <p className="text-sm text-themed-muted italic">No hay patrones detectados aún.</p>
            ) : topIssues.map((issue, i) => {
              const issueColor = issue.severity === 'high' ? '#9a1547' : issue.severity === 'medium' ? '#fcae0a' : '#108023';
              return (
                <button
                  key={issue.type}
                  onClick={() => setSelectedCategory(selectedCategory === issue.type ? null : issue.type)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group text-left border ${
                    selectedCategory === issue.type ? 'border-themed bg-accent-subtle' : 'border-transparent hover:bg-card'
                  }`}
                  style={selectedCategory === issue.type ? { borderColor: 'var(--color-accent)' } : {}}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-themed-muted group-hover:text-themed-accent">0{i + 1}</span>
                    <span className="text-sm text-themed-primary font-light">{issue.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold" style={{ color: issueColor }}>{issue.count}</span>
                    <span className={`material-symbols-outlined text-lg transition-all ${
                      selectedCategory === issue.type ? 'rotate-90 text-themed-accent' : 'text-themed-muted opacity-20 group-hover:opacity-100'
                    }`}>arrow_right_alt</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Category findings detail */}
          {selectedCategory && categoryFindings.length > 0 && (
            <div className="mt-6 pt-6 border-t border-themed space-y-3 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-xs font-bold text-themed-accent uppercase tracking-widest">Hallazgos: {selectedCategory}</h5>
                <button onClick={() => setSelectedCategory(null)} className="text-themed-muted hover:text-themed-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {categoryFindings.map((finding, idx) => (
                  <div key={idx} className="bg-card border border-themed rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        finding.severity === 'high'   ? 'bg-[#9a1547]/10 text-[#9a1547] border-[#9a1547]/20' :
                        finding.severity === 'medium' ? 'bg-[#fcae0a]/10 text-[#fcae0a] border-[#fcae0a]/20' :
                                                        'bg-[#108023]/10 text-[#108023] border-[#108023]/20'
                      }`}>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {finding.severity}
                      </span>
                      {finding.line && <span className="text-[10px] font-mono text-themed-muted">línea {finding.line}</span>}
                    </div>
                    <p className="text-xs text-themed-primary leading-relaxed">{finding.message}</p>
                    {finding.suggestion && (
                      <p className="text-[11px] text-themed-accent/60 italic border-t border-themed pt-2 mt-2">
                        💡 {finding.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Performance metrics */}
        <div className="lg:col-span-7 bg-panel border border-themed rounded-[24px] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-40 h-40 blur-3xl glow-accent-orb" />
          <div className="relative z-10">
            <h4 className="text-[10px] font-bold text-themed-muted uppercase tracking-widest mb-6">Métrica de Rendimiento</h4>
            <h3 className="text-4xl font-mono text-themed-primary mb-4">{avgScore}/10</h3>
            <p className="text-sm text-themed-muted leading-relaxed max-w-sm">
              Basado en {allFindings.length} puntos de datos recolectados a través de {reports.length} auditorías.
              El sistema perfila una tendencia de <span className="text-themed-accent">{Number(avgScore) > 7 ? 'estabilidad' : 'fluctuación'}</span> en la arquitectura.
            </p>
          </div>
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleExportJSON}
              className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border"
              style={{ backgroundColor: 'var(--color-accent-subtle)', borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)', color: 'var(--color-accent)' }}
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar Datos
            </button>
            <button
              onClick={() => navigate('/audits')}
              className="px-5 py-2 rounded-lg bg-card border border-themed text-themed-muted text-xs font-bold uppercase tracking-widest hover:text-themed-primary hover:bg-accent-subtle transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">history</span>
              Ver Historial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
