import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditService, userService, type Audit } from '../services/api';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ProfilePage() {
  const { user } = useAuth();
  const [audits, setAudits]   = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail]       = useState(user?.email || '');

  useEffect(() => {
    if (user) { setFullName(user.full_name || ''); setEmail(user.email || ''); }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await auditService.list();
        if (!cancelled) setAudits(list);
      } catch { /* global interceptor */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) { toast.error('Nombre y Email son obligatorios'); return; }
    setSaving(true);
    try {
      await userService.updateMe({ full_name: fullName.trim(), email: email.trim() });
      toast.success('Perfil actualizado correctamente');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al actualizar el perfil';
      toast.error(detail);
    } finally {
      setSaving(false);
    }
  };

  const totalLines      = audits.reduce((s, a) => s + (a.code_snippet?.split('\n').length || 0), 0);
  const completedAudits = audits.filter(a => a.status === 'done').length;

  const stats = [
    { label: 'Líneas Curadas',        value: loading ? '—' : `${(totalLines / 1000).toFixed(1)}k`, icon: 'segment' },
    { label: 'Auditorías Finalizadas', value: loading ? '—' : String(completedAudits),             icon: 'inventory_2' },
  ];

  const recentActivity = [...audits]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map((audit) => {
      const cfg: Record<string, { action: string; icon: string; colorVar: string }> = {
        done:       { action: 'Auditoría Finalizada', icon: 'task_alt',  colorVar: '--color-success' },
        processing: { action: 'Auditoría en Proceso', icon: 'pending',   colorVar: '--color-warning'  },
        failed:     { action: 'Auditoría Fallida',    icon: 'error',     colorVar: '--color-critical'  },
        pending:    { action: 'Auditoría Pendiente',  icon: 'schedule',  colorVar: '--color-accent'   },
      };
      const c = cfg[audit.status] || cfg.pending;
      return { ...c, target: `AUD-${audit.id.substring(0, 8).toUpperCase()}`, time: getTimeAgo(new Date(audit.created_at)) };
    });

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-3xl font-light tracking-tight text-themed-primary">Perfil del Curador</h2>
        <p className="text-themed-muted font-light mt-1">Gestión de identidad y métricas de desempeño individual.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form */}
        <div className="lg:col-span-7 space-y-8">
          <form onSubmit={handleUpdateProfile} className="bg-panel border border-themed rounded-[24px] p-8 shadow-2xl space-y-8">
            {/* Avatar row */}
            <div className="flex items-center gap-6 mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-light border border-themed bg-card"
                style={{ color: 'var(--color-accent)' }}
              >
                {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-light text-themed-primary tracking-tight">{user?.full_name || 'Curador'}</h3>
                <p className="text-xs text-themed-muted uppercase tracking-widest font-medium">Curador Activo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nombre Completo" placeholder="Ej. Alex Sterling" value={fullName} onChange={e => setFullName(e.target.value)} required />
              <Input label="Email Corporativo" placeholder="curador@codesense.ai" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" isLoading={saving} className="min-w-[160px]">
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-panel border border-themed rounded-2xl p-6 flex flex-col justify-between min-h-[120px] shadow-xl">
                <span className="material-symbols-outlined text-themed-muted opacity-40 mb-4">{s.icon}</span>
                <div>
                  <p className="text-[10px] text-themed-muted uppercase font-bold tracking-widest mb-1">{s.label}</p>
                  <p className={`text-2xl font-mono text-themed-primary ${loading ? 'animate-pulse' : ''}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Activity + Badges */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-panel border border-themed rounded-[24px] p-8 shadow-2xl">
            <h4 className="text-[10px] font-bold text-themed-muted uppercase tracking-widest mb-6">Actividad Reciente</h4>
            <div className="space-y-8">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-6 items-start animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-card shrink-0" />
                    <div className="flex-1 pb-6 border-b border-themed space-y-2">
                      <div className="h-4 w-40 bg-card rounded" />
                      <div className="h-3 w-56 bg-card rounded" />
                    </div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-themed-muted font-light italic">No hay actividad registrada aún.</p>
              ) : (
                recentActivity.map((item, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center shrink-0"
                         style={{ color: `var(${item.colorVar})` }}>
                      <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    </div>
                    <div className="flex-1 pb-6 border-b border-themed group-last:border-0 group-last:pb-0">
                      <p className="text-sm text-themed-primary font-medium">{item.action}</p>
                      <p className="text-xs text-themed-muted mt-1 font-light">Referencia: <span className="text-themed-primary italic">{item.target}</span></p>
                      <p className="text-[10px] text-themed-muted mt-3 uppercase tracking-widest opacity-40">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-panel border border-themed rounded-[24px] p-8 shadow-2xl">
            <h4 className="text-[10px] font-bold text-themed-muted uppercase tracking-widest mb-6">Insignias de Logro</h4>
            <div className="flex flex-wrap gap-3">
              {['Security Maven', 'Swift Auditor', 'Clean Code Expert'].map((badge) => (
                <span key={badge} className="px-3 py-1.5 rounded-lg badge-accent text-[10px] font-bold uppercase tracking-wider">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 1)  return 'Justo ahora';
  if (mins  < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days  < 7)  return `hace ${days} día${days > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}
