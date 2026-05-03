import type { ReactElement, ReactNode } from 'react';
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

type ListForgeRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  initialEntries?: string[];
};

export function render(ui: ReactElement, options: ListForgeRenderOptions = {}) {
  const { initialEntries = ['/'], ...rest } = options;
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  }
  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: Wrapper, ...rest }),
  };
}

export {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
