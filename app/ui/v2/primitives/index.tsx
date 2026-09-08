'use client';

/** Small shared building blocks for the redesigned interface. */

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-card border border-line bg-surface shadow-card ${
        padded ? 'px-6 py-6 sm:px-7' : ''
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-subtle ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  model,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede: string;
  model: string;
}) {
  return (
    <header className="mb-7 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
      <div className="max-w-[640px]">
        <Eyebrow className="mb-2.5">{eyebrow}</Eyebrow>
        <h1 className="mb-3 font-display text-[38px] leading-[1.05] font-normal text-ink sm:text-[46px]">
          {title}
        </h1>
        <p className="text-[15px] leading-relaxed text-ink-muted text-pretty">{lede}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-positive" />
        <span className="font-mono text-xs text-ink-muted">{model}</span>
      </div>
    </header>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-field px-6 py-3 text-[14.5px] font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        disabled ? 'cursor-not-allowed bg-line-strong text-surface-sunken' : 'bg-accent hover:bg-accent-hover'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className = '',
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12.5px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-[5px] border border-line bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
      {children}
    </kbd>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-card border border-danger/25 bg-danger-soft px-5 py-4 text-sm text-danger"
    >
      <strong className="font-semibold">Erreur — </strong>
      {message}
    </div>
  );
}

export function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
