import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      className="relative p-2 text-text-muted hover:bg-surface-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand overflow-hidden w-11 h-11 flex items-center justify-center min-w-[44px] min-h-[44px]"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className={`absolute transition-all duration-500 ease-in-out ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
        <Sun className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className={`absolute transition-all duration-500 ease-in-out ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
        <Moon className="w-5 h-5" aria-hidden="true" />
      </div>
    </button>
  );
}
