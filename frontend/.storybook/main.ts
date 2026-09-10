import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    // Docs pages generated from the component types and JSDoc.
    '@storybook/addon-docs',
    // Runs axe against every story: the accessibility panel flags contrast,
    // labelling and role problems as the components are developed.
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/nextjs-vite',
};

export default config;
