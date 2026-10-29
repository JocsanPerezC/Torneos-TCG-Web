import { useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap, MOTION_QUERY, useGSAP } from '@/lib/gsap';

type Player = { name: string; color: string; points: number; kills: number };

const tables: Player[][] = [
  [
    { name: 'Lina', color: 'blue', points: 5, kills: 2 },
    { name: 'Marco', color: 'green', points: 2, kills: 1 },
    { name: 'Sofía', color: 'violet', points: 1, kills: 0 },
    { name: 'Tomás', color: 'red', points: 2, kills: 2 },
  ],
  [
    { name: 'Ana', color: 'yellow', points: 4, kills: 1 },
    { name: 'Diego', color: 'blue', points: 1, kills: 1 },
    { name: 'Elena', color: 'red', points: 5, kills: 1 },
    { name: 'Pablo', color: 'green', points: 0, kills: 0 },
  ],
];

const players = tables.flat();
const alphabetical = [...players].sort((a, b) => a.name.localeCompare(b.name));
const finalOrder = [...players].sort((a, b) => b.points - a.points || b.kills - a.kills);

export function NightScroll() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const steps = [1, 2, 3].map((step) => [
    t(`landing.concept.step${step}Title`),
    t(`landing.concept.step${step}Description`),
  ]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        const q = gsap.utils.selector(sectionRef);
        const stepEls = q('.night-step');
        const rows = q('.night-standings__rows li') as HTMLElement[];
        gsap.set(stepEls.slice(1), { autoAlpha: 0, y: 36 });

        const changeStep = (from: number, at: number) => {
          tl.to(stepEls[from], { autoAlpha: 0, y: -36, duration: 0.2 }, at)
            .to(stepEls[from + 1], { autoAlpha: 1, y: 0, duration: 0.2 }, at + 0.15)
            .to(
              q('.night__dots li')[from + 1],
              { backgroundColor: '#21b876', duration: 0.1 },
              at + 0.15,
            );
        };

        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
          },
        });
        tl.fromTo(
          '.night-chip',
          { y: '-70vh', rotation: () => gsap.utils.random(-35, 35), autoAlpha: 0 },
          { y: 0, rotation: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.06 },
          0.05,
        );
        changeStep(0, 1.1);
        tl.fromTo(
          '.night-chip__badge',
          { scale: 0, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2.4)', stagger: 0.06 },
          1.4,
        ).to('.night-table', { backgroundColor: '#d9f6e7', duration: 0.4 }, 1.4);
        changeStep(1, 2.2);
        tl.to(
          rows,
          {
            // Las filas miden lo mismo: desplazar N filas equivale a N × 100 %.
            yPercent: (_i: number, el: HTMLElement) => Number(el.dataset.shift) * 100,
            duration: 0.6,
            ease: 'power2.inOut',
          },
          2.5,
        )
          .fromTo(
            '.night-standings__rows output',
            { textContent: 0 },
            {
              textContent: (_i: number, el: HTMLElement) => Number(el.dataset.value),
              snap: { textContent: 1 },
              duration: 0.6,
              ease: 'none',
            },
            2.5,
          )
          .to({}, { duration: 0.4 });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="como-funciona" className="night">
      <div className="night__stage">
        <div className="night__inner">
          <div className="night__copy">
            <p className="night__eyebrow">{t('landing.concept.eyebrow')}</p>
            <h2 className="sr-only">{t('landing.concept.title')}</h2>
            <div className="night__steps">
              {steps.map(([title, description], index) => (
                <article className="night-step" key={title}>
                  <b>0{index + 1}</b>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <ol className="night__dots" aria-hidden="true">
              {steps.map(([title]) => (
                <li key={title} />
              ))}
            </ol>
          </div>
          <div className="night__visual" role="img" aria-label={t('landing.night.visualLabel')}>
            <div className="night__tables">
              {tables.map((table, index) => (
                <div className="game-table night-table" key={index}>
                  <h4>
                    {t('landing.night.table', { number: index + 1 })}{' '}
                    <span>{t('landing.night.seats', { count: table.length, max: 5 })}</span>
                  </h4>
                  <ul>
                    {table.map((player) => (
                      <li className="night-chip" key={player.name}>
                        <span className={`night-token night-token--${player.color}`}>
                          {player.name[0]}
                        </span>
                        <strong>{player.name}</strong>
                        <em className="night-chip__badge">
                          +{player.points} · ☠{player.kills}
                        </em>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="app-panel night-standings">
              <p className="night-standings__title">{t('landing.night.standingsTitle')}</p>
              <div className="night-standings__body">
                <ol className="night-standings__positions">
                  {players.map((player, index) => (
                    <li key={player.name}>{index + 1}</li>
                  ))}
                </ol>
                <ul className="night-standings__rows">
                  {alphabetical.map((player, index) => {
                    const finalIndex = finalOrder.indexOf(player);
                    return (
                      <li
                        key={player.name}
                        data-shift={finalIndex - index}
                        style={{ '--final': finalIndex } as CSSProperties}
                      >
                        <span className={`night-token night-token--${player.color}`}>
                          {player.name[0]}
                        </span>
                        <strong>{player.name}</strong>
                        <output data-value={player.points}>{player.points}</output>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
