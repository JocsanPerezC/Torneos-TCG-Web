import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const entries = [
  ['1', 'Lina Rojas', '28', '11'],
  ['2', 'Marco Vega', '24', '9'],
  ['3', 'Sofía Mora', '21', '8'],
  ['4', 'Tomás León', '18', '6'],
];

export function StandingsPreview() {
  const { t } = useTranslation();
  const metrics = [[t('landing.preview.currentRound'), t('landing.preview.roundValue')], [t('landing.preview.activeTables'), '4'], [t('landing.preview.players'), '14']];

  return (
    <section
      aria-label={t('landing.preview.ariaLabel')}
      className="mx-auto max-w-5xl px-5 pb-8 sm:pb-14"
    >
      <div className="rounded-3xl bg-gradient-to-br from-[#BFE3F5] via-[#2660A4] to-[#14385E] p-4 sm:p-8">
        <Card className="border-white/70 bg-white shadow-xl shadow-[#14385E]/25">
          <CardHeader className="flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs font-semibold tracking-[.14em] text-accent">{t('landing.preview.eyebrow')}</p>
              <CardTitle className="mt-1 text-xl text-foreground">{t('landing.preview.tournamentName')}</CardTitle>
            </div>
            <span className="rounded-full bg-[#e9f4f3] px-3 py-1 text-xs font-semibold text-[#17666d]">
              {t('landing.preview.live')}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
              {metrics.map(([label, value]) => (
                <div key={label} className="px-3 py-4 text-center sm:px-5">
                  <span className="block text-[10px] font-semibold tracking-[.1em] text-muted-foreground sm:text-[11px]">
                    {label.toUpperCase()}
                  </span>
                  <strong className="mt-1 block text-sm text-foreground sm:text-base">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <h2 className="font-semibold text-foreground">{t('landing.preview.standings')}</h2>
              <span className="text-xs text-muted-foreground">{t('landing.preview.updated')}</span>
            </div>
            <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 border-y border-border px-5 py-3 text-[11px] font-semibold tracking-[.12em] text-muted-foreground">
              <span>#</span>
              <span>{t('landing.preview.player')}</span>
              <span className="hidden sm:block">{t('landing.preview.detail')}</span>
              <span>{t('landing.preview.points')}</span>
            </div>
            {entries.map(([position, name, strength, points]) => (
              <div
                key={name}
                className={`grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 px-5 py-4 text-sm ${position === '1' ? 'bg-[#f2f7fb]' : ''}`}
              >
                <span
                  className={`font-semibold ${position === '1' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {position}
                </span>
                <span className="font-medium text-foreground">{name}</span>
                <span className="hidden text-muted-foreground sm:block">{t('landing.preview.strength', { value: strength })}</span>
                <strong className="tabular-nums text-foreground">{points}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
