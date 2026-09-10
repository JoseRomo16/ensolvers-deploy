import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Layout/ThemeToggle',
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Lee la clase `dark` de <html> con `useSyncExternalStore`, así que sigue al
 * selector de tema de la barra de Storybook igual que seguiría al de la app.
 */
export const Default: Story = {};
