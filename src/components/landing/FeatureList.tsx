import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/gsap';

const examples = [
  { name: 'Lina Rojas', wins: 2, kills: 3, draws: 0, color: 'blue' },
  { name: 'Marco Vega', wins: 1, kills: 4, draws: 1, color: 'green' },
  { name: 'Sofía Mora', wins: 1, kills: 1, draws: 2, color: 'violet' },
];

export function FeatureList() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const firstTops = useRef(new Map<string, number>());
  const [winPoints, setWinPoints] = useState(3);
  const [killPoints, setKillPoints] = useState(1);
  const [drawPoints, setDrawPoints] = useState(1);
  const ranking = useMemo(
    () =>
      examples
        .map((player) => ({
          ...player,
          points: player.wins * winPoints + player.kills * killPoints + player.draws * drawPoints,
        }))
        .sort((a, b) => b.points - a.points),
    [winPoints, killPoints, drawPoints],
  );
  const rules = [
    [t('landing.features.win'), winPoints, setWinPoints, 'green'],
    [t('landing.features.kill'), killPoints, setKillPoints, 'red'],
    [t('landing.features.draw'), drawPoints, setDrawPoints, 'violet'],
  ] as const;

  const rankingRows = () =>
    Array.from(sectionRef.current?.querySelectorAll<HTMLElement>('.score-ranking li') ?? []);

  // FLIP: tras reordenar, cada fila parte de su posición anterior y vuelve a cero.
  useGSAP(
    () => {
      if (prefersReducedMotion() || !firstTops.current.size) return;
      rankingRows().forEach((row) => {
        const first = firstTops.current.get(row.dataset.name ?? '');
        gsap.killTweensOf(row, 'y');
        gsap.set(row, { y: 0 });
        const delta = first === undefined ? 0 : first - row.getBoundingClientRect().top;
        if (delta) gsap.fromTo(row, { y: delta }, { y: 0, duration: 0.55, ease: 'back.out(1.6)' });
      });
      firstTops.current.clear();
    },
    { scope: sectionRef, dependencies: [ranking] },
  );

  const { contextSafe } = useGSAP({ scope: sectionRef });
  const pop = contextSafe((target: HTMLElement | null) => {
    if (!target || prefersReducedMotion()) return;
    gsap.fromTo(target, { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  });
  const change = (
    event: MouseEvent<HTMLButtonElement>,
    setValue: (value: number) => void,
    value: number,
  ) => {
    rankingRows().forEach((row) =>
      firstTops.current.set(row.dataset.name ?? '', row.getBoundingClientRect().top),
    );
    setValue(value);
    pop(event.currentTarget.parentElement?.querySelector('output') ?? null);
  };

  return (
    <section ref={sectionRef} id="puntuacion" className="score-workbench">
      <div className="mx-auto max-w-6xl px-5 py-18 sm:py-24">
        <header>
          <p>{t('landing.features.eyebrow')}</p>
          <h2>{t('landing.features.title')}</h2>
          <span>{t('landing.features.description')}</span>
        </header>
        <div className="score-workbench__body">
          <article className="score-rules">
            <div className="score-rules__heading">
              <svg viewBox="0 0 62 62" aria-hidden="true">
                <path d="m31 5 23 13v26L31 57 8 44V18L31 5Z" />
                <circle cx="22" cy="23" r="3" />
                <circle cx="40" cy="23" r="3" />
                <circle cx="31" cy="40" r="3" />
              </svg>
              <div>
                <strong>{t('landing.features.rulesTitle')}</strong>
                <p>{t('landing.features.rulesHint')}</p>
              </div>
            </div>
            <div className="score-rules__controls">
              {rules.map(([label, value, setValue, color]) => (
                <label key={label}>
                  <span>{label}</span>
                  <div>
                    <button
                      type="button"
                      onClick={(event) => change(event, setValue, Math.max(0, value - 1))}
                      aria-label={t('landing.features.decrease', { label })}
                    >
                      −
                    </button>
                    <output className={`score-rules__value score-rules__value--${color}`}>
                      {value}
                    </output>
                    <button
                      type="button"
                      onClick={(event) => change(event, setValue, value + 1)}
                      aria-label={t('landing.features.increase', { label })}
                    >
                      +
                    </button>
                  </div>
                </label>
              ))}
            </div>
            <small>{t('landing.features.rulesFootnote')}</small>
          </article>
          <article className="score-ranking">
            <div className="score-ranking__header">
              <span>{t('landing.features.previewLabel')}</span>
              <i>{t('landing.features.previewLive')}</i>
            </div>
            <ol aria-live="polite">
              {ranking.map((player, index) => (
                <li key={player.name} data-name={player.name}>
                  <b>{index + 1}</b>
                  <span className={`score-ranking__avatar score-ranking__avatar--${player.color}`}>
                    {player.name[0]}
                  </span>
                  <strong>{player.name}</strong>
                  <em>
                    <output>{player.points}</output> {t('landing.features.points')}
                  </em>
                </li>
              ))}
            </ol>
            <p>{t('landing.features.previewNote')}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
