/**
 * @prop {ReactNode} children - Main content
 * @prop {ReactNode} [header] - Header slot
 * @prop {ReactNode} [footer] - Footer slot
 * @prop {boolean} [isClickable] - Adds hover translation and shadow
 */
export default function Card({ children, header, footer, isClickable = false, className = '' }) {
  const clickableStyles = isClickable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-300' : '';
  
  return (
    <div className={`bg-surface overflow-hidden shadow-sm rounded-xl border border-border ${clickableStyles} ${className}`}>
      {header && <div className="px-6 py-4 border-b border-border bg-surface-2">{header}</div>}
      <div className="px-6 py-5">
        {children}
      </div>
      {footer && <div className="px-6 py-4 border-t border-border bg-surface-2">{footer}</div>}
    </div>
  );
}
