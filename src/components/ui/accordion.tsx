import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function Accordion({ children }: { children: ReactNode }) { return <div className="overflow-hidden rounded-3xl border border-border bg-card">{children}</div> }
export function AccordionItem({ title, children }: { title: string; children: ReactNode }) { return <details className="group border-b border-border transition-colors hover:bg-[#F4F1E7] last:border-0"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 font-bold marker:content-none">{title}<ChevronDown size={18} className="text-accent transition-transform group-open:rotate-180" /></summary><p className="px-6 pb-5 pr-14 text-sm leading-6 text-muted-foreground">{children}</p></details> }
