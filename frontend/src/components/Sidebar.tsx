import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/',          icon: 'dashboard',  label: 'Dashboard'       },
  { to: '/audits/new',icon: 'add_chart',  label: 'Nueva Auditoría' },
  { to: '/audits',    icon: 'assignment', label: 'Mis Auditorías'  },
  { to: '/reports',   icon: 'analytics',  label: 'Reportes'        },
];

const systemItems = [
  { to: '/profile',  icon: 'person',   label: 'Perfil'         },
  { to: '/settings', icon: 'settings', label: 'Configuración'  },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const linkCls = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${
      isActive
        ? 'nav-active'
        : 'nav-item text-themed-muted hover:text-themed-primary'
    }`;

  return (
    <aside className="bg-sidebar fixed left-0 top-0 h-full w-[220px] flex flex-col py-6 z-50 border-r border-themed transition-colors duration-300">
      {/* Logo */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-btn flex items-center justify-center shadow-lg">
          <span
            className="material-symbols-outlined text-sm"
            style={{ color: 'var(--color-bg-base)', fontVariationSettings: "'FILL' 1" }}
          >
            terminal
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-light tracking-tighter text-themed-primary">CodeSenseAI</span>
          <span className="text-[10px] uppercase tracking-widest text-themed-muted opacity-60">Editorial Intelligence</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => linkCls(isActive)}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-['Inter']"> {item.label}</span>
          </NavLink>
        ))}

        <div className="pt-10 pb-4">
          <p className="px-3 text-[10px] text-themed-muted opacity-50 font-bold uppercase tracking-wider mb-2">
            Account
          </p>
          {systemItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => linkCls(isActive)}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-['Inter']"> {item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-themed-muted hover:text-[#ffb4ab] transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">logout</span>
          <span className="font-['Inter'] font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
