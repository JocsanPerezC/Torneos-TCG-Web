import { type AppRole } from '@/data/adminRepository';
import { type LoginAccess } from '@/data/adminUsersRepository';
import i18n from '@/i18n';

export const displayDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(i18n.language.startsWith('en') ? 'en-US' : 'es-CR', {
        dateStyle: 'medium',
      }).format(date);
};
export const displayDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? i18n.t('app.admin.noRecords')
    : new Intl.DateTimeFormat(i18n.language.startsWith('en') ? 'en-US' : 'es-CR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
};
export const accessOrigin = (access: LoginAccess) =>
  `${access.location} · ${access.browser} / ${access.operatingSystem}`;
export const roleLabel = (role: AppRole) => i18n.t(`app.admin.roles.${role}`);
