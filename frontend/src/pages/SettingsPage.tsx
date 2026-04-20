import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { applyTheme, THEME_CATALOGUE, THEMES, type ThemeKey } from '../utils/theme';
import Button from '../components/ui/Button';

// ── Sidebar tabs ───────────────────────────────────────────────
type Tab = 'ai' | 'interface' | 'notifications' | 'danger';

const TABS: { id: Tab; label: string; icon: string; destructive?: boolean }[] = [
  { id: 'ai',            label: 'Preferencias de IA', icon: 'psychology'    },
  { id: 'interface',     label: 'Interfaz',            icon: 'palette'       },
  { id: 'notifications', label: 'Notificaciones',      icon: 'notifications' },
  { id: 'danger',        label: 'Zona de Peligro',     icon: 'warning',       destructive: true },
];

// ── Reusable toggle ────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="w-12 h-6 rounded-full relative p-1 transition-colors duration-300 focus:outline-none"
      style={{ backgroundColor: value ? 'var(--color-accent)' : '#3b3047' }}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-all duration-300 ${value ? 'right-1' : 'left-1'}`} />
    </button>
  );
}

// ── Delete Confirmation Modal ──────────────────────────────────
function DeleteAccountModal({
  onCancel,
  onConfirm,
  isDeleting,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      {/* Modal card — always dark/crimson regardless of theme */}
      <div
        className="relative w-full max-w-md rounded-[24px] p-8 shadow-2xl animate-fade-in"
        style={{ backgroundColor: '#1a0005', border: '1px solid rgba(143,0,19,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
             style={{ backgroundColor: 'rgba(143,0,19,0.15)' }}>
          <span className="material-symbols-outlined text-3xl" style={{ color: '#FF6B6B', fontVariationSettings: "'FILL' 1" }}>
            delete_forever
          </span>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-center mb-3" style={{ color: '#fce4ec' }}>
          ¿Eliminar tu cuenta?
        </h3>
        <p className="text-sm text-center leading-relaxed mb-8" style={{ color: '#d48b98' }}>
          Perderás el acceso a todo tu historial de auditorías y reportes.{' '}
          <strong style={{ color: '#FF6B6B' }}>Esta acción no se puede deshacer.</strong>
        </p>

        {/* Highlight box */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-8"
             style={{ backgroundColor: 'rgba(143,0,19,0.12)', border: '1px solid rgba(143,0,19,0.25)' }}>
          <span className="material-symbols-outlined text-lg shrink-0 mt-0.5" style={{ color: '#FF6B6B' }}>info</span>
          <p className="text-xs leading-relaxed" style={{ color: '#d48b98' }}>
            Tus datos permanecerán almacenados de forma segura pero tu acceso será revocado inmediatamente.
            Contacta a soporte si cambias de opinión.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fce4ec', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#8F0013', color: '#fff', boxShadow: '0 4px 20px rgba(143,0,19,0.4)' }}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            )}
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate                       = useNavigate();
  const [activeTab, setActiveTab]      = useState<Tab>('ai');
  const [saving, setSaving]            = useState(false);

  // AI prefs (local-only for now)
  const [rigor, setRigor]               = useState<'standard' | 'deep' | 'experimental'>('deep');
  const [autoRefactor, setAutoRefactor] = useState(false);

  // Interface
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('indigo');

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [appNotif,   setAppNotif]   = useState(true);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting,      setIsDeleting]      = useState(false);

  // ── Seed state from user preferences ──
  useEffect(() => {
    if (!user?.preferences) return;
    const prefs = user.preferences;
    if (prefs.theme) setSelectedTheme(prefs.theme as ThemeKey);
    if (prefs.notifications) {
      const n = prefs.notifications as { email?: boolean; app?: boolean };
      if (typeof n.email === 'boolean') setEmailNotif(n.email);
      if (typeof n.app   === 'boolean') setAppNotif(n.app);
    }
  }, [user]);

  // Live-preview — applies instantly across the whole app
  const handleThemeSelect = (key: ThemeKey) => {
    setSelectedTheme(key);
    applyTheme(key);
  };

  // Persist preferences to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateMe({
        preferences: {
          theme: selectedTheme,
          notifications: { email: emailNotif, app: appNotif },
        },
      });
      await refreshUser();
      toast.success('Preferencias guardadas correctamente');
    } catch {
      toast.error('Error al guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  // Soft-delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteMe();
      toast.success('Cuenta eliminada correctamente. ¡Hasta pronto!');
      setShowDeleteModal(false);
      // Clear local state, JWT and redirect to /login
      logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Error al eliminar la cuenta. Por favor intenta de nuevo.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* ── Delete modal (portal-like, rendered above everything) ── */}
      {showDeleteModal && (
        <DeleteAccountModal
          onCancel={() => !isDeleting && setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          isDeleting={isDeleting}
        />
      )}

      <div className="animate-fade-in space-y-10">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl font-light tracking-tight text-themed-primary">Configuración del Sistema</h2>
          <p className="text-themed-muted font-light mt-1">
            Personaliza tu entorno de curaduría y gestiona las preferencias del motor de IA.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* ── Sidebar tabs ── */}
          <aside className="lg:col-span-3 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 border-l-2 ${
                  tab.destructive
                    ? activeTab === tab.id
                      ? 'bg-[#9a1547]/10 border-[#9a1547] text-[#FF6B6B] font-medium'
                      : 'border-transparent text-[#9a1547]/60 hover:text-[#FF6B6B] hover:bg-[#9a1547]/5'
                    : activeTab === tab.id
                      ? 'nav-active font-medium'
                      : 'nav-item text-themed-muted border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </aside>

          {/* ── Content area ── */}
          <div className="lg:col-span-9 space-y-8">

            {/* ════ AI Preferences ════ */}
            {activeTab === 'ai' && (
              <section className="bg-panel border border-themed rounded-[24px] p-8 shadow-2xl space-y-8">
                <h3 className="text-xl font-light text-themed-primary">Preferencias de Análisis</h3>

                <div>
                  <label className="block text-[10px] font-bold text-themed-muted uppercase tracking-widest mb-4">
                    Nivel de Rigor Editorial
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {([
                      { id: 'standard'     as const, label: 'Standard',     desc: 'Análisis balanceado de seguridad y estilo.' },
                      { id: 'deep'         as const, label: 'Deep Curation', desc: 'Escaneo exhaustivo de patrones lógicos complejos.' },
                      { id: 'experimental' as const, label: 'Experimental',  desc: 'Incluye detecciones de modelos en beta.' },
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setRigor(opt.id)}
                        className={`p-5 rounded-2xl border text-left transition-all ${
                          rigor === opt.id
                            ? 'border-themed ring-1 bg-accent-subtle'
                            : 'bg-card border-themed hover:border-themed'
                        }`}
                        style={rigor === opt.id ? { borderColor: 'var(--color-accent)', '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties : {}}
                      >
                        <p className={`text-sm font-medium mb-1 ${rigor === opt.id ? 'text-themed-primary' : 'text-themed-muted'}`}>{opt.label}</p>
                        <p className="text-[11px] text-themed-muted leading-relaxed">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-themed">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-themed-primary">Sugerencias de Refactorización Automática</p>
                      <p className="text-xs text-themed-muted mt-0.5">La IA propondrá bloques de código corregidos directamente.</p>
                    </div>
                    <Toggle value={autoRefactor} onChange={setAutoRefactor} />
                  </div>
                </div>
              </section>
            )}

            {/* ════ Interface / Theme ════ */}
            {activeTab === 'interface' && (
              <section className="bg-panel border border-themed rounded-[24px] p-8 shadow-2xl space-y-10">
                <div>
                  <h3 className="text-xl font-light text-themed-primary">Tema de Interfaz</h3>
                  <p className="text-sm text-themed-muted mt-1">
                    El cambio se aplica en toda la app instantáneamente. Guarda para persistir entre sesiones.
                  </p>
                </div>

                {/* Theme picker grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {THEME_CATALOGUE.map((t) => {
                    const isSelected = selectedTheme === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => handleThemeSelect(t.key)}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                          isSelected ? 'ring-2 border-themed' : 'border-themed bg-card hover:bg-card'
                        }`}
                        style={isSelected ? {
                          borderColor: 'var(--color-accent)',
                          '--tw-ring-color': 'var(--color-accent)',
                          backgroundColor: 'var(--color-accent-subtle)',
                        } as React.CSSProperties : {}}
                      >
                        <div className="w-14 h-14 rounded-xl shadow-lg relative overflow-hidden" style={{ background: t.swatchBg }}>
                          <div className="absolute bottom-0 left-0 right-0 h-4" style={{ background: t.swatchAccent }} />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-medium tracking-wide transition-colors ${isSelected ? 'text-themed-primary' : 'text-themed-muted group-hover:text-themed-primary'}`}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Live preview bar */}
                <div className="mt-4 rounded-2xl overflow-hidden border border-themed">
                  <div className="px-5 py-3 flex items-center gap-3" style={{ backgroundColor: THEMES[selectedTheme]['--color-surface'] }}>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#fcae0a]/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#108023]/50" />
                    </div>
                    <span className="text-xs font-mono opacity-40" style={{ color: THEMES[selectedTheme]['--color-text-primary'] }}>
                      preview — sidebar.tsx
                    </span>
                  </div>
                  <div className="px-6 py-5 flex items-center justify-between"
                       style={{ backgroundColor: THEMES[selectedTheme]['--color-bg-base'], color: THEMES[selectedTheme]['--color-text-primary'] }}>
                    <div className="space-y-1.5">
                      <div className="h-2 w-32 rounded-full opacity-40" style={{ background: THEMES[selectedTheme]['--color-text-primary'] }} />
                      <div className="h-2 w-20 rounded-full opacity-20" style={{ background: THEMES[selectedTheme]['--color-text-primary'] }} />
                    </div>
                    <div className="px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: THEMES[selectedTheme]['--color-accent'] }}>
                      Acción
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ════ Notifications ════ */}
            {activeTab === 'notifications' && (
              <section className="bg-panel border border-themed rounded-[24px] p-8 shadow-2xl space-y-8">
                <div>
                  <h3 className="text-xl font-light text-themed-primary">Preferencias de Notificaciones</h3>
                  <p className="text-sm text-themed-muted mt-1">Controla cómo y cuándo CodeSenseAI se comunica contigo.</p>
                </div>

                <div className="space-y-0">
                  {/* Email */}
                  <div className="flex items-start justify-between gap-8 py-5 border-b border-themed">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-accent-subtle)' }}>
                        <span className="material-symbols-outlined text-xl" style={{ color: 'var(--color-accent)' }}>mail</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-themed-primary">Notificaciones por Email</p>
                        <p className="text-xs text-themed-muted mt-0.5 leading-relaxed max-w-sm">
                          Recibe un resumen de tus auditorías y alertas críticas en tu bandeja de entrada.
                        </p>
                      </div>
                    </div>
                    <Toggle value={emailNotif} onChange={setEmailNotif} />
                  </div>

                  {/* In-app */}
                  <div className="flex items-start justify-between gap-8 py-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-accent-subtle)' }}>
                        <span className="material-symbols-outlined text-xl" style={{ color: 'var(--color-accent)' }}>notifications_active</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-themed-primary">Notificaciones en la App</p>
                        <p className="text-xs text-themed-muted mt-0.5 leading-relaxed max-w-sm">
                          Alertas en tiempo real dentro del panel cuando una auditoría finalice o detecte vulnerabilidades críticas.
                        </p>
                      </div>
                    </div>
                    <Toggle value={appNotif} onChange={setAppNotif} />
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border"
                     style={{ backgroundColor: 'var(--color-accent-subtle)', borderColor: 'var(--color-border)' }}>
                  <span className="material-symbols-outlined text-lg shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }}>info</span>
                  <p className="text-xs text-themed-muted leading-relaxed">
                    Pulsa <strong className="text-themed-primary">Guardar Preferencias</strong> para que los cambios persistan en futuras sesiones.
                  </p>
                </div>
              </section>
            )}

            {/* ════ DANGER ZONE ════ */}
            {activeTab === 'danger' && (
              <section
                className="rounded-[24px] p-8 shadow-2xl space-y-8"
                style={{
                  background: 'linear-gradient(135deg, rgba(26,0,5,0.95) 0%, rgba(45,0,10,0.95) 100%)',
                  border: '1px solid rgba(143, 0, 19, 0.35)',
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                       style={{ backgroundColor: 'rgba(143,0,19,0.15)' }}>
                    <span className="material-symbols-outlined text-2xl" style={{ color: '#FF6B6B', fontVariationSettings: "'FILL' 1" }}>
                      warning
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#fce4ec' }}>Zona de Peligro</h3>
                    <p className="text-sm mt-0.5" style={{ color: '#d48b98' }}>
                      Las acciones en esta sección son permanentes e irreversibles.
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t" style={{ borderColor: 'rgba(143,0,19,0.2)' }} />

                {/* Delete account row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold" style={{ color: '#fce4ec' }}>Eliminar Cuenta</p>
                    <p className="text-sm leading-relaxed max-w-md" style={{ color: '#d48b98' }}>
                      Desactiva permanentemente tu cuenta. Perderás el acceso a todas tus auditorías,
                      reportes y configuraciones guardadas.
                    </p>
                    {/* Warning chips */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {['Acceso revocado', 'Datos preservados', 'Irreversible'].map((chip) => (
                        <span
                          key={chip}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: 'rgba(143,0,19,0.15)', color: '#FF6B6B', border: '1px solid rgba(143,0,19,0.25)' }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[0.98] active:scale-95"
                    style={{
                      backgroundColor: 'rgba(143,0,19,0.15)',
                      color: '#FF6B6B',
                      border: '1px solid rgba(143,0,19,0.4)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#8F0013';
                      (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(143,0,19,0.15)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#FF6B6B';
                    }}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      delete_forever
                    </span>
                    Eliminar Cuenta
                  </button>
                </div>
              </section>
            )}

            {/* ── Save button (hidden on danger tab) ── */}
            {activeTab !== 'danger' && (
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} isLoading={saving} className="min-w-[200px]">
                  {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
