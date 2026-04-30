import { configureAxe } from 'vitest-axe';

// jsdom has no <canvas> 2D context, so axe-core's color-contrast rule emits
// noisy "Not implemented" warnings and produces unreliable results. We run
// the contrast check in real Chromium via tests-e2e/a11y.spec.ts instead.
export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: false },
  },
});
