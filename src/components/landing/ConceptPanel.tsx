import { useEffect, useRef, useState } from 'react'

export function ConceptPanel() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.2 })

    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  return <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-16 sm:py-20"><div className="text-center"><p className="text-xs font-bold tracking-[.18em] text-accent">CÓMO FUNCIONA</p><h2 className="mt-3 text-3xl font-bold sm:text-5xl">De la mesa al resultado, sin perder el ritmo.</h2><p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Cada paso queda visible: armá la ronda, registrá lo que pasó y consultá la clasificación.</p></div><div ref={stageRef} className={`concept-stage relative mt-10 overflow-hidden rounded-[2.5rem] bg-[#21B876] px-6 py-12 sm:px-16 ${isVisible ? 'is-visible' : ''}`}><div className="relative mx-auto grid max-w-3xl gap-4 md:grid-cols-3"><article className="concept-card"><span>1</span><strong>Armá las mesas</strong><small>Grupos listos para jugar</small></article><article className="concept-card concept-card-delay"><span>2</span><strong>Registrá el resultado</strong><small>Posiciones y eliminaciones</small></article><article className="concept-card concept-card-delay-2"><span>3</span><strong>Consultá posiciones</strong><small>Clasificación al instante</small></article></div></div></section>
}
