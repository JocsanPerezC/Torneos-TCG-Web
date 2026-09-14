import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { showToast } from '../ui/toast'

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.94v2.79h3.14c1.84-1.69 2.92-4.18 2.92-7.76Z" />
      <path fill="#34A853" d="M12 21.75c2.62 0 4.82-.87 6.43-2.35l-3.14-2.79c-.87.58-1.99.92-3.29.92-2.53 0-4.67-1.71-5.44-4.01H3.32v2.88A9.72 9.72 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.56 13.52a5.84 5.84 0 0 1 0-3.76V6.88H3.32a9.74 9.74 0 0 0 0 9.52l3.24-2.88Z" />
      <path fill="#EA4335" d="M12 5.75c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.81 2.82 14.62 1.75 12 1.75A9.72 9.72 0 0 0 3.32 7.1l3.24 2.88c.77-2.3 2.91-4.23 5.44-4.23Z" />
    </svg>
  )
}

export function GoogleAuthButton() {
  const [busy, setBusy] = useState(false)

  async function signInWithGoogle() {
    if (!supabase) {
      showToast('Supabase no está configurado para iniciar sesión con Google.', true)
      return
    }

    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) throw error
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google.', true)
      setBusy(false)
    }
  }

  return (
    <div className="mt-5">
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden="true"><span className="w-full border-t border-slate-700" /></div>
        <div className="relative flex justify-center"><span className="bg-slate-900 px-3 text-xs text-slate-400">o continuar con</span></div>
      </div>
      <Button type="button" variant="outline" className="w-full gap-2" disabled={busy} onClick={() => void signInWithGoogle()}>
        <GoogleIcon />
        {busy ? 'Redirigiendo a Google…' : 'Iniciar sesión con Google'}
      </Button>
    </div>
  )
}
