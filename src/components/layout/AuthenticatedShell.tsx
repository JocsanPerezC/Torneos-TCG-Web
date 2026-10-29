import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
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
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../state/AuthContext';
import { getUserProfile } from '../../lib/userProfile';
import { Avatar } from '../ui/Avatar';

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
  const { isAdmin, isPlayer, role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const profile = getUserProfile(user);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        !accountMenuRef.current?.contains(event.target as Node) &&
        !mobileAccountRef.current?.contains(event.target as Node)
      )
        setAccountMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  const leaveSession = () => {
    setAccountMenuOpen(false);
    navigate('/', { replace: true });
    void signOut().catch(() => undefined);
  };

  const generalSettingsItem: NavigationItem = {
    to: '/configuracion',
    label: t('app.shell.settings'),
    compactLabel: t('app.shell.settingsShort'),
    icon: Settings,
  };
  const globalItems: NavigationItem[] = isAdmin
    ? [
        {
          to: '/admin',
          label: t('app.shell.administration'),
          icon: ShieldCheck,
        },
        generalSettingsItem,
      ]
    : isPlayer
      ? [
          {
            to: '/dashboard',
            label: t('app.shell.myTournaments'),
            compactLabel: t('app.shell.tournamentsShort'),
            icon: Trophy,
          },
          {
            to: '/unirse',
            label: t('app.shell.joinTournament'),
            compactLabel: t('app.shell.joinTournamentShort'),
            icon: Swords,
            accent: true,
          },
          {
            to: '/estadisticas',
            label: t('app.shell.myStatistics'),
            compactLabel: t('app.shell.myStatisticsShort'),
            icon: BarChart3,
          },
          generalSettingsItem,
        ]
      : [
          { to: '/dashboard', label: t('app.shell.home'), icon: LayoutDashboard, end: true },
          {
            to: '/dashboard/tournaments',
            label: t('app.shell.myTournaments'),
            compactLabel: t('app.shell.tournamentsShort'),
            icon: Trophy,
          },
          generalSettingsItem,
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
  const sidebarItems = tournamentItems.length
    ? tournamentItems
    : globalItems.filter((item) => item.to !== generalSettingsItem.to);
  const mobileItems = tournamentItems.length
    ? tournamentItems
    : globalItems.filter((item) => item.to !== generalSettingsItem.to);
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
            onClick={() => {
              setAccountMenuOpen(false);
              setSidebarCollapsed((value) => !value);
            }}
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
          <div className="app-sidebar__footer">
            <div className="app-sidebar__account" ref={accountMenuRef}>
              <button
                type="button"
                className={`app-sidebar__profile${accountMenuOpen ? ' is-open' : ''}`}
                aria-controls="sidebar-account-menu"
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
                aria-label={sidebarCollapsed ? profile.name : undefined}
                title={sidebarCollapsed ? profile.name : undefined}
                onClick={() => {
                  if (sidebarCollapsed) {
                    setSidebarCollapsed(false);
                    setAccountMenuOpen(true);
                    return;
                  }
                  setAccountMenuOpen((open) => !open);
                }}
              >
                <Avatar name={profile.name} src={profile.avatarUrl} className="app-sidebar__profile-avatar" />
                <strong>{profile.name}</strong>
                <ChevronDown aria-hidden="true" />
              </button>
              {accountMenuOpen && (
                <div
                  id="sidebar-account-menu"
                  className="app-sidebar__account-menu"
                  aria-label={t('app.shell.account')}
                >
                  <p>{t('app.shell.account')}</p>
                  <span className="app-sidebar__account-role">
                    {t(`app.profile.roles.${role ?? 'organizer'}`)}
                  </span>
                  <Link to="/perfil" onClick={() => setAccountMenuOpen(false)}>
                    <CircleUserRound aria-hidden="true" />
                    {t('app.shell.profile')}
                  </Link>
                  <Link to="/configuracion" onClick={() => setAccountMenuOpen(false)}>
                    <Settings aria-hidden="true" />
                    {t('app.shell.settings')}
                  </Link>
                  <div aria-hidden="true" />
                  <button type="button" onClick={leaveSession}>
                    <LogOut aria-hidden="true" />
                    {t('app.shell.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
      <main className={`authenticated-shell__main ${wide ? 'is-wide' : ''}`}>{children}</main>
      <div className="app-mobile-account-wrap" ref={mobileAccountRef}>
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
            aria-controls="mobile-account-menu"
            aria-expanded={accountMenuOpen}
            onClick={() => setAccountMenuOpen((open) => !open)}
          >
            <CircleUserRound aria-hidden="true" />
            <span>{t('app.shell.account')}</span>
          </button>
        </nav>
        {accountMenuOpen && (
          <section
            id="mobile-account-menu"
            className="app-mobile-account"
            aria-label={t('app.shell.account')}
          >
            <p>{t('app.shell.account')}</p>
            <span className="app-sidebar__account-role">
              {t(`app.profile.roles.${role ?? 'organizer'}`)}
            </span>
            <Link to="/perfil" onClick={() => setAccountMenuOpen(false)}>
              <CircleUserRound aria-hidden="true" />
              {t('app.shell.profile')}
            </Link>
            <Link to="/configuracion" onClick={() => setAccountMenuOpen(false)}>
              <Settings aria-hidden="true" />
              {t('app.shell.settings')}
            </Link>
            <div aria-hidden="true" />
            <button type="button" onClick={leaveSession}>
              <LogOut aria-hidden="true" />
              {t('app.shell.signOut')}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
