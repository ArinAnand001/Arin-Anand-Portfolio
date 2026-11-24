import { useCallback, useEffect, useState } from 'react';
import { useMotion } from './lib/motion';
import { startSmoothScroll } from './lib/scroll';
import { CosmicBackground } from './components/CosmicBackground/CosmicBackground';
import { InteractiveCursor } from './components/InteractiveCursor/InteractiveCursor';
import { Loader } from './components/Loader/Loader';
import { Navbar } from './components/Navbar/Navbar';
import { Hero } from './components/Hero/Hero';
import { About } from './components/About/About';
import { Services } from './components/Services/Services';
import { Process } from './components/Process/Process';
import { Clients } from './components/Clients/Clients';
import { Experiments } from './components/Experiments/Experiments';
import { Blog } from './components/Blog/Blog';
import { Contact } from './components/Contact/Contact';
import { Footer } from './components/Footer/Footer';

export default function App() {
  const { reduced, finePointer } = useMotion();
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => setReady(true), []);

  // Inertial wheel scrolling on mouse/trackpad devices; touch keeps native scrolling.
  useEffect(() => {
    if (reduced || !finePointer) return;
    return startSmoothScroll();
  }, [reduced, finePointer]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <CosmicBackground />
      <Loader onDone={onLoaded} />
      <Navbar ready={ready} />
      <main id="main" tabIndex={-1}>
        <Hero ready={ready} />
        <About />
        <Services />
        <Process />
        <Clients />
        <Experiments />
        <Blog />
        <Contact />
      </main>
      <Footer />
      <InteractiveCursor />
    </>
  );
}
