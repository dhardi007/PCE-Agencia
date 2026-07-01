import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/uiStore';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import {
  LayoutDashboard, Users, Briefcase, Plane, Calendar, DollarSign, FileText,
  LogOut, Menu, X, ChevronLeft, ChevronRight, Search, Bell, User, Moon, Sun
} from 'lucide-react';

const navItems = [
  { path: '/app', label: 'Resumen', icon: LayoutDashboard },
  { path: '/app/clientes', label: 'Clientes', icon: Users },
  { path: '/app/proveedores', label: 'Proveedores', icon: Briefcase },
  { path: '/app/itinerarios', label: 'Itinerarios', icon: Plane },
  { path: '/app/reservas', label: 'Reservas', icon: Calendar },
  { path: '/app/transacciones', label: 'Transacciones', icon: DollarSign },
  { path: '/app/facturas', label: 'Facturas', icon: FileText },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { sidebarCollapsed, sidebarMobileOpen, theme, toggleSidebar, toggleSidebarMobile, setSidebarMobileOpen, setTheme } = useUIStore();
  const [isDark, setIsDark] = useState(false);

  const handleLogout = async () => {
    const { logout: doLogout } = await import('../context/AuthContext').then(m => m.useAuth());
    // Usar el store directamente
    const { logout: doLogoutStore } = await import('../store/authStore').then(m => m.useAuthStore.getState());
    await doLogoutStore();
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex">
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static z-50 h-screen w-64 bg-[rgb(var(--card))] border-r border-border flex flex-col transition-all duration-300 ease-in-out',
          sidebarCollapsed && 'w-20 lg:w-20',
          sidebarMobileOpen && 'lg:hidden translate-x-0',
          !sidebarMobileOpen && 'hidden lg:block'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center justify-between h-16 px-4 border-b border-border', sidebarCollapsed && 'justify-center')}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="font-bold text-lg text-[rgb(var(--foreground))]">PCE Agencia</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] lg:hover:bg-transparent lg:hidden"
            aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Navegación principal">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--foreground))]',
                isActive && 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className={cn('p-3 border-t border-border', sidebarCollapsed && 'px-1')}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-500">
                {user?.nombre?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[rgb(var(--foreground))] truncate">{user?.nombre}</p>
                <p className="text-xs text-[rgb(var(--muted-foreground))] truncate capitalize">{user?.rol}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] flex-shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn('flex-1 lg:ml-64 min-h-screen flex flex-col', sidebarCollapsed && 'lg:ml-20')}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-[rgb(var(--card))]/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebarMobile}
              className="lg:hidden p-2 rounded-lg hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <h1 className="text-lg font-semibold text-[rgb(var(--foreground))] hidden sm:block">PCE Agencia</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--muted-foreground))]" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar... (Ctrl+K)"
                className="w-64 pl-10 pr-4 py-2 text-sm bg-[rgb(var(--input))] border border-border rounded-btn text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                aria-label="Buscar global"
              />
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
              aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-[rgb(var(--accent))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]">
              <Bell className="w-5 h-5" aria-hidden="true" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-500">
                  {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}