import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { type AssignableRole } from '@/data/adminRepository';
import {
  listManagedUserLoginHistory,
  updateManagedUser,
  type LoginAccess,
  type ManagedUser,
} from '@/data/adminUsersRepository';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/Avatar';
import { isValidEmail } from '@/lib/authValidation';
import { NICKNAME_MAX_LENGTH, normalizeNickname } from '@/lib/userProfile';
import i18n from '@/i18n';

import { displayDateTime } from '@/features/admin/adminFormat';
import { field, primary } from '@/components/ui/classes';

type Field = 'displayName' | 'nickname' | 'email' | 'password' | 'avatar';
type Errors = Partial<Record<Field, string>>;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Revisa cada campo y devuelve la clave de i18n del problema de cada uno. */
function validate(form: FormData): Errors {
  const errors: Errors = {};
  if (!String(form.get('displayName')).trim()) errors.displayName = 'app.auth.errors.required';
  const nickname = String(form.get('nickname'));
  if (!nickname.trim()) errors.nickname = 'app.auth.errors.required';
  else if (!normalizeNickname(nickname)) errors.nickname = 'app.auth.nicknameInvalid';
  const email = String(form.get('email'));
  if (!email.trim()) errors.email = 'app.auth.errors.required';
  else if (!isValidEmail(email)) errors.email = 'app.auth.errors.emailInvalid';
  const password = String(form.get('password'));
  if (password && password.length < 6) errors.password = 'app.auth.errors.passwordShort';
  return errors;
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File>();
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl ?? undefined);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
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
  const previewUrl = useRef<string>(undefined);
  const setPreviewFile = (file?: File) => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = file ? URL.createObjectURL(file) : undefined;
    setAvatarFile(file);
    setAvatarPreview(previewUrl.current);
  };
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type) || file.size > AVATAR_MAX_BYTES) {
      setErrors((current) => ({ ...current, avatar: 'app.profile.avatarInvalid' }));
      return;
    }
    setErrors((current) => ({ ...current, avatar: undefined }));
    setRemoveAvatar(false);
    setPreviewFile(file);
  };
  const clearAvatar = () => {
    setPreviewFile(undefined);
    setRemoveAvatar(true);
  };

  // Tras el primer intento, cada campo se vuelve a revisar al escribir.
  const recheck = (form: HTMLFormElement, name: string) => {
    if (!(name in errors)) return;
    const next = validate(new FormData(form));
    setErrors((current) => ({ ...current, [name]: next[name as Field] }));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const found = validate(form);
    if (Object.keys(found).length) {
      setErrors(found);
      const first = (['displayName', 'nickname', 'email', 'password'] as const).find(
        (name) => found[name],
      );
      if (first) formElement.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    setError(undefined);
    setBusy(true);
    try {
      await updateManagedUser(user.id, {
        displayName: String(form.get('displayName')).trim(),
        nickname: normalizeNickname(String(form.get('nickname')))!,
        email: String(form.get('email')).trim(),
        password: String(form.get('password')) || undefined,
        role: String(form.get('role')) as AssignableRole,
        ...(avatarFile
          ? { avatar: { data: await readAsBase64(avatarFile), type: avatarFile.type } }
          : {}),
        ...(removeAvatar && user.avatarUrl ? { removeAvatar: true } : {}),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.profile.updateFailed'));
    } finally {
      setBusy(false);
    }
  };
  const textField = (
    name: Exclude<Field, 'avatar'>,
    label: string,
    value: string,
    type: 'text' | 'email' | 'password' = 'text',
  ) => (
    <div>
      <label className="block text-sm font-medium">
        {label}
        <input
          name={name}
          type={type}
          defaultValue={value}
          autoComplete={type === 'password' ? 'new-password' : 'off'}
          maxLength={name === 'nickname' ? NICKNAME_MAX_LENGTH : undefined}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `admin-${name}-error` : undefined}
          className={field}
        />
      </label>
      {errors[name] && (
        <p id={`admin-${name}-error`} className="app-field-error">
          {i18n.t(errors[name])}
        </p>
      )}
    </div>
  );

  return (
    <Modal
      title={i18n.t('app.admin.profile.title', { name: user.displayName })}
      description={i18n.t('app.admin.profile.description')}
      onClose={onClose}
      dialogClassName="sm:max-w-2xl"
    >
      <form
        onSubmit={save}
        noValidate
        onInput={(event) => recheck(event.currentTarget, (event.target as HTMLInputElement).name)}
        className="space-y-4"
      >
        {error && (
          <p role="alert" className="app-field-error">
            {error}
          </p>
        )}
        <div className="admin-avatar-editor">
          <Avatar
            name={user.nickname || user.displayName}
            src={avatarPreview}
            className="admin-avatar-editor__photo"
          />
          <div className="admin-avatar-editor__actions">
            <input
              ref={fileInput}
              type="file"
              accept={AVATAR_TYPES.join(',')}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={chooseAvatar}
            />
            <Button
              type="button"
              variant="outline"
              className="app-button app-button--secondary"
              onClick={() => fileInput.current?.click()}
            >
              {i18n.t('app.profile.changeAvatar')}
            </Button>
            {avatarPreview && (
              <Button
                type="button"
                variant="outline"
                className="app-button app-button--danger"
                onClick={clearAvatar}
              >
                {i18n.t('app.profile.removeAvatar')}
              </Button>
            )}
            {errors.avatar && <p className="app-field-error">{i18n.t(errors.avatar)}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {textField('displayName', i18n.t('app.common.name'), user.displayName)}
          {textField('nickname', i18n.t('app.common.nickname'), user.nickname)}
        </div>
        {textField('email', i18n.t('app.common.email'), user.email, 'email')}
        <div className="grid gap-4 sm:grid-cols-2">
          {textField('password', i18n.t('app.admin.profile.newPassword'), '', 'password')}
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
        </div>
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
