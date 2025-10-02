import React from 'react';

import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      title="Toggle theme"
      className="rounded-full"
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
};
