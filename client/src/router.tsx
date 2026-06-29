import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
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

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'clientes', element: <ClientesPage /> },
      { path: 'proveedores', element: <ProveedoresPage /> },
      { path: 'itinerarios', element: <ItinerariosPage /> },
      { path: 'reservas', element: <ReservasPage /> },
      { path: 'transacciones', element: <TransaccionesPage /> },
      { path: 'facturas', element: <FacturasPage /> },
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
