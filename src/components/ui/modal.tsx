import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ title, description, children, onClose }: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/15" onMouseDown={event => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="modal-title" className="text-xl font-bold">{title}</h2>{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}</div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X size={20} /></button>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  </div>
}
