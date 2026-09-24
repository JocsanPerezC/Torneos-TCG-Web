import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

function MiniTable() { return <svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="45" rx="40" ry="25" /><circle cx="60" cy="17" r="8" /><circle cx="101" cy="45" r="8" /><circle cx="60" cy="73" r="8" /><circle cx="19" cy="45" r="8" /><path d="M49 45h22M60 34v22" /></svg> }
function MiniResult() { return <div className="flow-result" aria-hidden="true"><span>12</span><i>+2</i><span>9</span><span>7</span></div> }
function MiniRank() { return <ol className="flow-rank" aria-hidden="true"><li><b>1</b><i /><span>28</span></li><li><b>2</b><i /><span>24</span></li><li><b>3</b><i /><span>21</span></li></ol> }

export function ConceptPanel() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation()
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !('IntersectionObserver' in window)) return setIsVisible(true)
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } }, { threshold: .15 })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])
  const steps = [[t('landing.concept.step1Title'), t('landing.concept.step1Description'), <MiniTable />], [t('landing.concept.step2Title'), t('landing.concept.step2Description'), <MiniResult />], [t('landing.concept.step3Title'), t('landing.concept.step3Description'), <MiniRank />]]

  return <section id="como-funciona" className="match-flow landing-deferred"><div className="mx-auto max-w-6xl px-5 py-18 sm:py-24"><header><p>{t('landing.concept.eyebrow')}</p><h2>{t('landing.concept.title')}</h2><span>{t('landing.concept.description')}</span></header><div ref={stageRef} className={`match-flow__track ${isVisible ? 'is-visible' : ''}`}>{steps.map(([title, description, visual], index) => <div className="match-flow__step" key={title as string}><article><small>0{index + 1}</small><div className="match-flow__visual">{visual}</div><h3>{title as string}</h3><p>{description as string}</p></article>{index < steps.length - 1 && <svg className="match-flow__arrow" viewBox="0 0 72 32" aria-hidden="true"><path d="M4 16h58M50 6l10 10-10 10" /></svg>}</div>)}</div></div></section>
}
