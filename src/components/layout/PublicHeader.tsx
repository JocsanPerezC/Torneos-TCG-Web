import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Settings as SettingsIcon, ShieldCheck, Trophy } from 'lucide-react';
import { useAuth } from '../../state/AuthContext';
import { Button } from '../ui/button';
import { LanguageSelector } from '../ui/LanguageSelector';
import i18n from '../../i18n';

export function Header() {
  const { user, configured, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authScreen = ['/login', '/register', '/forgot-password', '/auth/confirmed'].includes(
    location.pathname,
  );

  return (
    <header className="app-header app-shell-header">
      <div className="app-shell-header__bar mx-auto max-w-6xl">
        <Link to="/" className="app-shell-header__brand">
          <img src="/edh-tournaments-icon.svg" alt="" />
          EDH <span>Tournaments</span>
        </Link>
        {!authScreen && (
          <nav
            className="app-shell-header__actions"
            aria-label={i18n.t('landing.navigation.label')}
          >
            {isAdmin ? (
              <Link
                to="/admin"
                aria-label={i18n.t('app.header.administration')}
                className="app-shell-header__link app-shell-header__link--admin"
              >
                <ShieldCheck size={16} />
                <span className="hidden sm:inline">{i18n.t('app.header.administration')}</span>
              </Link>
            ) : (
              <Link
                to="/dashboard"
                aria-label={i18n.t('app.header.tournaments')}
                className="app-shell-header__link"
              >
                <Trophy size={16} />
                <span className="hidden sm:inline">{i18n.t('app.header.tournaments')}</span>
              </Link>
            )}
            {configured && user && (
              <Link
                to="/perfil"
                aria-label={i18n.t('app.profile.title')}
                className="app-shell-header__link"
              >
                <SettingsIcon size={16} />
                <span className="hidden sm:inline">{i18n.t('app.profile.shortTitle')}</span>
              </Link>
            )}
            {configured && user ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={i18n.t('app.header.signOut')}
                className="app-button--danger !text-[.82rem] !font-semibold"
                onClick={() => {
                  navigate('/', { replace: true });
                  void signOut().catch(() => undefined);
                }}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">{i18n.t('app.header.signOut')}</span>
              </Button>
            ) : (
              <Link
                to="/login"
                aria-label={i18n.t('app.header.organizer')}
                className="app-shell-header__link"
              >
                <Trophy size={16} />
                <span className="hidden sm:inline">{i18n.t('app.header.organizer')}</span>
              </Link>
            )}
            <LanguageSelector />
          </nav>
        )}
      </div>
    </header>
  );
}
