import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  {
    label: 'Operación',
    icon: '📦',
    items: [
      { to: '/canales', label: 'Canales / Romaneaje' },
      { to: '/entradas', label: 'Producto Terminado' },
      { to: '/salidas', label: 'Salidas' },
      { to: '/existencias', label: 'Existencias' },
      { to: '/etiquetas', label: 'Etiquetas' },
    ],
  },
  {
    label: 'Reportes',
    icon: '📄',
    items: [{ to: '/reportes', label: 'Ver reportes' }],
  },
  {
    label: 'Inventario',
    icon: '⚠️',
    items: [
      { to: '/movimientos', label: 'Movimientos de inventario' },
      { to: '/inventario-inicial', label: 'Inventario inicial' },
    ],
  },
];

// Grupos visibles solo para administradores.
const NAV_ADMIN_GROUPS = [
  {
    label: 'Datos',
    icon: '🗂️',
    items: [
      { to: '/clientes', label: 'Clientes' },
      { to: '/productos', label: 'Productos' },
    ],
  },
  {
    label: 'Auditoría',
    icon: '🔒',
    items: [
      { to: '/bitacora', label: 'Bitácora' },
      { to: '/usuarios', label: 'Usuarios' },
    ],
  },
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const nav = user?.rol === 'admin' ? [...NAV, ...NAV_ADMIN_GROUPS] : NAV;
  // En móvil el cajón siempre muestra las etiquetas completas — el modo
  // colapsado (mini-sidebar) solo aplica en escritorio (md:) y superior.
  const collapsedDesktop = collapsed;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-ink-950 text-ink-200 transition-transform duration-200 md:static md:translate-x-0 md:transition-all ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsedDesktop ? 'md:w-[76px]' : 'md:w-64'}`}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
          <img src="/logo-anden.png" alt="El Andén" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          {!collapsedDesktop && (
            <div className="min-w-0 flex-1 md:block">
              <p className="truncate text-sm font-bold text-white">El Andén</p>
              <p className="truncate text-xs text-ink-400">Sistema de Embarques</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-white/5 hover:text-white md:flex"
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? '»' : '‹'}
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xl text-ink-400 hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {nav.map((group) => (
            <div key={group.label}>
              <div className={`mb-1.5 flex items-center gap-2 px-2 ${collapsedDesktop ? 'md:justify-center' : ''}`}>
                <span className="text-sm">{group.icon}</span>
                {!collapsedDesktop && (
                  <span className="text-xs font-bold uppercase tracking-wide text-white">{group.label}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block truncate rounded-lg px-3 py-2 text-sm transition ${
                        collapsedDesktop ? 'md:px-0 md:text-center' : ''
                      } ${
                        isActive
                          ? 'bg-brand-500 font-semibold text-white shadow-sm'
                          : 'text-ink-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                    title={item.label}
                  >
                    <span className={collapsedDesktop ? 'md:hidden' : ''}>{item.label}</span>
                    {collapsedDesktop && <span className="hidden md:inline">{item.label.slice(0, 1)}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t border-white/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {(user?.nombre || '?').slice(0, 1).toUpperCase()}
          </div>
          {!collapsedDesktop && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.nombre}</p>
              <p className="truncate text-xs capitalize text-ink-400">{user?.rol}</p>
            </div>
          )}
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-white/5 hover:text-white"
          >
            ⏻
          </button>
        </div>
      </aside>
    </>
  );
}
