import { Accordion, AccordionItem } from '@/components/ui/accordion'

const questions = [
  ['¿Los jugadores necesitan una cuenta?', 'No. Solo el organizador necesita iniciar sesión. Las personas participantes pueden seguir el torneo mediante su enlace público.'],
  ['¿Puedo usar otra puntuación?', 'Sí. Al crear o configurar el torneo podés definir los puntos que se aplican a posiciones, eliminaciones y empates.'],
  ['¿Sirve para otros TCG?', 'Sí. El nombre y las reglas del torneo se adaptan al juego y formato que elija tu comunidad.'],
  ['¿Cómo comparto la clasificación?', 'Cada torneo público tiene un enlace de solo lectura para que participantes y espectadores consulten mesas y resultados.'],
]

export function Faq() { return <section id="preguntas" className="mx-auto max-w-3xl px-5 py-18"><div className="text-center"><p className="text-xs font-bold tracking-[.18em] text-accent">PREGUNTAS FRECUENTES</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Sin sorpresas, solo partidas.</h2></div><Accordion>{questions.map(([title, answer]) => <AccordionItem key={title} title={title}>{answer}</AccordionItem>)}</Accordion></section> }
