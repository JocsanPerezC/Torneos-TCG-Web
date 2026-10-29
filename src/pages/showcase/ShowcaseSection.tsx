import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type SectionMeta = { id: string; titleKey: string };

/** Sección del muestrario: título, componentes de origen (en mono) y sus variantes. */
export function ShowcaseSection({
  id,
  titleKey,
  sources,
  children,
}: SectionMeta & { sources: string[]; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <section id={id} className="app-panel showcase-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="m-0 text-2xl">
        {t(titleKey)}
      </h2>
      <ul className="showcase-section__sources">
        {sources.map((source) => (
          <li key={source}>{source}</li>
        ))}
      </ul>
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

/** Una variante con su etiqueta; `duplicate` la marca como duplicación pendiente de unificar. */
export function Variant({
  label,
  source,
  duplicate = false,
  children,
  className = '',
}: {
  label: string;
  source?: string;
  duplicate?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <figure className={`showcase-variant ${duplicate ? 'is-duplicate' : ''} ${className}`}>
      <figcaption>
        <span>{label}</span>
        {source && <code>{source}</code>}
        {duplicate && <b>{t('app.showcase.duplicate')}</b>}
      </figcaption>
      <div className="showcase-variant__body">{children}</div>
    </figure>
  );
}

/** Marco escalado para piezas de página completa (shell, headers, landing). */
export function ScaledFrame({
  children,
  width = 1280,
  height = 560,
  scale = 0.5,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  scale?: number;
}) {
  return (
    <div
      className="showcase-frame"
      style={
        {
          '--frame-width': `${width}px`,
          '--frame-height': `${height}px`,
          '--frame-scale': scale,
        } as CSSProperties
      }
    >
      <div className="showcase-frame__viewport">{children}</div>
    </div>
  );
}
