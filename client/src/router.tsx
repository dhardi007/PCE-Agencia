import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { DashboardLayout } from '../layout/DashboardLayout';
import { OverviewPage } from '../pages/OverviewPage';
import { ClientesPage } from '../pages/ClientesPage';
import { ProveedoresPage } from '../pages/ProveedoresPage';
import { ItinerariosPage } from '../pages/ItinerariosPage';
import { ReservasPage } from '../pages/ReservasPage';
import { TransaccionesPage } from '../pages/TransaccionesPage';
import { FacturasPage } from '../pages/FacturasPage';

export function RouterProvider() {
  const router = createBrowserRouter([
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/',
          element: <DashboardLayout />,
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
      ],
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ]);

  return <RouterProvider router={router} />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Aquí podríamos verificar auth, pero por simplicidad dejamos que el layout maneje el redirect
  return <>{children}</>;
}