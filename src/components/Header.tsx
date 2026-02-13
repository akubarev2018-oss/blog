'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types/database';
import {
  Menu,
  X,
  Video,
  PlusCircle,
  LogOut,
  User as UserIcon,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { AuthModal } from './AuthModal';

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user?.id, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    setMobileOpen(false);
    router.refresh();
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setAuthOpen(true);
    setMobileOpen(false);
  };
  const openSignUp = () => {
    setAuthMode('signup');
    setAuthOpen(true);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-90 transition-opacity">
            <span className="p-1.5 rounded-xl bg-primary/20">
              <Video className="w-6 h-6 text-primary" />
            </span>
            <span className="font-bold text-lg">Vlog</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-foreground/90 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Новый пост
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        profile?.username?.slice(0, 1).toUpperCase() ?? '?'
                      )}
                    </div>
                    <span className="font-medium max-w-[120px] truncate">{profile?.username ?? 'User'}</span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} aria-hidden />
                      <div className="absolute right-0 mt-1 py-2 w-48 glass rounded-xl animate-scale-in">
                        <Link
                          href={`/profile/${profile?.id ?? user.id}`}
                          className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-white/10"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon className="w-4 h-4" /> Профиль
                        </Link>
                        <button
                          type="button"
                          onClick={signOut}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-foreground hover:bg-white/10"
                        >
                          <LogOut className="w-4 h-4" /> Выйти
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openSignIn}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-foreground/90 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Войти
                </button>
                <button
                  type="button"
                  onClick={openSignUp}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Регистрация
                </button>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 py-4 px-4 animate-fade-in">
            <nav className="flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-primary/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    <PlusCircle className="w-4 h-4" /> New Post
                  </Link>
                  <Link
                    href={`/profile/${profile?.id ?? user.id}`}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-white/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" /> Профиль
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-white/10 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Выйти
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-primary/10"
                  >
                    <LogIn className="w-4 h-4" /> Войти
                  </button>
                  <button
                    type="button"
                    onClick={openSignUp}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-white"
                  >
                    <UserPlus className="w-4 h-4" /> Регистрация
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
    </>
  );
}
