"use client";

type PreComputerToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
};

export function PreComputerToggle({ value, onChange }: PreComputerToggleProps) {
  return (
    <div className="flex items-center space-x-3 mb-3">
      <span className="text-xs text-muted-foreground">Precompute</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        tabIndex={0}
        className="relative rounded-full focus:outline-none"
        onClick={() => onChange(!value)}
        style={{
          position: 'relative',
          width: '2.75rem', // 44px
          height: '1.5rem', // 24px
          padding: '0.125rem',
          backgroundColor: value ? 'var(--nillion-primary)' : 'var(--nillion-grey)',
          border: 'none',
          borderRadius: '9999px',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          outline: 'none'
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: value ? '0.125rem' : 'calc(100% - 1.25rem - 0.125rem)',
            top: '0.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.25rem', // 20px
            height: '1.25rem', // 20px
            backgroundColor: 'white',
            borderRadius: '50%',
            boxShadow: 'var(--nillion-shadow)',
            transition: 'all 200ms ease',
            pointerEvents: 'none'
          }}
        />
        <span className="sr-only">{value ? "Precompute mode" : "Local mode"}</span>
      </button>
      <span className="text-xs text-muted-foreground">Local</span>
    </div>
  );
}


