import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
};

function LegalLayout({ documentKey }: { documentKey: 'privacy' | 'terms' }) {
  const { i18n, t } = useTranslation();
  const copy = t(`app.legal.${documentKey}`, { returnObjects: true }) as unknown as LegalDocument;

  return (
    <div className="landing-theme min-h-screen">
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article
          lang={i18n.resolvedLanguage === 'en' ? 'en' : 'es'}
          className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-10"
        >
          <h1 className="text-4xl font-black">{copy.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{copy.updated}</p>
          <div className="legal-copy mt-8 space-y-8 text-[0.98rem] leading-7 text-ink-soft">
            <p>{copy.intro}</p>
            {copy.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-10 flex justify-center border-t border-border pt-6">
            <Button
              type="button"
              className="app-button app-button--primary"
              onClick={() => window.close()}
            >
              {t('app.legal.closeTab')}
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return <LegalLayout documentKey="privacy" />;
}

export function TermsPage() {
  return <LegalLayout documentKey="terms" />;
}
