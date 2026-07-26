import { createBrowserRouter, Navigate, RouterProvider, Outlet } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layout/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProveedoresPage } from './pages/ProveedoresPage';
import { ItinerariosPage } from './pages/ItinerariosPage';
import { ReservasPage } from './pages/ReservasPage';
import { TransaccionesPage } from './pages/TransaccionesPage';
import { FacturasPage } from './pages/FacturasPage';
import { useAuthStore } from './store/authStore';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}

// Page transition wrapper for instant feel
function PageTransition({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Instant reveal
    setIsVisible(true);
  }, []);
  
  return (
    <div className={`animate-instantReveal ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="animate-pageIn">
        {children}
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicRoute><PageTransition><LandingPage /></PageTransition></PublicRoute>,
  },
  {
    path: '/login',
    element: <PublicRoute><PageTransition><LoginPage /></PageTransition></PublicRoute>,
  },
  {
    path: '/app',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <PageTransition><OverviewPage /></PageTransition> },
      { path: 'clientes', element: <PageTransition><ClientesPage /></PageTransition> },
      { path: 'proveedores', element: <PageTransition><ProveedoresPage /></PageTransition> },
      { path: 'itinerarios', element: <PageTransition><ItinerariosPage /></PageTransition> },
      { path: 'reservas', element: <PageTransition><ReservasPage /></PageTransition> },
      { path: 'transacciones', element: <PageTransition><TransaccionesPage /></PageTransition> },
      { path: 'facturas', element: <PageTransition><FacturasPage /></PageTransition> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}