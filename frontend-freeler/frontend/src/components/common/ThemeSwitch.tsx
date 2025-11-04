import { useMemo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/theme/useTheme';
import { cn } from '@/utils/cn';

type ThemeSwitchProps = {
  className?: string;
};

export const ThemeSwitch = ({ className }: ThemeSwitchProps) => {
  const { resolvedMode, setMode } = useTheme();

  const isDark = resolvedMode === 'dark';
  const ariaLabel = useMemo(
    () => (isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'),
    [isDark],
  );

  const toggleMode = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={ariaLabel}
      onClick={toggleMode}
      className={cn(
        'inline-flex h-9 w-16 items-center rounded-full border border-border-subtle bg-surface px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isDark ? 'justify-end text-amber-400' : 'justify-start text-primary-600',
        className,
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted shadow-card">
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
};

export default ThemeSwitch;
