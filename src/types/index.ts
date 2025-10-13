export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  date: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
  type: 'current' | 'historical';
  label: string;
  mobileLabel?: string;
}

export interface HeatmapData {
  grid: number[][];
  hours: string[];
  days: string[];
  totals: number[];
  current: number;
  maxValue: number;
  peakHour: string;
  mostActiveDay: string;
  dateRange: DateRange;
}

export interface PredictionData {
  pace: string;
  next24h: number;
  next24hMin?: number;
  next24hMax?: number;
  endOfRange: number;
  endOfRangeMin?: number;
  endOfRangeMax?: number;
  trend: string; // Changed to string to include emoji and percentage
  momentum?: number;
  momentumIndicator?: string;
  trendFactor?: number;
  dailyAvg?: string;
}

export interface ETComponents {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
}

export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';

export interface AppState {
  // Data
  rawTweets: Tweet[];
  currentData: HeatmapData | null;
  avgData: HeatmapData | null;
  predictions: PredictionData | null;

  // UI State
  selectedRange: DateRange | null;
  availableRanges: DateRange[];
  isLoading: boolean;
  isLoadingData: boolean; // Additional loading flag from vanilla JS
  error: string | null;
  autoRefresh: boolean;
  isAutoRefreshEnabled: boolean; // Additional flag from vanilla JS
  theme: 'light' | 'dark';
  refreshCountdown: number;
  lastRefreshTime: Date | null;

  // Timers
  autoRefreshTimer: ReturnType<typeof setTimeout> | null;
  autoRefreshInterval: ReturnType<typeof setInterval> | null; // Additional timer from vanilla JS
  countdownTimer: ReturnType<typeof setTimeout> | null;
  countdownInterval: ReturnType<typeof setInterval> | null; // Additional timer from vanilla JS

  // Actions
  loadData: (forceRefresh?: boolean) => Promise<void>;
  uploadCSV: (file: File) => Promise<void>;
  downloadCSV: () => void;
  setDateRange: (range: DateRange) => void;
  toggleTheme: () => void;
  toggleAutoRefresh: () => void;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  reset: () => void;
  updateRefreshCountdown: (countdown: number) => void;
}
