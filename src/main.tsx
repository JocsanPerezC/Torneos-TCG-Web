import { createRoot } from 'react-dom/client';
import '@/index.css';
import '@/i18n';
import App from '@/app/App';
import { reloadForStaleChunk } from '@/lib/chunkReload';

// Fallos al precargar dependencias de un chunk (ver también lazyNamed en AppRouter).
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForStaleChunk()) event.preventDefault();
});

createRoot(document.getElementById('root')!).render(<App />);
