import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type MotionChoice = 'reduced' | 'full' | null;

interface MotionContextValue {
  /** True when animation should be minimised (system setting or visitor choice). */
  reduced: boolean;
  systemReduced: boolean;
  choice: MotionChoice;
  setChoice: (choice: MotionChoice) => void;
  /** Mouse or trackpad that can hover. */
  finePointer: boolean;
}

const STORAGE_KEY = 'aa-motion';

const MotionContext = createContext<MotionContextValue>({
  reduced: false,
  systemReduced: false,
  choice: null,
  setChoice: () => undefined,
  finePointer: true,
});

function readChoice(): MotionChoice {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'reduced' || v === 'full' ? v : null;
  } catch {
    return null;
  }
}

function useMedia(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useMedia('(prefers-reduced-motion: reduce)');
  const finePointer = useMedia('(hover: hover) and (pointer: fine)');
  const [choice, setChoiceState] = useState<MotionChoice>(() =>
    typeof window === 'undefined' ? null : readChoice(),
  );

  const setChoice = useCallback((next: MotionChoice) => {
    setChoiceState(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable - keep the choice for this visit only */
    }
  }, []);

  const reduced = choice ? choice === 'reduced' : systemReduced;

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [reduced]);

  const value = useMemo(
    () => ({ reduced, systemReduced, choice, setChoice, finePointer }),
    [reduced, systemReduced, choice, setChoice, finePointer],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  return useContext(MotionContext);
}

export { useMedia };
