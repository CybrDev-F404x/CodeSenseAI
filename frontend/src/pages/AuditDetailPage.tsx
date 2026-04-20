import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auditService, reportService, type Audit, type Report } from '../services/api';
import toast from 'react-hot-toast';

// ── Technical debt calculation ─────────────────────────────────────────────
// Hours per severity: high=4h, medium=2h, low=1h.
// If health score is 100, all debt is 0 regardless of any phantom issues.
function calcDebt(report: Report | null, healthScore: number) {
  if (!report || healthScore >= 100) {
    return { critical: 0, warning: 0, minor: 0, total: 0 };
  }
  const issues = report.findings?.issues ?? [];
  const critical = issues.filter(i => i.severity === 'high').length   * 4;
  const warning  = issues.filter(i => i.severity === 'medium').length * 2;
  const minor    = issues.filter(i => i.severity === 'low').length    * 1;
  return { critical, warning, minor, total: critical + warning + minor };
}

export default function AuditDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [audit,       setAudit]       = useState<Audit | null>(null);
  const [report,      setReport]      = useState<Report | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const a = await auditService.get(id);
        setAudit(a);
        try {
          const r = await reportService.getByAudit(id);
          setReport(r);
        } catch {
          if (a.status === 'done') {
            try { setReport(await auditService.analyze(id)); } catch { /* no report yet */ }
          }
        }
      } catch { navigate('/audits'); }
      setLoading(false);
    })();
  }, [id, navigate]);

  // ── Derived values ────────────────────────────────────────────────────────
  const healthScore = useMemo(() => (report ? report.score * 10 : 0), [report]);

  // Circular arc math
  const ARC_R               = 88;
  const strokeDasharray     = +(2 * Math.PI * ARC_R).toFixed(2); // 552.92
  const strokeDashoffset    = strokeDasharray - (strokeDasharray * healthScore) / 100;

  // Arc color — always semantic status colors (not theme accent)
  const arcColor = healthScore >= 70 ? '#108023' : healthScore >= 50 ? '#fcae0a' : '#9a1547';

  // Technical debt
  const debt = useMemo(() => calcDebt(report, healthScore), [report, healthScore]);
  const pct  = (h: number) => `${Math.round((h / Math.max(debt.total, 1)) * 100)}%`;

  // ── Export PDF via native browser print ──────────────────────────────────
  // DashboardLayout already hides Sidebar/TopBar/FAB via print:hidden,
  // and unlocks overflow so the full page is captured.
  const handleExportPDF = () => {
    window.print();
  };

  // ── Re-scan: create a new audit with identical payload ───────────────────
  const handleRescan = async () => {
    if (!audit || isRescanning) return;
    setIsRescanning(true);

    const rescanPromise = auditService.create({
      language:     audit.language as 'python' | 'csharp',
      code_snippet: audit.code_snippet,
    });

    toast.promise(rescanPromise, {
      loading: 'Iniciando re-escaneo...',
      success: 'Auditoría enviada correctamente',
      error:   'Error al iniciar el re-escaneo',
    });

    try {
      const newAudit = await rescanPromise;
      navigate(`/audits/${newAudit.id}`);
    } catch {
      // toast.promise already showed the error toast
      setIsRescanning(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-fade-in">
        <div className="relative">
          <div className="w-12 h-12 border border-themed rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-t-2 rounded-full animate-spin"
               style={{ borderTopColor: 'var(--color-accent)' }} />
        </div>
        <p className="text-themed-muted font-light tracking-widest uppercase text-[10px]">Analizando Estructura...</p>
      </div>
    );
  }

  if (!audit) return null;

  const issueCount = report?.findings?.issues?.length ?? 0;
  const lineCount  = audit.code_snippet.split('\n').length;

  return (
    <div className="animate-fade-in space-y-10 pb-20 print:pb-4">

      {/* ── Actions Bar — hidden when printing ────────────────────── */}
      <div className="flex justify-between items-center print:hidden">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-themed-muted font-light">
          <button onClick={() => navigate('/audits')} className="hover:text-themed-primary transition-colors">
            Auditorías
          </button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-themed-primary">AUD-{audit.id.substring(0, 8).toUpperCase()}</span>
        </div>
        {/* CTA buttons */}
        <div className="flex gap-3">
          {/* Export PDF — outline style, adapts to theme */}
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg border border-themed text-themed-accent text-sm font-medium hover:bg-accent-subtle transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Exportar PDF
          </button>

          {/* Re-scan — primary action, themed accent */}
          <button
            onClick={handleRescan}
            disabled={isRescanning}
            className="px-6 py-2 rounded-lg text-white text-sm font-semibold shadow-lg transition-all hover:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[130px] justify-center"
            style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 16px var(--color-accent-glow)' }}
          >
            {isRescanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Escaneando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
                Re-escanear
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-4xl font-light tracking-tight text-themed-primary mb-4">
          AUD-{audit.id.substring(0, 8).toUpperCase()}
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Language badge */}
          <span className="px-3 py-1 rounded-full bg-accent-subtle text-[11px] font-mono text-themed-accent flex items-center gap-2 border border-themed">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
            {audit.language === 'python' ? 'Python 3.11' : 'C# 11.0'}
          </span>
          {/* Health badge */}
          <span className={`px-3 py-1 rounded-full text-[11px] font-medium border flex items-center gap-2 ${
            healthScore >= 70 ? 'bg-[#108023]/10 text-[#108023] border-[#108023]/20' :
            healthScore >= 50 ? 'bg-[#fcae0a]/10 text-[#fcae0a] border-[#fcae0a]/20' :
                                'bg-[#9a1547]/10 text-[#9a1547] border-[#9a1547]/20'
          }`}>
            <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
              healthScore >= 70 ? 'bg-[#108023]' : healthScore >= 50 ? 'bg-[#fcae0a]' : 'bg-[#9a1547]'
            }`} />
            {healthScore >= 70 ? 'Secure Code' : healthScore >= 50 ? 'Review Needed' : 'Critical Issues Found'}
          </span>
          <span className="text-xs text-themed-muted font-light">
            Procesado · {new Date(audit.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </section>

      {/* ── Bento Grid: Score + Findings ─────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* Health Score circle */}
        <div className="col-span-12 lg:col-span-4 bg-panel border border-themed p-8 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4">
            <span className="material-symbols-outlined text-6xl" style={{ color: 'var(--color-border)' }}>shield_with_heart</span>
          </div>
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96" cy="96" r={ARC_R} fill="transparent"
                stroke="var(--color-surface-high)" strokeWidth="12"
              />
              <circle
                cx="96" cy="96" r={ARC_R} fill="transparent"
                stroke={arcColor} strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold text-themed-primary">{healthScore}</span>
              <span className="text-[10px] uppercase tracking-widest text-themed-muted font-bold">Health Score</span>
            </div>
          </div>
          <p className="text-sm text-center text-themed-muted max-w-[200px] font-light">
            {healthScore >= 100
              ? '¡Perfecto! Tu código no presenta vulnerabilidades detectadas.'
              : healthScore >= 70
              ? 'Tu código cumple con los estándares editoriales.'
              : 'Vulnerabilidades críticas que requieren atención inmediata.'}
          </p>
        </div>

        {/* Findings list */}
        <div className="col-span-12 lg:col-span-8 bg-panel border border-themed p-8 rounded-[14px] shadow-2xl">
          <h3 className="text-lg font-medium text-themed-primary mb-6 flex items-center gap-3">
            Hallazgos Clave
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-card text-themed-muted border border-themed">
              {issueCount} Total
            </span>
          </h3>

          <div className="space-y-6">
            {issueCount === 0 ? (
              /* Zero findings — happy state */
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <span className="material-symbols-outlined text-5xl" style={{ color: '#108023', fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <p className="text-themed-primary font-medium">¡Sin hallazgos!</p>
                <p className="text-sm text-themed-muted font-light text-center max-w-xs">
                  El motor de IA no detectó vulnerabilidades ni problemas de calidad en este fragmento de código.
                </p>
              </div>
            ) : (
              report?.findings?.issues?.map((issue, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className={`mt-1.5 w-2.5 h-2.5 min-w-[10px] rounded-full shadow-[0_0_8px_currentColor] shrink-0 ${
                    issue.severity === 'high'   ? 'bg-[#9a1547]' :
                    issue.severity === 'medium' ? 'bg-[#fcae0a]' : 'bg-[#108023]'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-themed-primary mb-1 group-hover:text-themed-accent transition-colors">
                      {issue.message}
                    </p>
                    <p className="text-sm text-themed-muted leading-relaxed font-light">
                      Detectado en la línea {issue.line}.{' '}
                      Categoría: <span className="text-themed-primary italic">{issue.type}</span>
                    </p>
                    {(issue as { suggestion?: string }).suggestion && (
                      <p className="text-xs text-themed-muted/70 mt-1.5 italic border-l-2 pl-3 leading-relaxed"
                         style={{ borderColor: 'var(--color-accent-subtle)' }}>
                        💡 {(issue as { suggestion?: string }).suggestion}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}

            {!report && (
              <p className="text-themed-muted text-sm font-light italic">Esperando resultados finales de la IA...</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Code Block + Technical Debt ───────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* Code viewer */}
        <div className="col-span-12 xl:col-span-9 rounded-[14px] overflow-hidden border border-themed flex flex-col shadow-2xl"
             style={{ backgroundColor: '#06010F' }}>
          {/* Toolbar */}
          <div className="bg-card px-6 py-3 flex justify-between items-center border-b border-themed">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-themed-muted text-lg">description</span>
              <span className="text-xs font-mono text-themed-muted">
                {audit.language === 'python' ? 'main.py' : 'Program.cs'}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#fcae0a]/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#108023]/20" />
            </div>
          </div>
          {/* Source lines */}
          <div className="p-8 flex-1 overflow-x-auto">
            <pre className="text-themed-muted text-sm leading-relaxed font-mono">
              {audit.code_snippet.split('\n').map((line, i) => {
                const isVulnerable = report?.findings?.issues?.some(f => f.line === i + 1);
                return (
                  <div key={i} className={`flex ${isVulnerable ? 'rounded' : ''}`}
                       style={isVulnerable ? { backgroundColor: 'rgba(154, 21, 71, 0.10)' } : {}}>
                    <span className="w-12 text-right mr-6 opacity-30 select-none">{i + 1}</span>
                    <span style={{ color: isVulnerable ? '#ffb4ab' : 'var(--color-text-primary)' }}>
                      {line || ' '}
                    </span>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* ── Technical Debt panel ─────────────────────────────── */}
        <div className="col-span-12 xl:col-span-3 bg-panel border border-themed p-8 rounded-[14px] flex flex-col shadow-2xl">
          <h3 className="text-sm font-semibold text-themed-primary mb-8 uppercase tracking-widest">
            Deuda Técnica
          </h3>

          {debt.total === 0 ? (
            /* ── Zero debt: celebration state ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
              <span
                className="material-symbols-outlined text-5xl"
                style={{ color: '#108023', fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <p className="text-center text-sm font-medium" style={{ color: '#108023' }}>
                0h Deuda
              </p>
              <p className="text-center text-xs text-themed-muted font-light leading-relaxed">
                ¡Excelente! Este código no genera deuda técnica estimada.
              </p>
            </div>
          ) : (
            /* ── Bars ── */
            <div className="flex-1 flex flex-col justify-end gap-8">
              {/* CRITICAL */}
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] text-[#9a1547] font-bold uppercase tracking-widest">Critical</span>
                  <span className="text-xs font-mono text-themed-primary">{debt.critical}h</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden progress-track">
                  <div
                    className="h-full bg-[#9a1547] rounded-full"
                    style={{ width: pct(debt.critical), boxShadow: debt.critical > 0 ? '0 0 8px #9a1547' : 'none', transition: 'width 0.7s ease' }}
                  />
                </div>
              </div>

              {/* WARNING */}
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] text-[#fcae0a] font-bold uppercase tracking-widest">Warning</span>
                  <span className="text-xs font-mono text-themed-primary">{debt.warning}h</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden progress-track">
                  <div
                    className="h-full bg-[#fcae0a] rounded-full"
                    style={{ width: pct(debt.warning), boxShadow: debt.warning > 0 ? '0 0 8px #fcae0a' : 'none', transition: 'width 0.7s ease' }}
                  />
                </div>
              </div>

              {/* MINOR */}
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] text-[#108023] font-bold uppercase tracking-widest">Minor</span>
                  <span className="text-xs font-mono text-themed-primary">{debt.minor}h</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden progress-track">
                  <div
                    className="h-full bg-[#108023] rounded-full"
                    style={{ width: pct(debt.minor), boxShadow: debt.minor > 0 ? '0 0 8px #108023' : 'none', transition: 'width 0.7s ease' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-themed">
            <p className="text-[10px] text-themed-muted leading-tight">
              {debt.total > 0
                ? `Total estimado: ${debt.total}h · Basado en ${issueCount} hallazgo${issueCount !== 1 ? 's' : ''} (4h/crítico · 2h/medio · 1h/menor).`
                : 'Estimación basada en patrones de refactorización automáticos detectados por CodeSenseAI.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Impact Summary ────────────────────────────────────────────────── */}
      <div className="bg-panel border border-themed rounded-[14px] shadow-2xl overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="max-w-xl">
            <h4 className="text-xl font-light text-themed-primary mb-2 tracking-tight">Resumen de Impacto</h4>
            <p className="text-themed-muted text-sm leading-relaxed font-light italic">
              {debt.total === 0
                ? 'Esta auditoría no detectó vulnerabilidades. El fragmento de código cumple con los estándares editoriales de CodeSenseAI.'
                : 'Las vulnerabilidades detectadas podrían comprometer la integridad de la capa de datos si no se mitigan siguiendo las recomendaciones editoriales de la IA.'}
            </p>
          </div>
          <div className="flex gap-0 shrink-0">
            <div className="text-center px-8 border-r border-themed">
              <p className="text-2xl font-mono font-bold text-themed-accent">{lineCount}</p>
              <p className="text-[10px] uppercase text-themed-muted tracking-widest font-bold mt-1">Líneas</p>
            </div>
            <div className="text-center px-8 border-r border-themed">
              <p className="text-2xl font-mono font-bold" style={{ color: issueCount > 0 ? '#9a1547' : '#108023' }}>
                {issueCount}
              </p>
              <p className="text-[10px] uppercase text-themed-muted tracking-widest font-bold mt-1">Hotspots</p>
            </div>
            <div className="text-center px-8">
              <p className="text-2xl font-mono font-bold text-themed-accent">{debt.total}h</p>
              <p className="text-[10px] uppercase text-themed-muted tracking-widest font-bold mt-1">Deuda</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
