'use client'

import MoonIcon from './icons/MoonIcon';
import SunIcon from './icons/SunIcon';
import { useTheme } from 'next-themes'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="inline-flex ">
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <SunIcon />
        ) : (
          <MoonIcon />
        )}
      </button>

    </div>
  );
}
