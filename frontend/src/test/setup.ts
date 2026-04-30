import '@testing-library/jest-dom/vitest';
// `extend-expect` ships with empty JS in vitest-axe 0.1.0 (upstream bug) — the
// import here pulls in only the global `Vi.Assertion` type augmentation. The
// matcher itself is registered at runtime via `expect.extend` below.
import 'vitest-axe/extend-expect';
import { expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);
