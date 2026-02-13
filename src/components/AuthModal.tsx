'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Mail, Lock, User } from 'lucide-react';

type Mode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username || undefined },
            emailRedirectTo: undefined, // без подтверждения по почте
          },
        });
        if (error) throw error;
        // Если сессия есть (подтверждение email отключено в Supabase) — сразу входим
        if (data.session) {
          onClose();
          window.location.href = '/';
        } else {
          setMessage({ type: 'success', text: 'Проверьте почту для подтверждения аккаунта.' });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
        window.location.href = '/'; // SPA refresh auth state
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      const isNetworkError = msg === 'Failed to fetch' || msg.includes('NetworkError');
      setMessage({
        type: 'error',
        text: isNetworkError
          ? 'Нет связи с сервером. Проверьте URL и ключ в .env.local и перезапустите dev-сервер.'
          : msg,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative glass p-6 w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {mode === 'signin' ? 'Вход' : 'Регистрация'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Имя пользователя</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/30 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/30 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/30 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>
          {message && (
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-secondary' : 'text-accent'
              }`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Подождите...' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground/70">
          {mode === 'signin' ? (
            <>
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-primary font-medium hover:underline"
              >
                Регистрация
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-primary font-medium hover:underline"
              >
                Войти
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
