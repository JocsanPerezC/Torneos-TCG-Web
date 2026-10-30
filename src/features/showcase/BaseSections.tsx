import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CircleAlert, Layers3, Plus, Trash2 } from 'lucide-react';
import { Accordion, AccordionItem } from '../../components/ui/accordion';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { Modal } from '../../components/ui/modal';
import { showToast } from '../../components/ui/toast';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { GoogleAuthButton } from '../auth/components/GoogleAuthButton';
import { Notice } from '../../components/feedback/Notice';
import { ConfirmModal } from '../../components/feedback/ConfirmModal';
import { AccountLock } from '../trial/components/AccountLock';
import { AvatarStack, EmptyMark } from '../tournaments/components/BattleGlyphs';
import { ShowcaseSection, Variant } from './ShowcaseSection';
import { showcasePlayers } from './fixtures';

const tokens = [
  ['--background', '#fcfaec'],
  ['--foreground', '#111111'],
  ['--card', '#ffffff'],
  ['--primary', '#21b876'],
  ['--primary-foreground', '#ffffff'],
  ['--secondary / --muted', '#f2f0e5'],
  ['--muted-foreground', '#6b675c'],
  ['--accent / --blue', '#3d5afb'],
  ['--border', '#e7e2d2'],
  ['--violet', '#5b1fe0'],
  ['--red', '#c1272d'],
  ['--ink-soft', '#514d45'],
  ['--primary-strong', '#168050'],
  ['--primary-hover', '#1b9563'],
  ['--danger-text', '#a44840'],
  ['--border-strong', '#ded6c5'],
  ['--paper', '#fffdf7'],
  ['--highlight', '#fff6cb'],
  ['--accent-soft', '#e9edff'],
  ['--violet-soft', '#eee9ff'],
  ['--success-soft', '#e5f7ec'],
] as const;

// Escala de src/styles/base.css (ver docs/design-system.md).
const radii = ['--app-radius-sm', '--app-radius-md', '--app-radius-lg', '--app-radius-pill'];
const shadows = ['--app-shadow-sm', '--app-shadow-md', '--app-shadow-lg'];

export function FoundationsSection() {
  const { t } = useTranslation();
  const sample = t('app.showcase.typeSample');
  return (
    <ShowcaseSection
      id="foundations"
      titleKey="app.showcase.foundations"
      sources={['src/styles/base.css', 'docs/design-system.md']}
    >
      <Variant label={t('app.showcase.tokens')}>
        <ul className="showcase-swatches">
          {tokens.map(([name, hex]) => (
            <li key={name}>
              <span style={{ background: hex }} />
              <code>{name}</code>
              <small>{hex}</small>
            </li>
          ))}
        </ul>
      </Variant>
      <Variant label={t('app.showcase.typography')}>
        <div className="grid gap-3">
          <h1 className="m-0 text-5xl leading-none">h1 · {sample}</h1>
          <h2 className="m-0 text-3xl">h2 · {sample}</h2>
          <h3 className="m-0 text-xl">h3 · {sample}</h3>
          <h4 className="m-0 text-base">h4 · {sample}</h4>
          <p className="m-0">body · {sample}</p>
          <small className="text-xs text-muted-foreground">small · {sample}</small>
          <p className="showcase-eyebrow">eyebrow · {sample}</p>
          <code className="font-mono text-xs">mono · src/app/AppRouter.tsx</code>
        </div>
      </Variant>
      <div className="grid gap-5 md:grid-cols-2">
        <Variant label={t('app.showcase.radii')}>
          <ul className="showcase-shapes">
            {radii.map((radius) => (
              <li key={radius}>
                <span style={{ borderRadius: `var(${radius})` }} />
                <code>{radius}</code>
              </li>
            ))}
          </ul>
        </Variant>
        <Variant label={t('app.showcase.shadows')}>
          <ul className="showcase-shapes">
            {shadows.map((shadow) => (
              <li key={shadow}>
                <span style={{ boxShadow: `var(${shadow})` }} />
                <code>{shadow}</code>
              </li>
            ))}
          </ul>
        </Variant>
      </div>
    </ShowcaseSection>
  );
}

export function ButtonsSection() {
  const { t } = useTranslation();
  return (
    <ShowcaseSection
      id="buttons"
      titleKey="app.showcase.buttons"
      sources={[
        'Button · src/components/ui/button.tsx',
        '.app-button · src/styles/app-tools.css',
        'GoogleAuthButton · src/features/auth/components/GoogleAuthButton.tsx',
      ]}
    >
      <Variant label=".app-button">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="app-button app-button--primary"
            onClick={() => showToast(t('app.showcase.toastMessage'))}
          >
            {t('app.showcase.primary')}
          </Button>
          <Button type="button" variant="outline" className="app-button app-button--secondary">
            {t('app.showcase.secondary')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="app-button app-button--danger"
            onClick={() => showToast(t('app.showcase.dangerMessage'), true)}
          >
            {t('app.showcase.danger')}
          </Button>
          <Button type="button" disabled className="app-button">
            {t('app.showcase.disabled')}
          </Button>
          <Button type="button" className="app-button app-button--primary">
            <Plus size={16} aria-hidden="true" />
            {t('app.showcase.withIcon')}
          </Button>
          <Button type="button" variant="outline" className="app-button app-button--danger">
            <Trash2 size={16} aria-hidden="true" />
            {t('app.showcase.withIcon')}
          </Button>
        </div>
        <p className="showcase-note">{t('app.showcase.noGhostAppButton')}</p>
      </Variant>
      <Variant label="Button · variant">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button">default</Button>
          <Button type="button" variant="outline">
            outline
          </Button>
          <Button type="button" variant="ghost">
            ghost
          </Button>
          <Button type="button" disabled>
            {t('app.showcase.disabled')}
          </Button>
        </div>
      </Variant>
      <Variant label="Button · size">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm">
            sm
          </Button>
          <Button type="button">default</Button>
          <Button type="button" size="lg">
            lg
          </Button>
        </div>
        <Button type="button" className="app-button app-button--primary mt-3 w-full">
          w-full
        </Button>
      </Variant>
      <Variant label="GoogleAuthButton">
        <div className="max-w-sm">
          <GoogleAuthButton
            requiresConsent
            onConsentRequired={() => showToast(t('app.showcase.googleConsent'))}
          />
        </div>
      </Variant>
    </ShowcaseSection>
  );
}

export function FieldsSection() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast(t('app.showcase.formSaved'));
  };
  return (
    <ShowcaseSection
      id="fields"
      titleKey="app.showcase.fields"
      sources={[
        '.app-field · src/styles/app-tools.css',
        'FormLimits · src/components/FormLimits.tsx',
      ]}
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submitForm}>
        <label className="text-sm font-semibold">
          {t('app.common.name')}
          <input
            className="app-field"
            name="name"
            placeholder={t('app.showcase.namePlaceholder')}
          />
        </label>
        <label className="text-sm font-semibold">
          {t('app.showcase.format')}
          <select className="app-field" name="format" defaultValue="">
            <option value="" disabled>
              {t('app.showcase.selectOption')}
            </option>
            <option>{t('app.showcase.commander')}</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t('app.showcase.textarea')}
          <textarea
            className="app-field"
            name="names"
            rows={3}
            placeholder={t('app.showcase.textareaPlaceholder')}
          />
        </label>
        <label className="text-sm font-semibold">
          {t('app.showcase.number')}
          <input className="app-field" name="rounds" type="number" defaultValue={3} />
        </label>
        <label className="text-sm font-semibold">
          {t('app.showcase.withError')}
          <input
            className="app-field"
            name="displayName"
            required
            aria-invalid="true"
            defaultValue=""
          />
          <span className="showcase-note">{t('app.showcase.noErrorStyle')}</span>
        </label>
        <label className="text-sm font-semibold">
          {t('app.showcase.disabled')}
          <input className="app-field" disabled defaultValue={t('app.showcase.namePlaceholder')} />
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          {t('app.showcase.limits')}
          <input
            className="app-field"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <span className="showcase-note">
            {t('app.showcase.limitsHint', { count: name.length, max: 80 })}
          </span>
        </label>
        <Button className="app-button app-button--primary w-fit" type="submit">
          {t('app.common.save')}
        </Button>
      </form>
    </ShowcaseSection>
  );
}

export function BadgesSection() {
  const { t } = useTranslation();
  return (
    <ShowcaseSection
      id="badges"
      titleKey="app.showcase.statuses"
      sources={['Badge · src/components/ui/Badge.tsx', '.app-badge · src/styles/app-tools.css']}
    >
      <Variant label="Badge" source="src/components/ui/Badge.tsx">
        <div className="flex flex-wrap gap-3">
          {['borrador', 'activa', 'completada', 'activo', 'finalizado', 'desconocido'].map(
            (status) => (
              <Badge key={status}>{status}</Badge>
            ),
          )}
        </div>
      </Variant>
      <Variant
        label={t('app.showcase.inlineBadges')}
        source="src/features/showcase/ComponentShowcasePage.tsx (antes)"
        duplicate
      >
        <div className="flex flex-wrap gap-3">
          <span className="app-badge border border-[#E7E2D2] bg-[#F4F1E7] text-muted-foreground">
            {t('app.common.draft')}
          </span>
          <span className="app-badge border border-[#BDE8CC] bg-[#E5F7EC] text-[#168050]">
            {t('app.common.activeStatus')}
          </span>
          <span className="app-badge border border-[#D6DEFF] bg-[#E9EDFF] text-[#3D5AFB]">
            {t('app.common.completed')}
          </span>
          <span className="app-badge border border-[#DDD0FF] bg-[#F0E9FF] text-[#5B1FE0]">
            {t('app.common.finished')}
          </span>
        </div>
      </Variant>
    </ShowcaseSection>
  );
}

export function FeedbackSection() {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<{ message: string; error: boolean }>();
  const [modal, setModal] = useState<'modal' | 'confirm' | 'destructive'>();
  return (
    <ShowcaseSection
      id="feedback"
      titleKey="app.showcase.feedback"
      sources={[
        'Notice · src/components/feedback/Notice.tsx',
        'ConfirmModal · src/components/feedback/ConfirmModal.tsx',
        'Modal · src/components/ui/modal.tsx',
        'showToast · src/components/ui/toast.tsx',
        'EmptyMark · src/features/tournaments/components/BattleGlyphs.tsx',
        'AccountLock · src/features/trial/components/AccountLock.tsx',
      ]}
    >
      <Variant label="showToast · Notice">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => showToast(t('app.showcase.toastMessage'))}
          >
            <Bell size={16} aria-hidden="true" />
            {t('app.showcase.showToast')}
          </Button>
          <Button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => showToast(t('app.showcase.dangerMessage'), true)}
          >
            {t('app.showcase.showErrorToast')}
          </Button>
          <Button
            type="button"
            className="app-button app-button--secondary"
            onClick={() =>
              setNotice({
                message: `${t('app.showcase.noticeMessage')} · ${Date.now() % 1000}`,
                error: false,
              })
            }
          >
            Notice
          </Button>
          <Button
            type="button"
            className="app-button app-button--secondary"
            onClick={() =>
              setNotice({
                message: `${t('app.showcase.dangerMessage')} · ${Date.now() % 1000}`,
                error: true,
              })
            }
          >
            Notice error
          </Button>
        </div>
        <p className="showcase-note">{t('app.showcase.noticeHint')}</p>
        {notice && <Notice error={notice.error}>{notice.message}</Notice>}
      </Variant>
      <Variant label="Modal · ConfirmModal">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => setModal('modal')}
          >
            <Layers3 size={16} aria-hidden="true" />
            {t('app.showcase.openModal')}
          </Button>
          <Button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => setModal('confirm')}
          >
            ConfirmModal
          </Button>
          <Button
            type="button"
            variant="outline"
            className="app-button app-button--danger"
            onClick={() => setModal('destructive')}
          >
            ConfirmModal · destructive
          </Button>
        </div>
      </Variant>
      <div className="grid gap-5 md:grid-cols-2">
        <Variant label=".app-empty-state">
          <div className="app-empty-state">
            <span>
              <CircleAlert aria-hidden="true" />
            </span>
            <p>{t('app.showcase.emptyState')}</p>
          </div>
        </Variant>
        <Variant label="EmptyMark" source="BattleGlyphs.tsx" duplicate>
          <EmptyMark message={t('app.showcase.emptyState')} />
        </Variant>
      </div>
      <Variant label="AccountLock" source="src/features/trial/components/AccountLock.tsx">
        <AccountLock
          title={t('landing.trial.statisticsTitle')}
          description={t('landing.trial.statisticsLocked')}
        />
      </Variant>
      {modal === 'modal' && (
        <Modal
          title={t('app.showcase.modalTitle')}
          description={t('app.showcase.modalDescription')}
          onClose={() => setModal(undefined)}
        >
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            {t('app.showcase.modalContent')}
          </p>
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              className="app-button app-button--primary"
              onClick={() => setModal(undefined)}
            >
              {t('app.common.close')}
            </Button>
          </div>
        </Modal>
      )}
      {(modal === 'confirm' || modal === 'destructive') && (
        <ConfirmModal
          title={t(
            modal === 'destructive'
              ? 'app.showcase.confirmDeleteTitle'
              : 'app.showcase.confirmTitle',
          )}
          description={t('app.showcase.confirmDescription')}
          confirmLabel={modal === 'destructive' ? t('app.common.delete') : undefined}
          destructive={modal === 'destructive'}
          onClose={() => setModal(undefined)}
          onConfirm={() => setModal(undefined)}
        />
      )}
    </ShowcaseSection>
  );
}

export function ContainersSection() {
  const { t } = useTranslation();
  return (
    <ShowcaseSection
      id="containers"
      titleKey="app.showcase.containers"
      sources={[
        'Card · src/components/ui/card.tsx',
        '.app-panel · src/styles/app-tools.css',
        'Accordion · src/components/ui/accordion.tsx',
      ]}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Variant label="Card">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('app.showcase.cardTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {t('app.showcase.cardDescription')}
            </CardContent>
          </Card>
        </Variant>
        <Variant label={t('app.showcase.cardAsPanel')} duplicate>
          <Card className="border-[1.5px] border-[#DED6C5] bg-[#FFFDF7] shadow-[4px_5px_0_rgba(17,17,17,.07)]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-accent">
                <Layers3 size={18} aria-hidden="true" />
                <CardTitle>{t('app.showcase.cardTitle')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {t('app.showcase.cardDescription')}
            </CardContent>
          </Card>
        </Variant>
        <Variant label=".app-panel">
          <div className="app-panel">
            <strong>{t('app.showcase.cardTitle')}</strong>
            <p className="mb-0 mt-2 text-sm text-muted-foreground">
              {t('app.showcase.cardDescription')}
            </p>
          </div>
        </Variant>
        <Variant label=".app-panel--sheet">
          <div className="app-panel app-panel--sheet">
            <strong>{t('app.showcase.cardTitle')}</strong>
          </div>
          <p className="showcase-note">
            {t('app.showcase.missingClass', { name: 'app-panel--sheet' })}
          </p>
        </Variant>
      </div>
      <Variant label="Accordion">
        <Accordion>
          <AccordionItem title={t('app.showcase.accordionFirst')}>
            {t('app.showcase.accordionFirstDescription')}
          </AccordionItem>
          <AccordionItem title={t('app.showcase.accordionSecond')}>
            {t('app.showcase.accordionSecondDescription')}
          </AccordionItem>
        </Accordion>
        <p className="showcase-note">{t('app.showcase.missingClass', { name: 'ds-accordion' })}</p>
      </Variant>
    </ShowcaseSection>
  );
}

export function IdentitySection() {
  const { t } = useTranslation();
  return (
    <ShowcaseSection
      id="identity"
      titleKey="app.showcase.identity"
      sources={[
        'Avatar · src/components/ui/Avatar.tsx',
        'AvatarStack · src/features/tournaments/components/BattleGlyphs.tsx',
        'LanguageSelector · src/components/ui/LanguageSelector.tsx',
      ]}
    >
      <Variant label="Avatar">
        <div className="flex flex-wrap items-end gap-5">
          <figure className="showcase-inline">
            <Avatar name="Ana" src="/default-avatar.svg" className="standings-table__avatar" />
            <figcaption>{t('app.showcase.withImage')}</figcaption>
          </figure>
          <figure className="showcase-inline">
            <Avatar name="Bruno" className="standings-table__avatar" />
            <figcaption>{t('app.showcase.initials')}</figcaption>
          </figure>
          <figure className="showcase-inline">
            <Avatar name="Carla" src="/no-existe.png" className="standings-table__avatar" />
            <figcaption>{t('app.showcase.brokenImage')}</figcaption>
          </figure>
          <figure className="showcase-inline">
            <Avatar name="Diego" className="player-slip__avatar" />
            <figcaption>player-slip__avatar</figcaption>
          </figure>
          <figure className="showcase-inline">
            <Avatar name="Elena" className="app-sidebar__profile-avatar" />
            <figcaption>app-sidebar__profile-avatar</figcaption>
          </figure>
        </div>
        <p className="showcase-note">{t('app.showcase.avatarSizes')}</p>
      </Variant>
      <Variant label="AvatarStack" source="BattleGlyphs.tsx">
        <div className="flex flex-wrap gap-6">
          <AvatarStack players={showcasePlayers.slice(0, 2)} />
          <AvatarStack players={showcasePlayers} />
        </div>
      </Variant>
      <Variant label="LanguageSelector">
        <div className="flex flex-wrap items-center gap-4 pb-28">
          <LanguageSelector />
          <LanguageSelector compact />
          <LanguageSelector align="start" />
          <LanguageSelector align="end" compact />
          <LanguageSelector direction="up" />
        </div>
        <p className="showcase-note">{t('app.showcase.languageVariants')}</p>
      </Variant>
    </ShowcaseSection>
  );
}
