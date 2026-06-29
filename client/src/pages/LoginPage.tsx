import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@pce.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/src/assets/hero.png')] bg-cover bg-center opacity-5 pointer-events-none" />
      <div className="w-full max-w-md">
        <div className="card p-8 animate-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 text-blue-500 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">PCE Agencia</h1>
            <p className="text-[rgb(var(--muted-foreground))] mt-2">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pce.com"
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 text-red-300 text-sm animate-in">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              Iniciar Sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[rgb(var(--muted-foreground))]">
            Demo: admin@pce.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}