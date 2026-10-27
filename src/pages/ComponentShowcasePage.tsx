import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CircleAlert, Layers3 } from 'lucide-react';
import { Accordion, AccordionItem } from '../components/ui/accordion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { Modal } from '../components/ui/modal';
import { showToast, ToastViewport } from '../components/ui/toast';

export function ComponentShowcasePage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast(t('app.showcase.formSaved'));
  };

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:py-16">
        <header className="app-panel flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="m-0 text-4xl leading-none sm:text-5xl">{t('app.showcase.title')}</h1>
            <p className="mb-0 mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              {t('app.showcase.description')}
            </p>
          </div>
          <LanguageSelector />
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="app-panel" aria-labelledby="showcase-buttons">
            <h2 id="showcase-buttons" className="m-0 text-xl">
              {t('app.showcase.buttons')}
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
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
            </div>
          </section>

          <section className="app-panel" aria-labelledby="showcase-statuses">
            <h2 id="showcase-statuses" className="m-0 text-xl">
              {t('app.showcase.statuses')}
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
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
          </section>

          <section className="app-panel" aria-labelledby="showcase-fields">
            <h2 id="showcase-fields" className="m-0 text-xl">
              {t('app.showcase.fields')}
            </h2>
            <form className="mt-5 grid gap-4" onSubmit={submitForm}>
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
              <Button className="app-button app-button--primary w-fit" type="submit">
                {t('app.common.save')}
              </Button>
            </form>
          </section>

          <section className="app-panel" aria-labelledby="showcase-card">
            <h2 id="showcase-card" className="m-0 text-xl">
              {t('app.showcase.card')}
            </h2>
            <Card className="mt-5 border-[1.5px] border-[#DED6C5] bg-[#FFFDF7] shadow-[4px_5px_0_rgba(17,17,17,.07)]">
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
          </section>

          <section className="app-panel" aria-labelledby="showcase-feedback">
            <h2 id="showcase-feedback" className="m-0 text-xl">
              {t('app.showcase.feedback')}
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => setIsModalOpen(true)}
              >
                <Layers3 size={16} aria-hidden="true" />
                {t('app.showcase.openModal')}
              </Button>
              <Button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => showToast(t('app.showcase.toastMessage'))}
              >
                <Bell size={16} aria-hidden="true" />
                {t('app.showcase.showToast')}
              </Button>
            </div>
            <div className="app-empty-state mt-5">
              <span>
                <CircleAlert aria-hidden="true" />
              </span>
              <p>{t('app.showcase.emptyState')}</p>
            </div>
          </section>

          <section className="app-panel lg:col-span-2" aria-labelledby="showcase-accordion">
            <h2 id="showcase-accordion" className="m-0 text-xl">
              {t('app.showcase.accordion')}
            </h2>
            <div className="mt-5">
              <Accordion>
                <AccordionItem title={t('app.showcase.accordionFirst')}>
                  {t('app.showcase.accordionFirstDescription')}
                </AccordionItem>
                <AccordionItem title={t('app.showcase.accordionSecond')}>
                  {t('app.showcase.accordionSecondDescription')}
                </AccordionItem>
              </Accordion>
            </div>
          </section>
        </div>
      </main>
      <ToastViewport />
      {isModalOpen && (
        <Modal
          title={t('app.showcase.modalTitle')}
          description={t('app.showcase.modalDescription')}
          onClose={() => setIsModalOpen(false)}
        >
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            {t('app.showcase.modalContent')}
          </p>
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              className="app-button app-button--primary"
              onClick={() => setIsModalOpen(false)}
            >
              {t('app.common.close')}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
