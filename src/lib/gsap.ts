import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Registro único: los módulos ES se evalúan una sola vez.
gsap.registerPlugin(ScrollTrigger, useGSAP);
ScrollTrigger.config({ ignoreMobileResize: true });

/** Las animaciones solo se crean bajo esta consulta; con movimiento reducido todo queda en su estado final. */
export const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export { gsap, ScrollTrigger, useGSAP };
