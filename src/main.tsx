import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[v0] main.tsx loaded, attempting to render App...');
console.log('[v0] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'NOT SET');
console.log('[v0] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'NOT SET');

try {
  const root = document.getElementById('root');
  console.log('[v0] Root element:', root ? 'Found' : 'NOT FOUND');
  
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('[v0] Render called successfully');
  }
} catch (error) {
  console.error('[v0] Error during render:', error);
}
