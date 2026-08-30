import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'midnight' | 'matrix';

export interface ThemeColors {
  id: ThemeMode;
  name: string;
  icon: string;
  bgMain: string;
  bgCard: string;
  bgCardElevated: string;
  bgInput: string;
  border: string;
  borderHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentText: string;
  tagBg: string;
  ganttGrid: string;
  glassGlow: string;
}

export const THEMES: Record<ThemeMode, ThemeColors> = {
  dark: {
    id: 'dark',
    name: 'Dark Slate Glass',
    icon: '🌙',
    bgMain: 'bg-slate-950',
    bgCard: 'backdrop-blur-xl bg-slate-900/90 border-slate-700/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]',
    bgCardElevated: 'backdrop-blur-2xl bg-slate-850/95 border-slate-700/80 shadow-[0_12px_40px_0_rgba(0,0,0,0.5)]',
    bgInput: 'backdrop-blur-md bg-slate-950/80 border-slate-700 text-white font-medium focus:border-cyan-400 focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/30',
    border: 'border-slate-700/70',
    borderHover: 'hover:border-cyan-400/80 hover:shadow-[0_4px_20px_rgba(6,182,212,0.25)]',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-200',
    textMuted: 'text-slate-300',
    accent: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    accentHover: 'hover:bg-cyan-400',
    accentText: 'text-cyan-300',
    tagBg: 'backdrop-blur-md bg-cyan-500/25 text-cyan-200 border-cyan-500/50 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    ganttGrid: 'border-slate-800',
    glassGlow: 'from-cyan-500/25 via-blue-500/15 to-indigo-500/25',
  },
  light: {
    id: 'light',
    name: 'Clean Light Glass',
    icon: '☀️',
    bgMain: 'bg-slate-100',
    bgCard: 'backdrop-blur-xl bg-white/95 border-slate-300 shadow-[0_8px_30px_rgba(0,0,0,0.08)]',
    bgCardElevated: 'backdrop-blur-2xl bg-slate-50 border-slate-300 shadow-[0_12px_36px_rgba(0,0,0,0.12)]',
    bgInput: 'backdrop-blur-md bg-white border-slate-400 text-slate-950 font-bold focus:border-blue-700 focus:ring-2 focus:ring-blue-500/30',
    border: 'border-slate-300',
    borderHover: 'hover:border-blue-700 hover:shadow-[0_4px_20px_rgba(37,99,235,0.2)]',
    textPrimary: 'text-slate-950 font-medium',
    textSecondary: 'text-slate-850 font-medium',
    textMuted: 'text-slate-700',
    accent: 'bg-blue-700 hover:bg-blue-800 text-white font-extrabold backdrop-blur-sm shadow-[0_0_20px_rgba(29,78,216,0.3)]',
    accentHover: 'hover:bg-blue-800',
    accentText: 'text-blue-700 font-bold',
    tagBg: 'backdrop-blur-md bg-blue-100 text-blue-950 border-blue-400 font-bold shadow-xs',
    ganttGrid: 'border-slate-300',
    glassGlow: 'from-blue-400/20 via-indigo-300/15 to-teal-300/20',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Glass',
    icon: '🌌',
    bgMain: 'bg-[#060a14]',
    bgCard: 'backdrop-blur-xl bg-[#0c152e]/90 border-indigo-500/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]',
    bgCardElevated: 'backdrop-blur-2xl bg-[#142045]/95 border-indigo-500/50 shadow-[0_12px_40px_0_rgba(0,0,0,0.6)]',
    bgInput: 'backdrop-blur-md bg-[#080e21]/90 border-indigo-500/40 text-white font-medium focus:border-indigo-400 focus:bg-[#0c152e] focus:ring-2 focus:ring-indigo-500/30',
    border: 'border-indigo-500/40',
    borderHover: 'hover:border-indigo-400/80 hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)]',
    textPrimary: 'text-white',
    textSecondary: 'text-indigo-100',
    textMuted: 'text-indigo-200',
    accent: 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold backdrop-blur-sm shadow-[0_0_20px_rgba(99,102,241,0.4)]',
    accentHover: 'hover:bg-indigo-500',
    accentText: 'text-indigo-300',
    tagBg: 'backdrop-blur-md bg-indigo-500/30 text-white border-indigo-400 font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]',
    ganttGrid: 'border-indigo-900/50',
    glassGlow: 'from-indigo-600/30 via-purple-600/20 to-blue-600/25',
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix Glass',
    icon: '🟢',
    bgMain: 'bg-[#020b05]',
    bgCard: 'backdrop-blur-xl bg-[#04190c]/90 border-emerald-500/45 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]',
    bgCardElevated: 'backdrop-blur-2xl bg-[#092916]/95 border-emerald-500/55 shadow-[0_12px_40px_0_rgba(0,0,0,0.7)]',
    bgInput: 'backdrop-blur-md bg-[#021007]/90 border-emerald-500/45 text-emerald-100 font-mono font-medium focus:border-emerald-400 focus:bg-[#04190c] focus:ring-2 focus:ring-emerald-500/30',
    border: 'border-emerald-500/45',
    borderHover: 'hover:border-emerald-400/80 hover:shadow-[0_4px_20px_rgba(16,185,129,0.3)]',
    textPrimary: 'text-emerald-100 font-medium',
    textSecondary: 'text-emerald-200 font-medium',
    textMuted: 'text-emerald-300',
    accent: 'bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold backdrop-blur-sm shadow-[0_0_20px_rgba(16,185,129,0.45)]',
    accentHover: 'hover:bg-emerald-300',
    accentText: 'text-emerald-300 font-bold',
    tagBg: 'backdrop-blur-md bg-emerald-950/95 text-emerald-100 border-emerald-500 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    ganttGrid: 'border-emerald-900/50',
    glassGlow: 'from-emerald-600/25 via-teal-600/20 to-green-600/25',
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('cpu_scheduler_theme') as ThemeMode;
      if (saved && THEMES[saved]) return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('cpu_scheduler_theme', newTheme);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  const colors = THEMES[theme] || THEMES.dark;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
