import { useEffect, useState, type FormEvent } from 'react';
import { type AssignableRole } from '@/data/adminRepository';
import {
  listManagedUserLoginHistory,
  updateManagedUser,
  type LoginAccess,
  type ManagedUser,
} from '@/data/adminUsersRepository';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import i18n from '@/i18n';

import { displayDateTime } from '@/features/admin/adminFormat';
import { field, primary } from '@/components/ui/classes';

export function UserProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: ManagedUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginAccess[]>();
  const [loginHistoryError, setLoginHistoryError] = useState<string>();
  useEffect(() => {
    let active = true;
    void listManagedUserLoginHistory(user.id)
      .then((accesses) => {
        if (active) setLoginHistory(accesses);
      })
      .catch((reason) => {
        if (active)
          setLoginHistoryError(
            reason instanceof Error
              ? reason.message
              : i18n.t('app.admin.profile.loadHistoryFailed'),
          );
      });
    return () => {
      active = false;
    };
  }, [user.id]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await updateManagedUser(user.id, {
        displayName: String(form.get('displayName')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')) || undefined,
        role: String(form.get('role')) as AssignableRole,
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.profile.updateFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={i18n.t('app.admin.profile.title', { name: user.displayName })}
      description={i18n.t('app.admin.profile.description')}
      onClose={onClose}
    >
      <form onSubmit={save} className="space-y-4">
        {error && <p className="text-sm text-red-300">{error}</p>}
        <label className="block text-sm font-medium">
          {i18n.t('app.common.name')}
          <input required name="displayName" defaultValue={user.displayName} className={field} />
        </label>
        <label className="block text-sm font-medium">
          {i18n.t('app.common.email')}
          <input required name="email" type="email" defaultValue={user.email} className={field} />
        </label>
        <label className="block text-sm font-medium">
          {i18n.t('app.admin.profile.newPassword')}
          <input name="password" minLength={6} type="password" className={field} />
        </label>
        <label className="block text-sm font-medium">
          {i18n.t('app.admin.accounts.role')}
          <select
            name="role"
            defaultValue={
              user.role === 'admin' ? 'admin' : user.role === 'player' ? 'player' : 'organizer'
            }
            className={field}
          >
            <option value="player">{i18n.t('app.admin.roles.player')}</option>
            <option value="organizer">{i18n.t('app.admin.roles.organizer')}</option>
            <option value="admin">{i18n.t('app.admin.roles.admin')}</option>
          </select>
        </label>
        <section className="border-t border-slate-700 pt-4">
          <h3 className="font-semibold">{i18n.t('app.admin.profile.loginHistory')}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {i18n.t('app.admin.profile.superAdminOnly')}
          </p>
          {!loginHistory && !loginHistoryError && (
            <p className="mt-3 text-sm text-muted-foreground">
              {i18n.t('app.admin.profile.loadingHistory')}
            </p>
          )}
          {loginHistoryError && <p className="mt-3 text-sm text-red-300">{loginHistoryError}</p>}
          {loginHistory && loginHistory.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {i18n.t('app.admin.profile.noHistory')}
            </p>
          )}
          {loginHistory && loginHistory.length > 0 && (
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {loginHistory.map((access, index) => (
                <article
                  key={`${access.accessedAt}-${access.maskedIp}-${index}`}
                  className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{displayDateTime(access.accessedAt)}</strong>
                    <span className="font-mono text-xs text-slate-400">{access.maskedIp}</span>
                  </div>
                  <p className="mt-1 truncate text-slate-300" title={access.location}>
                    {access.location}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {access.browser} / {access.operatingSystem} · {access.deviceType}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="app-button app-button--secondary"
            onClick={onClose}
          >
            {i18n.t('app.common.cancel')}
          </Button>
          <Button disabled={busy} className={primary}>
            {busy ? i18n.t('app.admin.profile.saving') : i18n.t('app.admin.profile.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
