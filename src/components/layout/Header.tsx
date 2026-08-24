import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-700/80 bg-surface-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/trademirror-logo.svg"
            alt="TradeMirror"
            className="h-9 w-9"
          />
          <span className="text-lg font-bold tracking-tight text-white">
            TradeMirror
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/account">
                <Button variant="ghost" className="px-3 py-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </Button>
              </Link>
              <Button variant="ghost" className="px-3 py-2" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="px-3 py-2">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" className="px-3 py-2">
                  Create Account
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
