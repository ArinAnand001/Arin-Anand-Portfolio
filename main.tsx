import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first so component styles can build on them.
import './styles/tokens.css';
import './styles/global.css';
import { MotionProvider } from './lib/motion';
import App from './App';

// Apply the motion preference before the first render, so no animation starts at full
// speed for someone who asked for less motion.
try {
  const saved = window.localStorage.getItem('aa-motion');
  const reduce = saved ? saved === 'reduced' : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.dataset.motion = reduce ? 'reduced' : 'full';
} catch {
  /* storage blocked - the provider still applies the system setting */
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <MotionProvider>
        <App />
      </MotionProvider>
    </StrictMode>,
  );
}
