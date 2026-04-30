// vitest-axe 0.1.0 augments Vitest 1's `Vi` namespace, which Vitest 2 ignores.
// Bridge the matcher into Vitest 2's expected namespaces. Drop this shim once
// vitest-axe ships a Vitest-2-compatible types update.
//
// Declaration merging requires empty interfaces here; the lint rules don't
// apply to type-augmentation files.
/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
import 'vitest';

interface AxeMatchers {
  toHaveNoViolations(): void;
}

declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
