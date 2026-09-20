import { BarChart3, Settings2, UsersRound, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features: { tag: string; title: string; description: string; Icon: LucideIcon; color: string }[] = [
  { tag: 'MESAS AUTOMÁTICAS', title: 'Armá cada ronda sin fricción.', description: 'Generá mesas de tres o cuatro jugadores de forma clara para iniciar a jugar rápido.', Icon: UsersRound, color: '#21B876' },
  { tag: 'PUNTUACIÓN', title: 'Tus reglas, tu marcador.', description: 'Configurá puntos normales o por combo para que el torneo siga las reglas reales de tu grupo.', Icon: Settings2, color: '#5B1FE0' },
  { tag: 'CLASIFICACIÓN', title: 'El resultado se ve al instante.', description: 'Actualizá posiciones y desempates al registrar resultados; compartí el enlace público.', Icon: BarChart3, color: '#C1272D' },
]

export function FeatureList() { return <section id="puntuacion" aria-labelledby="beneficios-title" className="mx-auto max-w-6xl px-5 py-18"><div className="text-center"><p className="text-xs font-bold tracking-[.18em] text-accent">PUNTUACIÓN</p><h2 id="beneficios-title" className="mt-3 text-3xl font-bold sm:text-5xl">Reglas claras para cada ronda.</h2><p className="mx-auto mt-3 max-w-xl text-muted-foreground">Configurá la puntuación y mantené mesas, resultados y clasificación alineados durante todo el torneo.</p></div><div className="mt-10 grid gap-6 md:grid-cols-3">{features.map(({ tag, title, description, Icon, color }) => <Card key={tag} className="overflow-hidden transition-transform hover:-translate-y-1"><CardContent className="p-0"><div className="flex h-44 items-center justify-center" style={{ background: color }}><Icon size={60} className="text-white" strokeWidth={1.5} /></div><div className="p-6"><span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-bold">{tag}</span><h3 className="mt-5 text-2xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p><Button asChild variant="ghost" className="mt-4 px-0"><Link to="/register">Crear cuenta →</Link></Button></div></CardContent></Card>)}</div></section> }
