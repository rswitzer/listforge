import type { ReactElement, ReactNode } from 'react';
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function TestProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: TestProviders, ...options }),
  };
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
