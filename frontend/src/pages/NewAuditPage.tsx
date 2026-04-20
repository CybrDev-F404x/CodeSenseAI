import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditService } from '../services/api';
import toast from 'react-hot-toast';

export default function NewAuditPage() {
  const navigate = useNavigate();
  const [language, setLanguage]     = useState<'python' | 'csharp'>('python');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!codeSnippet.trim()) { setError('Debes ingresar un fragmento de código'); return; }
    setError('');
    setLoading(true);
    try {
      const audit = await auditService.create({ language, code_snippet: codeSnippet });
      toast.success('Auditoría enviada exitosamente. Analizando...');
      navigate(`/audits/${audit.id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al crear la auditoría';
      setError(detail);
      toast.error(detail);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!codeSnippet.trim()) { toast.error('No hay código para copiar'); return; }
    navigator.clipboard.writeText(codeSnippet)
      .then(() => toast.success('Código copiado al portapapeles'))
      .catch(() => toast.error('Error al copiar al portapapeles'));
  };

  // Active language button style
  const langActive   = 'text-white font-medium';
  const langInactive = 'text-themed-muted hover:bg-card';

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-4xl font-light tracking-tight text-themed-primary mb-2">Nueva Auditoría</h2>
        <p className="text-themed-muted max-w-2xl font-light leading-relaxed">
          Inicia un análisis inteligente de tu código. Detectaremos vulnerabilidades, optimizaremos el rendimiento y sugeriremos mejoras de arquitectura basadas en estándares industriales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left panel */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-panel border border-themed p-6 rounded-[14px] shadow-xl">
            <label className="block text-xs font-medium text-themed-muted uppercase tracking-wider mb-4">Lenguaje</label>
            <div className="flex flex-col gap-2">
              {([['python', 'code', 'Python'], ['csharp', 'terminal', 'C#']] as const).map(([lang, icon, lbl]) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all border border-themed ${
                    language === lang ? `${langActive}` : `bg-transparent ${langInactive}`
                  }`}
                  style={language === lang ? { backgroundColor: 'var(--color-accent)' } : {}}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                    {lbl}
                  </span>
                  {language === lang && (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Engine status */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#108023] shadow-[0_0_8px_rgba(16,128,35,0.6)] animate-pulse" />
              <span className="text-xs text-themed-muted font-medium uppercase tracking-widest">IA Engine Active</span>
            </div>
            <p className="text-[11px] text-themed-muted leading-relaxed">CodeSenseAI model v1.0 ready for high-concurrency patterns detection.</p>
          </div>
        </div>

        {/* Right: editor */}
        <div className="lg:col-span-9 space-y-6">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-[#93000a]/10 text-[#ffb4ab] border border-[#93000a]/20 rounded-xl text-sm font-light">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Editor box */}
          <div className="relative bg-[#06010F] rounded-[10px] border border-themed overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="bg-card border-b border-themed px-6 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#fcae0a]/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#108023]/40" />
                </div>
                <span className="text-xs font-mono text-themed-muted">
                  {language === 'python' ? 'main.py' : 'Program.cs'}
                </span>
              </div>
              {/* Copy button — themed accent */}
              <button
                type="button"
                onClick={handleCopy}
                className="text-themed-muted hover:text-themed-accent transition-colors p-1.5 rounded-lg hover:bg-accent-subtle"
                title="Copiar código"
              >
                <span className="material-symbols-outlined text-lg">content_copy</span>
              </button>
            </div>

            {/* Editor */}
            <div className="flex">
              <div className="w-12 bg-card border-r border-themed py-6 flex flex-col items-center text-[11px] font-mono text-themed-muted/30 space-y-1 select-none">
                {Array.from({ length: 15 }, (_, i) => <span key={i}>{i + 1}</span>)}
              </div>
              <textarea
                className="w-full h-[480px] bg-transparent border-none focus:ring-0 font-mono text-sm p-6 text-[#b9c3ff] placeholder:text-themed-muted/20 resize-none leading-relaxed outline-none"
                placeholder="Pega tu código aquí para un análisis editorial inteligente..."
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
              />
            </div>
            <div className="absolute bottom-4 right-6 pointer-events-none">
              <span className="text-[11px] font-mono text-themed-muted">{codeSnippet.length} characters | UTF-8</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full text-white font-semibold py-5 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
            style={{
              backgroundColor: 'var(--color-accent)',
              boxShadow: '0 10px 30px var(--color-accent-glow)',
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                Enviar a Auditoría
              </>
            )}
          </button>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {[
              { icon: 'security',    color: '--color-warning',  title: 'Security Scan',  desc: 'Checking for SQL injection, XSS, and broken auth patterns.' },
              { icon: 'speed',       color: '--color-accent',   title: 'Complexity',     desc: 'Measuring Cyclomatic complexity and cognitive load.' },
              { icon: 'architecture',color: '--color-critical', title: 'Patterns',       desc: 'Verification of SOLID principles and design patterns.' },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} className="bg-panel p-4 rounded-xl border border-themed group hover:bg-accent-subtle transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined" style={{ color: `var(${color})` }}>{icon}</span>
                  <h4 className="text-xs font-bold uppercase text-themed-primary">{title}</h4>
                </div>
                <p className="text-[11px] text-themed-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
