import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', onFocus, onBlur, style, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-medium text-themed-muted uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-card border border-themed text-themed-primary px-4 py-3.5 rounded-xl outline-none transition-all duration-300 placeholder:text-themed-muted placeholder:opacity-40 ${className}`}
        style={{ ...style }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--color-accent)';
          e.currentTarget.style.boxShadow   = '0 0 0 2px var(--color-accent-subtle)';
          onFocus?.(e);
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = '';
          e.currentTarget.style.boxShadow   = '';
          onBlur?.(e);
        }}
        {...props}
      />
    </div>
  );
}
