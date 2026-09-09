interface TabSwitcherProps {
  archived: boolean;
  onChange: (archived: boolean) => void;
}

export function TabSwitcher({ archived, onChange }: TabSwitcherProps) {
  return (
    <div className="tabs" role="tablist" aria-label="Estado de las notas">
      <button
        type="button"
        role="tab"
        aria-selected={!archived}
        className={`tab ${archived ? '' : 'tab--active'}`}
        onClick={() => onChange(false)}
      >
        Activas
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={archived}
        className={`tab ${archived ? 'tab--active' : ''}`}
        onClick={() => onChange(true)}
      >
        Archivadas
      </button>
    </div>
  );
}
