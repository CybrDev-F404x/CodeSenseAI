import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  style,
  ...props 
}: ButtonProps) {
  const base = 'px-6 py-2.5 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  // Primary uses CSS variable so it reacts to theme changes instantly
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: 'var(--color-accent)', color: '#ffffff', boxShadow: '0 4px 20px var(--color-accent-subtle)' },
    outline: {},
    danger:  { backgroundColor: '#9A1547', color: '#ffffff' },
  };

  const variantClasses: Record<string, string> = {
    primary: 'hover:brightness-110',
    outline: 'bg-transparent border border-white/10 hover:border-white/20 text-themed-primary',
    danger:  'hover:brightness-110',
  };

  return (
    <button 
      className={`${base} ${variantClasses[variant]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
