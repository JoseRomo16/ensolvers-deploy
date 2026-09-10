import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';
import { TabSwitcher } from './TabSwitcher';

const meta = {
  title: 'Notas/TabSwitcher',
  component: TabSwitcher,
  args: {
    archived: false,
    onChange: () => {},
  },
} satisfies Meta<typeof TabSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Activas: Story = {};

export const Archivadas: Story = { args: { archived: true } };

/** En pantallas chicas las pestañas ocupan todo el ancho disponible. */
export const EnMovil: Story = {
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

function TabsConEstado(props: ComponentProps<typeof TabSwitcher>) {
  const [archived, setArchived] = useState(false);
  return <TabSwitcher {...props} archived={archived} onChange={setArchived} />;
}

export const Interactivo: Story = {
  render: (args) => <TabsConEstado {...args} />,
};
