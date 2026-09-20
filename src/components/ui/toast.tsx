import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

type Toast = { id: number; message: ReactNode; error: boolean; exiting?: boolean }

let nextToastId = 0
let toasts: Toast[] = []
const listeners = new Set<() => void>()

function notify() { listeners.forEach(listener => listener()) }

export function showToast(message: ReactNode, error = false) {
  const id = nextToastId++
  toasts = [...toasts, { id, message, error }]
  notify()
  window.setTimeout(() => {
    toasts = toasts.map(toast => toast.id === id ? { ...toast, exiting: true } : toast)
    notify()
  }, 3500)
  window.setTimeout(() => {
    toasts = toasts.filter(toast => toast.id !== id)
    notify()
  }, 4000)
}

export function ToastViewport() {
  const [items, setItems] = useState(toasts)
  const nodes = useRef(new Map<number, HTMLDivElement>())
  const positions = useRef(new Map<number, number>())

  useEffect(() => {
    const update = () => setItems(toasts)
    listeners.add(update)
    return () => { listeners.delete(update) }
  }, [])

  useLayoutEffect(() => {
    const nextPositions = new Map<number, number>()
    for (const toast of items) {
      const node = nodes.current.get(toast.id)
      if (!node) continue
      const top = node.getBoundingClientRect().top
      const previousTop = positions.current.get(toast.id)
      if (previousTop !== undefined && previousTop !== top) {
        node.animate([
          { transform: `translateY(${previousTop - top}px)` },
          { transform: 'translateY(0)' },
        ], { duration: 280, easing: 'ease-out' })
      }
      nextPositions.set(toast.id, top)
    }
    positions.current = nextPositions
  }, [items])

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-50 flex max-w-sm flex-col gap-3">
      {items.map(toast => (
        <div
          key={toast.id}
          ref={node => { if (node) nodes.current.set(toast.id, node); else nodes.current.delete(toast.id) }}
          role={toast.error ? 'alert' : 'status'}
          className={`pointer-events-auto rounded-2xl border border-border p-4 text-sm font-medium shadow-xl ${toast.exiting ? 'toast-exit' : 'toast-enter'} ${toast.error ? 'bg-red-950 text-red-200' : 'bg-[#E7FAEE] text-[#168050]'}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
