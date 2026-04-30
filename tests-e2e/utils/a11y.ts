import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export type CheckA11yOptions = {
  include?: string;
  exclude?: string | string[];
  disableRules?: string[];
};

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export async function checkA11y(page: Page, options: CheckA11yOptions = {}) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_AA_TAGS);

  if (options.include) builder = builder.include(options.include);
  if (options.exclude) builder = builder.exclude(options.exclude);
  if (options.disableRules?.length) builder = builder.disableRules(options.disableRules);

  const { violations } = await builder.analyze();

  expect(
    violations,
    violations.length
      ? `Accessibility violations:\n${formatViolations(violations)}`
      : '',
  ).toEqual([]);
}

function formatViolations(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations
    .map((v) => {
      const targets = v.nodes
        .map((n) => `    - ${n.target.join(', ')}`)
        .join('\n');
      return `  • [${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${targets}`;
    })
    .join('\n');
}
