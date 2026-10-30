// Tras un despliegue, una pestaña abierta puede pedir chunks que ya no existen.
// Recarga una vez para traer la versión actual; si vuelve a fallar enseguida, no
// insiste, para no entrar en un bucle de recargas.
const reloadKey = 'torneos-tcg.chunk-reload';

export function reloadForStaleChunk(): boolean {
  try {
    const last = Number(sessionStorage.getItem(reloadKey) ?? 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(reloadKey, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
