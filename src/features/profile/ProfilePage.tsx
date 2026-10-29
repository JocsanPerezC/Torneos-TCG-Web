import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent,
} from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Camera, KeyRound, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getUserProfile } from '../../lib/userProfile';
import { useAuth } from '../../state/AuthContext';
import { Button } from '../../components/ui/button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/modal';
import { deleteCurrentUser } from '../../data/adminUsersRepository';

type CropSelection = { x: number; y: number; size: number };
type CropImageSize = { width: number; height: number };

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function constrainCrop(selection: CropSelection, image: CropImageSize): CropSelection {
  const side = Math.min(image.width, image.height) * selection.size;
  const halfWidth = side / image.width / 2;
  const halfHeight = side / image.height / 2;
  return {
    x: clamp(selection.x, halfWidth, 1 - halfWidth),
    y: clamp(selection.y, halfHeight, 1 - halfHeight),
    size: selection.size,
  };
}

function cropDimensions(size: CropImageSize, selection: CropSelection) {
  const aspect = size.width / size.height;
  const width = aspect >= 1 ? 1 : aspect;
  const height = aspect >= 1 ? 1 / aspect : 1;
  const circle = selection.size * Math.min(width, height);
  return {
    width,
    height,
    circle,
    left: (1 - width) / 2 + selection.x * width - circle / 2,
    top: (1 - height) / 2 + selection.y * height - circle / 2,
  };
}

async function cropAvatar(file: File, selection: CropSelection) {
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = reject;
      nextImage.src = source;
    });
    const side = Math.min(image.naturalWidth, image.naturalHeight) * selection.size;
    const sourceX = image.naturalWidth * selection.x - side / 2;
    const sourceY = image.naturalHeight * selection.y - side / 2;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvas.getContext('2d')?.drawImage(image, sourceX, sourceY, side, side, 0, 0, 512, 512);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.9),
    );
    if (!blob) throw new Error('No se pudo recortar la imagen.');
    return new File([blob], 'avatar.webp', { type: 'image/webp' });
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { configured, loading, user } = useAuth();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File>();
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [candidateAvatar, setCandidateAvatar] = useState<File>();
  const [candidatePreview, setCandidatePreview] = useState<string>();
  const [cropping, setCropping] = useState(false);
  const [cropSelection, setCropSelection] = useState<CropSelection>({ x: 0.5, y: 0.5, size: 0.78 });
  const [cropImageSize, setCropImageSize] = useState<CropImageSize>();
  const [cropDrag, setCropDrag] = useState<{
    pointerId: number;
    x: number;
    y: number;
    selection: CropSelection;
  }>();
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ text: string; error: boolean }>();
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);
  const { name, avatarUrl } = getUserProfile(user);

  useEffect(() => {
    if (removeAvatar || !avatarFile) {
      setAvatarPreview(removeAvatar ? undefined : avatarUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile, avatarUrl, removeAvatar]);

  useEffect(() => {
    if (!candidateAvatar) {
      setCandidatePreview(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(candidateAvatar);
    setCandidatePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [candidateAvatar]);

  if (configured && !loading && !user) return <Navigate to="/login" replace />;
  if (loading || !user)
    return (
      <div className="app-loading-note">
        <i />
        <span>{t('app.common.loading')}</span>
      </div>
    );

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const displayName = String(new FormData(event.currentTarget).get('displayName')).trim();
    if (!displayName || !supabase) return;
    setBusy(true);
    setMessage(undefined);
    try {
      let nextAvatarUrl = removeAvatar ? undefined : avatarUrl;
      if (avatarFile) {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(avatarFile.type) ||
          avatarFile.size > 2 * 1024 * 1024
        )
          throw new Error(t('app.profile.avatarInvalid'));
        const { error: uploadError } = await supabase.storage
          .from('profile-avatars')
          .upload(`${user.id}/avatar`, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('profile-avatars').getPublicUrl(`${user.id}/avatar`);
        nextAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      } else if (removeAvatar) {
        const { error: removeError } = await supabase.storage
          .from('profile-avatars')
          .remove([`${user.id}/avatar`]);
        if (removeError) throw removeError;
      }
      const [{ error: profileError }, { error: authError }] = await Promise.all([
        supabase
          .from('profiles')
          .update({ display_name: displayName, avatar_url: nextAvatarUrl ?? null })
          .eq('id', user.id),
        supabase.auth.updateUser({
          data: { display_name: displayName, avatar_url: nextAvatarUrl },
        }),
      ]);
      if (profileError) throw profileError;
      if (authError) throw authError;
      setMessage(t('app.profile.saved'));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : t('app.profile.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    if (!file) return;
    setCandidateAvatar(file);
    setCropSelection({ x: 0.5, y: 0.5, size: 0.78 });
    setCropImageSize(undefined);
    setCropping(true);
    event.target.value = '';
  };

  const persistAvatar = async (file: File) => {
    if (!supabase) return;
    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(`${user.id}/avatar`, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('profile-avatars').getPublicUrl(`${user.id}/avatar`);
    const nextAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase.from('profiles').update({ avatar_url: nextAvatarUrl }).eq('id', user.id),
      supabase.auth.updateUser({ data: { avatar_url: nextAvatarUrl } }),
    ]);
    if (profileError) throw profileError;
    if (authError) throw authError;
    setMessage(t('app.profile.avatarSaved'));
  };

  const confirmCrop = async () => {
    if (!candidateAvatar) return;
    setAvatarSaving(true);
    try {
      const file = await cropAvatar(candidateAvatar, cropSelection);
      setAvatarFile(file);
      setRemoveAvatar(false);
      setCropping(false);
      await persistAvatar(file);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : t('app.profile.avatarInvalid'));
    } finally {
      setAvatarSaving(false);
    }
  };

  const moveCrop = (event: PointerEvent<HTMLDivElement>) => {
    if (!cropDrag || event.pointerId !== cropDrag.pointerId || !cropImageSize) return;
    const frame = cropFrameRef.current;
    if (!frame) return;
    const dimensions = cropDimensions(cropImageSize, cropDrag.selection);
    const bounds = frame.getBoundingClientRect();
    setCropSelection(
      constrainCrop(
        {
          ...cropDrag.selection,
          x: cropDrag.selection.x + (event.clientX - cropDrag.x) / bounds.width / dimensions.width,
          y:
            cropDrag.selection.y + (event.clientY - cropDrag.y) / bounds.height / dimensions.height,
        },
        cropImageSize,
      ),
    );
  };

  const cropPreview = cropImageSize ? cropDimensions(cropImageSize, cropSelection) : undefined;

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteCurrentUser(deleteConfirmation);
      await supabase?.auth.signOut();
      navigate('/', { replace: true });
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : t('app.profile.deleteFailed'));
      setDeleting(false);
    }
  };

  const openDelete = () => {
    setDeleteConfirmation('');
    setDeleteError(undefined);
    setDeleteOpen(true);
  };

  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers
    : [user.app_metadata.provider];
  const isGoogleOnly = providers.includes('google') && !providers.includes('email');

  const changePassword = async () => {
    if (!supabase) return;
    if (newPassword.length < 6) {
      setPasswordFeedback({ text: t('app.profile.passwordTooShort'), error: true });
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setPasswordFeedback({ text: t('app.profile.passwordsMismatch'), error: true });
      return;
    }
    setPasswordBusy(true);
    setPasswordFeedback(undefined);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      setPasswordFeedback({ text: t('app.profile.passwordUpdated'), error: false });
    } catch (reason) {
      setPasswordFeedback({
        text: reason instanceof Error ? reason.message : t('app.profile.passwordFailed'),
        error: true,
      });
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl app-panel">
      <BadgeCheck className="text-accent" aria-hidden="true" />
      <h1 className="mt-4 text-3xl">{t('app.profile.title')}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('app.profile.description')}</p>
      <form className="mt-6 space-y-4" onSubmit={save}>
        <div className="profile-avatar-editor">
          <div className="profile-avatar-editor__photo">
            <Avatar name={name} src={avatarPreview} className="profile-avatar" />
            <label className="profile-avatar-editor__change">
              <Camera aria-hidden="true" />
              <span>{t('app.profile.changeAvatar')}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} />
            </label>
            {avatarPreview && (
              <button
                type="button"
                className="profile-avatar-editor__remove"
                aria-label={t('app.profile.removeAvatar')}
                title={t('app.profile.removeAvatar')}
                onClick={() => {
                  setAvatarFile(undefined);
                  setRemoveAvatar(true);
                }}
              >
                <Trash2 aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <label className="block text-sm font-semibold">
          {t('app.common.name')}
          <input required name="displayName" defaultValue={name} className="app-field" />
        </label>
        <label className="block text-sm font-semibold">
          {t('app.common.email')}
          <input readOnly value={user.email ?? ''} className="app-field" />
        </label>
        <section
          className="rounded-xl border border-border bg-secondary/50 p-4"
          aria-labelledby="password-title"
        >
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-accent" aria-hidden="true" />
            <h2 id="password-title" className="font-bold">
              {t('app.profile.passwordTitle')}
            </h2>
          </div>
          {isGoogleOnly ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('app.profile.googlePasswordDescription')}
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              <label className="block text-sm font-semibold">
                {t('app.profile.currentPassword')}
                <input
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="app-field"
                />
              </label>
              <label className="block text-sm font-semibold">
                {t('app.profile.newPassword')}
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  className="app-field"
                />
              </label>
              <label className="block text-sm font-semibold">
                {t('app.profile.confirmNewPassword')}
                <input
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  className="app-field"
                />
              </label>
              {passwordFeedback && (
                <p
                  role={passwordFeedback.error ? 'alert' : 'status'}
                  className={`text-sm font-semibold ${passwordFeedback.error ? 'text-red-700' : 'text-accent'}`}
                >
                  {passwordFeedback.text}
                </p>
              )}
              <div>
                <Button
                  type="button"
                  disabled={
                    passwordBusy || !currentPassword || !newPassword || !passwordConfirmation
                  }
                  className="app-button app-button--primary"
                  onClick={() => void changePassword()}
                >
                  {passwordBusy
                    ? t('app.profile.changingPassword')
                    : t('app.profile.changePassword')}
                </Button>
              </div>
            </div>
          )}
        </section>
        {message && (
          <p role="status" className="text-sm font-semibold text-muted-foreground">
            {message}
          </p>
        )}
        <Button disabled={busy} className="app-button app-button--primary">
          {busy ? t('app.profile.saving') : t('app.common.save')}
        </Button>
        <section className="profile-danger-zone" aria-labelledby="delete-account-title">
          <div>
            <h2 id="delete-account-title">{t('app.profile.deleteTitle')}</h2>
            <p>{t('app.profile.deleteDescription')}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="app-button app-button--danger"
            onClick={openDelete}
          >
            {t('app.profile.deleteAction')}
          </Button>
        </section>
      </form>
      {cropping && candidateAvatar && candidatePreview && (
        <Modal
          title={t('app.profile.cropAvatarTitle')}
          description={t('app.profile.cropAvatarDescription')}
          dialogClassName="profile-avatar-crop-dialog"
          onClose={() => setCropping(false)}
        >
          <div
            ref={cropFrameRef}
            className={`profile-avatar-crop-preview${cropDrag ? ' is-dragging' : ''}`}
          >
            <img
              src={candidatePreview}
              alt=""
              draggable={false}
              onLoad={(event) =>
                setCropImageSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
              style={
                cropPreview
                  ? {
                      width: `${cropPreview.width * 100}%`,
                      height: `${cropPreview.height * 100}%`,
                      left: `${(1 - cropPreview.width) * 50}%`,
                      top: `${(1 - cropPreview.height) * 50}%`,
                    }
                  : undefined
              }
            />
            {cropPreview && (
              <div
                className={`profile-avatar-crop-selection${cropDrag ? ' is-dragging' : ''}`}
                style={{
                  width: `${cropPreview.circle * 100}%`,
                  height: `${cropPreview.circle * 100}%`,
                  left: `${cropPreview.left * 100}%`,
                  top: `${cropPreview.top * 100}%`,
                }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setCropDrag({
                    pointerId: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    selection: cropSelection,
                  });
                }}
                onPointerMove={moveCrop}
                onPointerUp={() => setCropDrag(undefined)}
                onPointerCancel={() => setCropDrag(undefined)}
              />
            )}
          </div>
          <label className="mt-4 block text-sm font-semibold">
            {t('app.profile.cropSize')}
            <input
              className="profile-avatar-crop-zoom"
              type="range"
              min="0.25"
              max="1"
              step="0.05"
              value={cropSelection.size}
              onChange={(event) => {
                const size = Number(event.target.value);
                setCropSelection((selection) =>
                  cropImageSize
                    ? constrainCrop({ ...selection, size }, cropImageSize)
                    : { ...selection, size },
                );
              }}
            />
          </label>
          <p className="mt-2 text-sm text-muted-foreground">{t('app.profile.cropAvatarHelp')}</p>
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setCropping(false)}>
              {t('app.common.cancel')}
            </Button>
            <Button
              type="button"
              className="app-button app-button--primary"
              disabled={avatarSaving}
              onClick={() => void confirmCrop()}
            >
              {avatarSaving ? t('app.profile.saving') : t('app.profile.savePhoto')}
            </Button>
          </div>
        </Modal>
      )}
      {deleteOpen && (
        <Modal
          title={t('app.profile.deleteTitle')}
          description={t('app.profile.deleteConfirm')}
          onClose={closeDelete}
        >
          {deleteError && (
            <p role="alert" className="mb-4 text-sm font-semibold text-red-700">
              {deleteError}
            </p>
          )}
          <label className="block text-sm font-semibold">
            {t('app.profile.deleteTypeConfirmStart')}{' '}
            <span className="profile-delete-keyword">ELIMINAR</span>{' '}
            {t('app.profile.deleteTypeConfirmEnd')}
            <input
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              className="app-field"
              autoComplete="off"
            />
          </label>
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeDelete} disabled={deleting}>
              {t('app.common.cancel')}
            </Button>
            <Button
              type="button"
              className="app-button app-button--danger"
              onClick={() => void deleteAccount()}
              disabled={deleting || deleteConfirmation !== 'ELIMINAR'}
            >
              {deleting ? t('app.profile.deleting') : t('app.profile.deleteAction')}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
