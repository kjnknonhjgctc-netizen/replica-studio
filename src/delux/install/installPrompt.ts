// Captures the browser's native install prompt (Android / Chromium) as early as possible.
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export type Platform = 'ios' | 'android' | 'desktop';

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || iPadOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export const installState = {
  canPrompt: () => deferred !== null,
  isInstalled: () => installed,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  async prompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferred) return 'unavailable';
    const ev = deferred;
    deferred = null;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === 'accepted') installed = true;
    notify();
    return outcome;
  },
};
