/**
 * Adventurer Application - Entry Point
 * 
 * Uygulamanın başlangıç noktası.
 * React Strict Mode ile debugging yardımıyla çalışır.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.js';

// Root DOM elementine React uygulamasını bağla
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
