import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/anton/latin.css';
import '@fontsource/anton/latin-ext.css';
import '@fontsource/abril-fatface/latin.css';
import '@fontsource/abril-fatface/latin-ext.css';
import '@fontsource/alfa-slab-one/latin.css';
import '@fontsource/alfa-slab-one/latin-ext.css';
import '@fontsource/bungee/latin.css';
import '@fontsource/bungee/latin-ext.css';
import '@fontsource/dm-serif-display/latin.css';
import '@fontsource/dm-serif-display/latin-ext.css';
import '@fontsource/archivo-black/latin.css';
import '@fontsource/archivo-black/latin-ext.css';
import '@fontsource/shrikhand/latin.css';
import '@fontsource/shrikhand/latin-ext.css';
import '@fontsource/rubik-mono-one/latin.css';
import '@fontsource/rubik-mono-one/latin-ext.css';
import '@fontsource/bangers/latin.css';
import '@fontsource/bangers/latin-ext.css';
import '@fontsource/special-elite/latin.css';
import '@fontsource/special-elite/latin-ext.css';
import '@fontsource/rubik-spray-paint/latin.css';
import '@fontsource/rubik-spray-paint/latin-ext.css';
import '@fontsource/caveat-brush/latin.css';
import '@fontsource/caveat-brush/latin-ext.css';
import '@fontsource/courier-prime/latin-400.css';
import '@fontsource/courier-prime/latin-ext-400.css';
import '@fontsource/courier-prime/latin-700.css';
import '@fontsource/courier-prime/latin-ext-700.css';

import './film.css';
import './scenes.css';
import { App } from './App';

// Film her yenilemede baştan oynar: tarayıcı kaldığı yeri hatırlamasın.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
window.scrollTo(0, 0);
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
