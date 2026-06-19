/**
 * @prop {string} variant - "success" | "warning" | "pending" | "error" | "info"
 * @prop {string} children - label text
 * @prop {string} [size] - "sm" | "md"
 * @prop {boolean} [dot] - show status dot before text
 */
export default function Badge({ variant = 'info', children, size = 'md', dot = true }) {
  const variants = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    pending: 'bg-pending/15 text-pending',
    error: 'bg-error/15 text-error',
    info: 'bg-surface-2 text-text-muted',
  };
  
  const dots = {
    success: 'bg-success',
    warning: 'bg-warning',
    pending: 'bg-pending',
    error: 'bg-error',
    info: 'bg-text-muted',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${variants[variant] || variants.info} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dots[variant] || dots.info}`} aria-hidden="true"></span>}
      {children}
    </span>
  );
}
