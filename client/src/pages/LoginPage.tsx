import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-in shadow-2xl shadow-black/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow-lg shadow-blue-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">PCE Agencia</h1>
            <p className="text-white/80 mt-2 drop-shadow-md">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1.5 drop-shadow-md">
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
                className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/30 transition-all duration-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1.5 drop-shadow-md">
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
                className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/30 transition-all duration-300"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/30 border border-red-400/30 text-red-200 text-sm animate-in drop-shadow-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isLoading} className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300">
              Iniciar Sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-white/60 drop-shadow-md">
            Demo: <span className="text-blue-300 font-medium">admin@pce.com</span> / admin123
          </p>
        </div>
      </div>
    </div>
  );
}