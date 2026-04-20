import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  return (
    <div className="flex min-h-screen font-body antialiased overflow-hidden transition-colors duration-300 print:block print:min-h-0 print:overflow-visible"
         style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}>

      {/* Sidebar — hidden when printing */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      <main className="flex-1 ml-[220px] min-h-screen flex flex-col relative overflow-hidden print:ml-0 print:block">

        {/* TopBar — hidden when printing */}
        <header className="header-glass h-16 flex justify-between items-center px-8 w-full sticky top-0 z-40 shadow-[0_20px_40px_rgba(0,0,0,0.3)] print:hidden">
          {/* Search */}
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-themed-muted text-lg group-focus-within:text-themed-primary transition-colors">
                search
              </span>
              <input
                className="w-full bg-panel border border-themed rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:border-[color:var(--color-accent)] placeholder:text-themed-muted transition-all text-themed-primary"
                placeholder="Buscar auditorías, archivos o resultados..."
                type="text"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-6">
            <button className="relative text-themed-muted hover:text-themed-primary transition-colors opacity-80 hover:opacity-100">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#981345] rounded-full border-2"
                    style={{ borderColor: 'var(--color-bg-base)' }} />
            </button>

            <div className="h-8 w-[1px] bg-themed hidden sm:block opacity-30" />

            <div className="flex items-center gap-3 pl-0 sm:pl-6 sm:border-l border-themed">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-themed-primary">
                  {user?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-themed-muted font-medium tracking-wide uppercase opacity-60">
                  Curador
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border border-themed p-0.5 cursor-pointer transition-colors">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-bold text-sm"
                     style={{ color: 'var(--color-accent)' }}>
                  {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Canvas — overflow unlocked for print */}
        <div className="flex-1 overflow-y-auto relative print:overflow-visible print:block">
          <div className="p-10 max-w-7xl mx-auto min-h-full">
            <Outlet />
          </div>

          {/* Global FAB — hidden when printing */}
          <button
            onClick={() => navigate('/audits/new')}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 group print:hidden"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <span className="material-symbols-outlined text-3xl font-bold group-hover:rotate-90 transition-transform"
                  style={{ color: 'var(--color-bg-base)' }}>
              add
            </span>
          </button>

          {/* Atmospheric blurs — hidden when printing */}
          <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] blur-[120px] rounded-full -z-10 pointer-events-none opacity-5 print:hidden"
               style={{ backgroundColor: 'var(--color-accent)' }} />
          <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#ffb1c1] blur-[100px] rounded-full -z-10 pointer-events-none opacity-5 print:hidden" />
        </div>
      </main>
    </div>
  );
}
