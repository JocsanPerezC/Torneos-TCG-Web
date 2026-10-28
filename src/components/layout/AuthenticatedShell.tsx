import {
  ArrowLeft,
  BarChart3,
  CircleUserRound,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../state/AuthContext';
import { getUserProfile } from '../../lib/userProfile';
import { LanguageSelector } from '../ui/LanguageSelector';

type NavigationItem = {
  to: string;
  label: string;
  compactLabel?: string;
  icon: LucideIcon;
  accent?: boolean;
  end?: boolean;
};

export type TournamentNavigation = {
  id: string;
  name: string;
};

function NavigationLink({
  item,
  compact = false,
  collapsed = false,
}: {
  item: NavigationItem;
  compact?: boolean;
  collapsed?: boolean;
}) {
  const location = useLocation();
  const pointsToCurrentAnchor =
    item.to.includes('#') && `${location.pathname}${location.hash}` === item.to;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-label={collapsed || compact ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `app-sidebar__link${pointsToCurrentAnchor || (!item.to.includes('#') && isActive && !(item.to === '/dashboard' && location.hash)) ? ' is-active' : ''}${item.accent ? ' is-accent' : ''}${compact ? ' is-compact' : ''}`
      }
    >
      <item.icon aria-hidden="true" />
      <span aria-hidden={collapsed || undefined}>
        {compact ? (item.compactLabel ?? item.label) : item.label}
      </span>
    </NavLink>
  );
}

export function AuthenticatedShell({
  children,
  wide = false,
  tournament,
}: {
  children: React.ReactNode;
  wide?: boolean;
  tournament?: TournamentNavigation;
}) {
  const { t } = useTranslation();
  const { isAdmin, isPlayer, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = getUserProfile(user);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  useEffect(() => {
    setMobileAccountOpen(false);
  }, [location.hash, location.pathname]);

  const leaveSession = () => {
    setMobileAccountOpen(false);
    void signOut()
      .catch(() => undefined)
      .finally(() => navigate('/', { replace: true }));
  };

  const globalItems: NavigationItem[] = isAdmin
    ? [
        {
          to: '/admin',
          label: t('app.shell.administration'),
          icon: ShieldCheck,
        },
        { to: '/perfil', label: t('app.shell.profile'), icon: CircleUserRound },
      ]
    : isPlayer
      ? [
          { to: '/dashboard', label: t('app.shell.myTournaments'), icon: Trophy },
          { to: '/unirse', label: t('app.shell.joinTournament'), icon: Swords, accent: true },
          { to: '/perfil', label: t('app.shell.profile'), icon: CircleUserRound },
        ]
      : [
          { to: '/dashboard', label: t('app.shell.home'), icon: LayoutDashboard },
          { to: '/dashboard#my-tournaments', label: t('app.shell.myTournaments'), icon: Trophy },
          { to: '/perfil', label: t('app.shell.profile'), icon: CircleUserRound },
        ];

  const tournamentItems: NavigationItem[] = tournament
    ? [
        {
          to: '/dashboard',
          label: t('app.shell.backToTournaments'),
          compactLabel: t('app.shell.tournamentsShort'),
          icon: ArrowLeft,
        },
        {
          to: `/tournaments/${tournament.id}`,
          label: t('app.shell.overview'),
          icon: LayoutDashboard,
          end: true,
        },
        { to: `/tournaments/${tournament.id}/players`, label: t('app.shell.players'), icon: Users },
        {
          to: `/tournaments/${tournament.id}/rounds`,
          label: t('app.shell.rounds'),
          icon: ClipboardList,
        },
        {
          to: `/tournaments/${tournament.id}/standings`,
          label: t('app.shell.standings'),
          compactLabel: t('app.shell.standingsShort'),
          icon: Trophy,
        },
        {
          to: `/tournaments/${tournament.id}/statistics`,
          label: t('app.shell.statistics'),
          compactLabel: t('app.shell.statisticsShort'),
          icon: BarChart3,
        },
        {
          to: `/tournaments/${tournament.id}/settings`,
          label: t('app.shell.settingsAndInvitations'),
          compactLabel: t('app.shell.settingsShort'),
          icon: Settings,
        },
      ]
    : [];
  const sidebarItems = tournamentItems.length ? tournamentItems : globalItems;
  const mobileItems = tournamentItems.length
    ? tournamentItems
    : globalItems.filter((item) => item.to !== '/perfil');
  const visibleMobileItems = mobileItems.filter((item): item is NavigationItem => Boolean(item));

  return (
    <div className={`authenticated-shell${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <aside className="app-sidebar">
        <div className="app-sidebar__header">
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className="app-sidebar__brand"
            aria-label="EDH Tournaments"
            title={sidebarCollapsed ? 'EDH Tournaments' : undefined}
          >
            <img src="/edh-tournaments-icon.svg" alt="" />
            <span aria-hidden={sidebarCollapsed || undefined}>
              EDH <b>Tournaments</b>
            </span>
          </Link>
          <button
            type="button"
            className="app-sidebar__toggle"
            aria-label={t(
              sidebarCollapsed ? 'app.shell.expandNavigation' : 'app.shell.collapseNavigation',
            )}
            aria-pressed={sidebarCollapsed}
            title={t(
              sidebarCollapsed ? 'app.shell.expandNavigation' : 'app.shell.collapseNavigation',
            )}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="app-sidebar__nav-wrap">
          {tournament && <p className="app-sidebar__context-name">{tournament.name}</p>}
          <nav
            aria-label={
              tournament ? t('app.shell.tournamentNavigation') : t('app.shell.navigation')
            }
            className="app-sidebar__nav"
          >
            {sidebarItems.map((item) => (
              <NavigationLink item={item} collapsed={sidebarCollapsed} key={item.to} />
            ))}
          </nav>
        </div>
        <div className="app-sidebar__bottom">
          <div className="app-sidebar__language">
            <LanguageSelector align="start" direction="up" />
          </div>
          <div className="app-sidebar__footer">
            <Link
              to="/perfil"
              className="app-sidebar__profile"
              aria-label={sidebarCollapsed ? profile.name : undefined}
              title={sidebarCollapsed ? profile.name : undefined}
            >
              <span aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span>
              <strong>{profile.name}</strong>
            </Link>
            <div className="app-sidebar__footer-actions">
              <button
                type="button"
                className="app-sidebar__signout"
                aria-label={sidebarCollapsed ? t('app.shell.signOut') : undefined}
                title={sidebarCollapsed ? t('app.shell.signOut') : undefined}
                onClick={leaveSession}
              >
                <LogOut aria-hidden="true" />
                <span aria-hidden={sidebarCollapsed || undefined}>{t('app.shell.signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className={`authenticated-shell__main ${wide ? 'is-wide' : ''}`}>{children}</main>
      <nav
        aria-label={t(tournament ? 'app.shell.tournamentNavigation' : 'app.shell.mobileNavigation')}
        className={`app-mobile-nav${tournament ? ' is-tournament-navigation' : ''}`}
      >
        {visibleMobileItems.map((item) => (
          <NavigationLink item={item} compact key={item.to} />
        ))}
        <button
          type="button"
          className="app-sidebar__link app-mobile-nav__account"
          aria-controls="mobile-account-actions"
          aria-expanded={mobileAccountOpen}
          onClick={() => setMobileAccountOpen((open) => !open)}
        >
          <CircleUserRound aria-hidden="true" />
          <span>{t('app.shell.account')}</span>
        </button>
      </nav>
      {mobileAccountOpen && (
        <section
          id="mobile-account-actions"
          className="app-mobile-account"
          aria-label={t('app.shell.account')}
        >
          <Link
            to="/perfil"
            className="app-mobile-account__profile"
            onClick={() => setMobileAccountOpen(false)}
          >
            <span className="app-mobile-account__avatar" aria-hidden="true">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="app-mobile-account__identity">
              <small>{t('app.shell.profile')}</small>
              <strong>{profile.name}</strong>
            </span>
            <CircleUserRound aria-hidden="true" />
          </Link>
          <div className="app-mobile-account__utilities">
            <LanguageSelector align="end" direction="up" />
            <button type="button" className="app-sidebar__signout" onClick={leaveSession}>
              <LogOut aria-hidden="true" />
              <span>{t('app.shell.signOut')}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
