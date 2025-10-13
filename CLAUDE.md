# Elon Tracker - Important Development Notes

> **Note**: This project has been migrated from vanilla JavaScript to React with TypeScript. The legacy vanilla JS version is archived in the root directory. This documentation now reflects the React architecture.

## Migration Summary

### Why React + TypeScript?

The migration from vanilla JavaScript to React + TypeScript brings significant benefits:

**Type Safety**

- ✅ Compile-time error detection
- ✅ Better IDE autocomplete and IntelliSense
- ✅ Refactoring confidence with type checking
- ✅ Self-documenting code with interfaces

**Developer Experience**

- ✅ Hot Module Replacement (HMR) for instant feedback
- ✅ React DevTools for component debugging
- ✅ Zustand DevTools for state debugging
- ✅ Modern tooling (Vite, ESLint, Prettier)

**Code Organization**

- ✅ Component-based architecture (easier to test and maintain)
- ✅ Custom hooks for reusable logic
- ✅ Declarative UI (React) vs imperative DOM manipulation
- ✅ Better separation of concerns

**Performance**

- ✅ React's optimized rendering (Virtual DOM)
- ✅ Vite's fast build times (ESBuild)
- ✅ Tree-shaking and code splitting built-in
- ✅ Zustand's minimal re-renders

### Key Architectural Changes

| Aspect               | Vanilla JS (OLD)          | React + TypeScript (NEW)         |
| -------------------- | ------------------------- | -------------------------------- |
| **State Management** | Global `appState` object  | Zustand store with hooks         |
| **UI Updates**       | Manual DOM manipulation   | Automatic React re-renders       |
| **Type Safety**      | JSDoc comments (optional) | TypeScript interfaces (enforced) |
| **Styling**          | Tailwind classes          | Tailwind + shadcn/ui components  |
| **Dev Server**       | Simple HTTP server        | Vite with HMR                    |
| **File Extensions**  | `.js`                     | `.ts`, `.tsx`                    |
| **Module System**    | ES6 modules               | ES6 + TypeScript paths (@/)      |
| **Build Process**    | None (direct browser)     | Vite build (optimized bundle)    |

### Migration Mapping

Here's how vanilla JS modules map to React components/utilities:

| Vanilla JS                 | React + TypeScript                                     |
| -------------------------- | ------------------------------------------------------ |
| `src/config/constants.js`  | `config/constants.ts`                                  |
| `src/utils/dateTime.js`    | `utils/dateTime.ts`                                    |
| `src/utils/performance.js` | `utils/performance.ts`                                 |
| `src/services/api.js`      | `services/api.ts`                                      |
| `src/data/parser.js`       | `utils/parser.ts`                                      |
| `src/data/processor.js`    | `utils/processor.ts`                                   |
| `src/data/analytics.js`    | `utils/analytics.ts`                                   |
| `src/state/appState.js`    | `store/useAppStore.ts` (Zustand)                       |
| `src/ui/components.js`     | `components/common/*.tsx`                              |
| `src/ui/heatmap.js`        | `components/heatmap/Heatmap.tsx`                       |
| `src/ui/controls.js`       | `components/layout/Header.tsx`                         |
| `src/ui/theme.js`          | `hooks/useTheme.ts` + `components/ui/theme-toggle.tsx` |
| `src/main/app.js`          | `App.tsx` + `main.tsx` + custom hooks                  |

### What Stayed the Same

These core logic modules were migrated with minimal changes (just TypeScript types added):

- ✅ **Timezone handling**: `getETComponents()` logic unchanged
- ✅ **Prediction algorithms**: Same pattern-based prediction logic
- ✅ **Date range generation**: Friday-to-Friday logic intact
- ✅ **CSV parsing**: Same parsing logic (now using PapaParse library)
- ✅ **Heatmap data processing**: Same grid transformation logic
- ✅ **Color scale calculation**: Same intensity thresholds

### What Changed Significantly

**State Management**

```javascript
// OLD - Vanilla JS
import { appState } from './state/appState.js';
appState.currentData = processData(tweets, start, end);
updateHeatmap(appState.currentData);

// NEW - React + Zustand
import { useAppStore } from '@/store/useAppStore';
const { currentData, setDateRange } = useAppStore();
// UI updates automatically when currentData changes
```

**UI Rendering**

```javascript
// OLD - Vanilla JS (Imperative)
function renderHeatmap(data) {
  const container = document.getElementById('heatmap');
  container.innerHTML = '';
  data.grid.forEach((row, i) => {
    const rowEl = document.createElement('tr');
    row.forEach(cell => {
      const cellEl = document.createElement('td');
      cellEl.textContent = cell;
      rowEl.appendChild(cellEl);
    });
    container.appendChild(rowEl);
  });
}

// NEW - React (Declarative)
function Heatmap({ data }: { data: HeatmapData | null }) {
  if (!data) return <EmptyState />;

  return (
    <table>
      {data.grid.map((row, i) => (
        <tr key={i}>
          {row.map((cell, j) => (
            <td key={j}>{cell}</td>
          ))}
        </tr>
      ))}
    </table>
  );
}
```

## Technology Stack

### Core Technologies

- **React 19.1** - Latest React with concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 7.1** - Fast build tool and dev server
- **Zustand 5.0** - Lightweight state management
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - High-quality React components (Radix UI)
- **TanStack Query 5.90** - Server state management (optional/future use)

### Supporting Libraries

- **date-fns 4.1** - Date manipulation utilities
- **PapaParse 5.5** - CSV parsing
- **Axios 1.12** - HTTP client
- **Lucide React** - Icon library
- **class-variance-authority** - Type-safe component variants

## React Architecture

### Directory Structure

The application follows a modern React architecture with clear separation of concerns:

```
react-app/src/
├── components/          # React components
│   ├── common/         # Shared/reusable components
│   │   ├── ErrorDisplay.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── InfoBadge.tsx
│   │   ├── LoadingIndicator.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── SkeletonLoader.tsx
│   ├── heatmap/        # Heatmap-specific components
│   │   ├── EmptyState.tsx
│   │   └── Heatmap.tsx
│   ├── layout/         # Layout components
│   │   └── Header.tsx
│   ├── statistics/     # Statistics display components
│   │   ├── PredictionsCard.tsx
│   │   └── StatisticsCards.tsx
│   └── ui/             # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── theme-toggle.tsx
│       └── tooltip.tsx
├── config/             # Application configuration
│   └── constants.ts    # Constants, thresholds, debug mode
├── hooks/              # Custom React hooks
│   ├── useAutoRefresh.ts
│   ├── useInitialLoad.ts
│   ├── usePerformance.ts
│   ├── useRequestAnimationFrame.ts
│   ├── useScrollIndicators.ts
│   └── useTheme.ts
├── services/           # External service integrations
│   ├── api.ts          # X Tracker API communication
│   └── cache.ts        # LocalStorage caching
├── store/              # Global state management
│   └── useAppStore.ts  # Zustand store (replaces vanilla state)
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Pure utility functions
│   ├── analytics.ts    # Prediction calculations
│   ├── dateRanges.ts   # Date range generation
│   ├── dateTime.ts     # ET timezone handling
│   ├── heatmapStyles.ts # Heatmap styling logic
│   ├── mobile.ts       # Mobile detection/haptics
│   ├── parser.ts       # CSV parsing
│   ├── performance.ts  # Memoization, debounce
│   ├── processor.ts    # Data transformation
│   ├── theme-init.ts   # Theme initialization
│   └── uiHelpers.ts    # UI utility functions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

### Key Architectural Changes from Vanilla JS

#### 1. State Management: Zustand (replaces `state/appState.js`)

- **File**: `store/useAppStore.ts`
- **Features**:
  - Centralized global state with TypeScript support
  - Middleware: devtools, persist, subscribeWithSelector
  - Actions: `loadData`, `uploadCSV`, `downloadCSV`, `setDateRange`, `toggleTheme`, `toggleAutoRefresh`
  - State: rawTweets, currentData, avgData, predictions, selectedRange, isLoading, error, etc.

**Migration Note**: Instead of importing/modifying a global `appState` object, you now use:

```typescript
// Vanilla JS (OLD)
import { appState } from './state/appState.js';
appState.currentData = data;

// React + Zustand (NEW)
import { useAppStore } from '@/store/useAppStore';
const { currentData, setCurrentData } = useAppStore();
```

#### 2. Component-Based UI (replaces `ui/` modules)

- **Vanilla JS**: Imperative DOM manipulation with `renderHeatmap()`, `renderControls()`, etc.
- **React**: Declarative components like `<Heatmap />`, `<Header />`, `<StatisticsCards />`

**Migration Note**: UI updates are now automatic via React's reactivity:

```typescript
// Vanilla JS (OLD)
function updateHeatmap(data) {
  const container = document.getElementById('heatmap');
  container.innerHTML = renderHeatmapHTML(data);
}

// React (NEW)
function Heatmap({ data }: { data: HeatmapData | null }) {
  return (
    <div className="heatmap-container">
      {data ? <HeatmapGrid data={data} /> : <EmptyState />}
    </div>
  );
}
```

#### 3. Custom Hooks (replaces initialization logic)

- **`useInitialLoad`**: Replaces `main/app.js` initialization
- **`useAutoRefresh`**: Replaces auto-refresh timer logic
- **`useTheme`**: Replaces `ui/theme.js`
- **`usePerformance`**: Performance monitoring hook

#### 4. TypeScript Types (replaces JSDoc comments)

- **File**: `types/index.ts`
- Defines interfaces for `Tweet`, `HeatmapData`, `PredictionData`, `DateRange`, `AppState`, etc.
- Compile-time type checking replaces runtime errors

### Module Responsibilities (React Version)

#### `config/constants.ts`

- All application constants (thresholds, intervals, weights)
- Debug mode flag (`DEBUG_MODE`)
- Centralized `debugLog` function
- **When to modify**: Adding new configuration values, changing thresholds

#### `utils/dateTime.ts`

- ET (Eastern Time) timezone handling
- Date parsing and formatting
- ET component extraction (`getETComponents()`)
- Date caching for performance
- **When to modify**: Date/time logic changes, timezone handling updates

#### `utils/performance.ts`

- Memoization utilities
- Debounce/throttle functions
- Performance optimization helpers
- **When to modify**: Adding performance optimizations

#### `services/api.ts`

- X Tracker API communication
- CORS proxy handling with fallbacks
- Network error handling
- **When to modify**: API endpoint changes, new data sources

#### `utils/parser.ts`

- CSV file parsing (using PapaParse)
- Tweet data extraction from CSV
- Year inference for tweets without year
- **When to modify**: CSV format changes, parsing logic improvements

#### `utils/processor.ts`

- Raw tweet data → heatmap grid transformation
- Day label generation
- Date range filtering
- Noon boundary handling
- **When to modify**: Heatmap structure changes, filtering logic

#### `utils/analytics.ts`

- Prediction calculations (Current Pace, Next 24h, End of Range)
- 4-week average computation
- Trend analysis (up/stable/down)
- **When to modify**: New prediction models, analytics features

#### `store/useAppStore.ts`

- Global state management (Zustand)
- Current data storage
- Raw tweets caching
- Auto-refresh timers
- **When to modify**: Adding new global state or actions

#### `components/common/`

- Reusable UI components (ErrorMessage, LoadingSpinner, InfoBadge)
- Type-safe props with TypeScript
- **When to modify**: Adding new reusable components

#### `components/heatmap/Heatmap.tsx`

- Heatmap table rendering
- Color scale application
- Current time highlighting
- Totals/averages row rendering
- **When to modify**: Heatmap visual changes

#### `components/layout/Header.tsx`

- Date range dropdown
- Auto-refresh toggle
- CSV download/upload buttons
- Last update time display
- **When to modify**: Control panel features

#### `hooks/useTheme.ts`

- Dark/light mode toggle logic
- Theme persistence to localStorage
- **When to modify**: Theme-related features

#### `App.tsx`

- Main application component
- Component composition
- Error boundaries (future)
- **When to modify**: App-level layout changes

### Component Import Guidelines

#### ✅ Recommended Import Patterns

```typescript
// Use path aliases for cleaner imports
import { DEBUG_MODE } from '@/config/constants';
import { getETComponents } from '@/utils/dateTime';
import { useAppStore } from '@/store/useAppStore';
import { Heatmap } from '@/components/heatmap/Heatmap';

// Utils can import from config only
import { debugLog } from '@/config/constants';

// Components can import from utils, hooks, store, and types
import { processData } from '@/utils/processor';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import type { HeatmapData } from '@/types';
```

#### ❌ Avoid Anti-Patterns

```typescript
// WRONG - Don't import components in utils
// utils/processor.ts
import { Heatmap } from '@/components/heatmap/Heatmap'; // ❌

// WRONG - Don't use Zustand store outside React components/hooks
// utils/analytics.ts
import { useAppStore } from '@/store/useAppStore';
const data = useAppStore.getState(); // ❌ Only use in React context

// CORRECT - Pass data as parameters in utils
export function calculatePredictions(currentData: HeatmapData, avgData: HeatmapData) {
  // Pure function, no state access
}
```

### Adding New Features

#### Example: Adding a New Prediction Type

1. **Add types** to `types/index.ts`:

   ```typescript
   export interface PredictionData {
     currentPace: number;
     next24h: PredictionWithRange;
     endOfRange: PredictionWithRange;
     newPrediction: number; // NEW
   }
   ```

2. **Add constants** to `config/constants.ts`:

   ```typescript
   export const NEW_PREDICTION_WEIGHT = 0.5;
   ```

3. **Add calculation logic** to `utils/analytics.ts`:

   ```typescript
   export function calculateNewPrediction(currentData: HeatmapData, avgData: HeatmapData): number {
     // Calculation logic
     return result;
   }
   ```

4. **Update Zustand store** to include new prediction:

   ```typescript
   // store/useAppStore.ts
   const predictions = calculatePredictions(currentData, avgData);
   const newPrediction = calculateNewPrediction(currentData, avgData);
   set({ predictions: { ...predictions, newPrediction } });
   ```

5. **Create/update UI component**:

   ```typescript
   // components/statistics/PredictionsCard.tsx
   export function PredictionsCard() {
     const { predictions } = useAppStore();

     return (
       <Card>
         <div>New Prediction: {predictions?.newPrediction}</div>
       </Card>
     );
   }
   ```

## Styling Guidelines - IMPORTANT

### Always Use Tailwind CSS Classes

**IMPORTANT**: This application uses Tailwind CSS. Always use Tailwind utility classes instead of inline styles or custom CSS.

#### Key Principles:

1. **Use Tailwind classes for all styling** - Don't add custom CSS unless absolutely necessary
2. **Use responsive prefixes** - `sm:`, `md:`, `lg:`, `xl:` for responsive design
3. **Use dark mode variants** - `dark:` prefix for dark mode styling
4. **Avoid !important** - Use Tailwind's utility classes which have proper specificity

#### Common Patterns:

```html
<!-- CORRECT - Using Tailwind classes -->
<span class="text-[9px] sm:text-[11px]">Text</span>

<!-- WRONG - Using inline styles -->
<span style="font-size: 11px">Text</span>

<!-- WRONG - Using custom CSS -->
<style>
  .custom-text {
    font-size: 11px;
  }
</style>
```

#### Responsive Text Sizes:

- Mobile: `text-[9px]`
- Tablet/Desktop: `sm:text-[11px]`

### UI Modification Checklist

**CRITICAL**: When making ANY UI modifications, you MUST check ALL views:

1. **Mobile View** (< 640px)
   - Check font sizes, padding, margins
   - Verify touch targets are at least 44px
   - Ensure no horizontal overflow
   - Test portrait and landscape orientations

2. **Tablet View** (640px - 1024px)
   - Check `sm:` and `md:` breakpoint classes
   - Verify grid layouts (especially 3x2, 2x2 configurations)
   - Ensure proper spacing between elements

3. **Desktop View** (> 1024px)
   - Check `lg:` and `xl:` breakpoint classes
   - Verify flex and grid layouts
   - Ensure consistent alignment and spacing

4. **Dark Mode**
   - Test all views in both light and dark modes
   - Verify `dark:` variant classes are applied
   - Check contrast and readability

#### Common Areas to Check:

- Header (title, buttons, dropdown)
- Statistics/Indicators section
- Predictions section
- Heatmap titles and cells
- Legend/color scale
- TOTALS/AVG rows
- Hour labels

**Remember**: One change can affect multiple views. Always test thoroughly!

## Timezone Handling - CRITICAL

### Always Use ET (Eastern Time) for All Date/Time Operations

**IMPORTANT**: This application must handle all dates and times in ET (Eastern Time) timezone, NOT local timezone.

### Use getETComponents() Function

For ANY date/time operation that needs to know the day of week, hour, day, month, or year, you MUST use the `getETComponents()` function:

```javascript
// CORRECT - Use getETComponents
const etComponents = getETComponents(date);
const dayOfWeek = etComponents.dayOfWeek;
const hour = etComponents.hour;
const day = etComponents.day;

// WRONG - Never use these directly
const dayOfWeek = date.getDay(); // ❌ Returns local timezone
const hour = date.getHours(); // ❌ Returns local timezone
const day = date.getDate(); // ❌ Returns local timezone
const month = date.getMonth(); // ❌ Returns local timezone
const year = date.getFullYear(); // ❌ Returns local timezone
```

### Common Pitfalls to Avoid

1. **Never use `setDate()`, `setHours()`, etc.** - These operate in local timezone
   - Instead use: `setTime()` with millisecond calculations
   - Example: `date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))`

2. **Never hardcode timezone offsets** - EDT/EST changes throughout the year
   - Wrong: `T12:00:00-05:00` (hardcoded EST)
   - Use getETComponents to let the system handle DST transitions

3. **Date range calculations** - Always verify dates are in ET
   - When creating noon dates, create them in local time then use getETComponents
   - When comparing dates, ensure both are processed through getETComponents

### Key Areas Where This Matters

1. **Heatmap day labels** - Must show correct day of week in ET
2. **Current time highlighting** - Must highlight based on ET current time
3. **Date range selection** - Friday noon to Friday noon in ET
4. **Tweet timestamp parsing** - Already in ET from source, just parse correctly
5. **4-week average calculations** - Must align with ET week boundaries

### Testing Checklist

When working from a different timezone (e.g., KST), verify:

- [ ] Current hour highlights the correct cell based on ET time
- [ ] Day labels match ET days (not local days)
- [ ] Friday-to-Friday ranges start/end at ET noon
- [ ] Date range dropdown shows correct day names (FRI-FRI, not THU-THU)

### Reference Implementation

The `getETComponents()` function (in `utils/dateTime.js`) returns:

```javascript
{
  year: number,      // ET year
  month: number,     // ET month (0-11)
  day: number,       // ET day of month
  hour: number,      // ET hour (0-23)
  minute: number,    // ET minute
  second: number,    // ET second
  dayOfWeek: number  // ET day of week (0=Sunday, 5=Friday)
}
```

Always use this function instead of native Date methods when you need timezone-aware values.

## Critical: Heatmap Date Handling Checklist

**IMPORTANT**: When modifying ANY date-related logic in the heatmaps, you MUST update ALL FOUR components:

### ✅ Required Updates for Date Changes:

1. **Cell Data Mapping** (`utils/processor.ts` → `processData()`)
   - Ensure tweets are mapped to correct day columns based on ET time
   - Check date range filtering uses ET dates
   - Verify noon filtering (first Friday before noon, last Friday after noon)

2. **Day Labels** (`utils/processor.ts` → `generateDayLabels()`)
   - Current week heatmap: Must show correct ET day names
   - 4-week average heatmap: Must match current week's day pattern
   - Both should show FRI-SAT-SUN-MON-TUE-WED-THU-FRI for Friday ranges

3. **Current Time Highlighting** (`components/heatmap/Heatmap.tsx` → cell rendering logic)
   - Must highlight cell based on ET current time
   - Check both current week AND 4-week average heatmaps
   - Verify same day-of-week + hour logic uses ET
   - Uses `getETComponents()` to compare current time with cell time

4. **4-Week Average Calculation** (`utils/analytics.ts` → `calculate4WeekAverage()`)
   - Must use same ET date handling as current week
   - Week boundaries must align with ET noon transitions
   - Past week calculations must use ET dates

### Common Issues When Not Updating All Components:

- **Symptom**: Labels show FRI-FRI but data appears shifted by a day
  - **Cause**: Labels updated but cell mapping still uses local timezone
  - **Fix**: Update `processData()` in `utils/processor.ts`

- **Symptom**: Current time highlights wrong cell
  - **Cause**: Current time check not using ET components
  - **Fix**: Update current time logic in `components/heatmap/Heatmap.tsx`

- **Symptom**: 4-week average shows different days than current week
  - **Cause**: 4-week calculation not updated to match current week logic
  - **Fix**: Update `calculate4WeekAverage()` in `utils/analytics.ts`

### Quick Verification Steps:

1. Enable debug mode: Set `DEBUG_MODE = true` in `config/constants.ts`
2. Check console logs for date debug output
3. Verify current hour highlights correct cell (ET hour)
4. Confirm day labels match actual data distribution
5. Compare current week and 4-week average alignment
6. Use React DevTools to inspect component props

**Remember**: ANY date operation should use `getETComponents()` from `utils/dateTime.ts` or `createETNoonDate()` helper.

## Advanced Prediction Algorithms

### Pattern-Based Prediction System

The application uses sophisticated pattern-based predictions that consider time-of-day and day-of-week patterns, significantly improving accuracy over simple averages.

#### Key Components

**1. Pattern-Based Next 24h Prediction** (`utils/analytics.ts` → `predictNext24hWithPattern()`)

Instead of using a simple hourly average, this function:

- Iterates through each of the next 24 hours
- For each hour, retrieves the corresponding 4-week average value for that specific time-of-day and day-of-week
- Applies a combined factor of trend and momentum
- Sums all hourly predictions

**Benefits**:

- ✅ Captures time-of-day patterns (morning vs. evening activity)
- ✅ Automatically reflects day-of-week differences (weekday vs. weekend)
- ✅ More accurate than flat hourly averages

**2. Momentum Calculation** (`utils/analytics.ts` → `calculateRecentMomentum()`)

Analyzes the last 6 hours to detect acceleration or deceleration:

```javascript
Momentum = (Recent 6h actual) / (Recent 6h expected from 4-week avg)
```

**Use cases**:

- Detects sudden spikes or drops in activity
- Gives more weight to very recent behavior
- Complements long-term trend factor

**3. Confidence Intervals** (`utils/analytics.ts` → `calculatePredictionConfidence()`)

Provides 90% confidence intervals based on historical variance:

```javascript
stdDev = sqrt(variance of 4-week average data)
margin = stdDev × 1.5 × sqrt(24)  // for 24-hour prediction
min = prediction - margin
max = prediction + margin
```

**Display format**: `55 (45-65)` - prediction with 90% confidence interval always visible

#### Helper Functions

**`getDayIndexFromStart(time, startDate)`**

- Calculates day index (0-7) relative to range start
- Handles ET timezone correctly
- Returns -1 if outside range

**`getGridValue(grid, hour, day)`**

- Safely retrieves grid value with boundary checks
- Enforces noon boundaries (day 0 hour < 12, day 7 hour >= 12)
- Returns 0 for invalid cells

#### Prediction Flow

```
1. Calculate Trend Factor
   └─> current total / comparable 4-week average

2. Calculate Momentum (last 6 hours)
   └─> recent 6h actual / recent 6h expected

3. For Next 24h:
   For each hour (i = 0 to 23):
     ├─> Get future time (now + i hours)
     ├─> Get day index and hour
     ├─> Retrieve 4-week average for that hour/day
     ├─> Combined Factor = (momentum × 0.3) + (trend × 0.7)
     └─> Prediction += avgValue × combinedFactor

4. Calculate Confidence Interval
   ├─> Compute variance across 4-week data
   ├─> Scale for 24-hour timeframe
   └─> Return min/max bounds

5. For End of Range:
   ├─> Similar pattern-based approach for all remaining hours
   └─> Wider confidence interval (scales with time)
```

#### When to Modify Prediction Logic

**Adjusting weights**:

```typescript
// In utils/analytics.ts
const combinedFactor = momentum * 0.3 + trendFactor * 0.7;
```

- Increase momentum weight (e.g., 0.4) for more reactivity to recent changes
- Increase trend weight (e.g., 0.8) for more stability

**Changing momentum window**:

```typescript
// In calculatePredictionsInternal()
const momentum = calculateRecentMomentum(currentData, avgData, now, startDate, 6);
//                                                                              ^^
// Change from 6 to different number of hours
```

**Adjusting confidence intervals**:

```typescript
// In calculatePredictionConfidence()
const margin = predictionStdDev * 1.5; // Change 1.5 to widen/narrow interval
```

#### Debugging Predictions

Enable `DEBUG_MODE` in `config/constants.ts` to see detailed logs:

```typescript
export const DEBUG_MODE = true;
```

Look for these console logs:

- **Recent Momentum**: Shows last 6h actual vs expected
- **Next 24h Pattern Prediction**: Details first 6 hours of prediction
- **End of Range Prediction**: Remaining hours calculation
- **Final Predictions Summary**: All metrics with ranges

#### Common Prediction Issues

**Issue**: Predictions seem too high/low

**Diagnosis**:

1. Check DEBUG logs for trend factor and momentum
2. Verify 4-week average data is representative
3. Confirm date range is correctly parsed

**Fix**:

- Adjust combined factor weights in `utils/analytics.ts`
- Check for data quality issues (missing tweets, parsing errors)
- Use Zustand DevTools to inspect state

**Issue**: Confidence intervals too wide/narrow

**Diagnosis**:

1. Check standard deviation in DEBUG logs
2. Examine 4-week data variance
3. Inspect prediction state in Zustand DevTools

**Fix**:

- Adjust margin multiplier in `calculatePredictionConfidence()` in `utils/analytics.ts`
- If data is very stable, variance will be low (narrow intervals)
- If data is volatile, variance will be high (wide intervals)

## Performance Considerations

### Caching Strategy

The application uses multiple caching layers to optimize performance:

1. **Date Parsing Cache** (`utils/dateTime.ts`)
   - Caches parsed Twitter dates to avoid re-parsing
   - LRU eviction when cache exceeds `MAX_CACHE_SIZE` (1000)

2. **ET Components Cache** (`utils/dateTime.ts`)
   - Caches ET component extraction results
   - Keyed by timestamp for fast lookup

3. **Memoization** (`utils/performance.ts`)
   - Memoizes expensive computation results
   - Use `memoize()` wrapper for pure functions
   - Max cache size: `MEMO_CACHE_MAX` (50)

4. **LocalStorage Caching** (`services/cache.ts`)
   - Caches fetched tweet data to reduce API calls
   - Persists theme preference
   - Stores last selected date range
   - Zustand persist middleware for state persistence

### When to Add Caching

✅ **Good candidates for caching:**

- Repeated date parsing (already implemented)
- Complex calculations with same inputs
- API responses (consider TTL)
- Heatmap color calculations

❌ **Don't cache:**

- One-time calculations
- Functions with side effects
- Current time checks

### Debounce/Throttle Usage

Located in `utils/performance.ts`:

```typescript
import { debounce, throttle } from '@/utils/performance';

// Debounce: Wait for user to stop typing
const handleSearch = debounce((query: string) => {
  // Search logic
}, 300);

// Throttle: Limit scroll event handling
const handleScroll = throttle(() => {
  // Update scroll indicators
}, 100);
```

### React-Specific Performance

**1. Custom Hooks for Performance**

- `usePerformance.ts`: Performance monitoring hook
- `useRequestAnimationFrame.ts`: RAF-based animations
- `useScrollIndicators.ts`: Optimized scroll tracking

**2. Zustand Optimizations**

- Minimal re-renders (only subscribing components update)
- Selective subscription to specific state slices
- Devtools middleware for debugging without perf impact

**3. React Rendering Optimizations**

- Proper key props in lists
- Avoid inline function definitions in render
- Use `useMemo` and `useCallback` where appropriate (sparingly)

## Development Workflow

### Quick Start

1. **Install dependencies**:

   ```bash
   cd react-app
   yarn install
   ```

2. **Start dev server**:

   ```bash
   yarn dev
   # Opens at http://localhost:5173 with HMR (Hot Module Replacement)
   ```

3. **Enable debug logs**: Set `DEBUG_MODE = true` in `config/constants.ts`

4. **Make changes**: Edit files in `react-app/src/`
   - Changes hot-reload instantly (no manual refresh needed)
   - TypeScript errors show in terminal and browser

5. **Build for production**:

   ```bash
   yarn build
   # Output in react-app/dist/
   ```

6. **Preview production build**:
   ```bash
   yarn preview
   ```

### Available Scripts

```bash
yarn dev          # Start dev server with HMR
yarn build        # TypeScript compile + Vite build
yarn preview      # Preview production build locally
yarn lint         # Run ESLint
yarn lint:fix     # Auto-fix ESLint issues
yarn format       # Format code with Prettier
yarn format:check # Check code formatting
yarn type-check   # TypeScript type checking only
```

### Testing Checklist

Before committing changes:

- [ ] Run `yarn type-check` - No TypeScript errors
- [ ] Run `yarn lint` - No ESLint errors
- [ ] Run `yarn build` - Production build succeeds
- [ ] Test in Chrome/Safari/Firefox
- [ ] Test mobile view (< 640px)
- [ ] Test tablet view (640-1024px)
- [ ] Test desktop view (> 1024px)
- [ ] Test dark mode toggle
- [ ] Verify ET timezone handling (if date-related)
- [ ] Check browser console for errors (F12)
- [ ] Verify auto-refresh works (toggle on/off)
- [ ] Test CSV upload functionality
- [ ] Check React DevTools for unnecessary re-renders

### Common Development Tasks

#### Adding a New Configuration

1. Add to `config/constants.ts`:

   ```typescript
   export const MY_NEW_SETTING = 42;
   ```

2. Import where needed (use path alias):
   ```typescript
   import { MY_NEW_SETTING } from '@/config/constants';
   ```

#### Adding a New Date Utility

1. Add to `utils/dateTime.ts`:

   ```typescript
   export function myDateFunction(date: Date): string {
     const et = getETComponents(date);
     // Use ET components, not date.get*()
     return result;
   }
   ```

2. Import where needed:
   ```typescript
   import { myDateFunction } from '@/utils/dateTime';
   ```

#### Adding a New React Component

1. Create component file (e.g., `components/common/MyComponent.tsx`):

   ```typescript
   import React from 'react';

   interface MyComponentProps {
     data: string;
     onAction?: () => void;
   }

   export function MyComponent({ data, onAction }: MyComponentProps) {
     return (
       <div className="p-4">
         <p>{data}</p>
         {onAction && (
           <button onClick={onAction}>Action</button>
         )}
       </div>
     );
   }
   ```

2. Use in parent component:

   ```typescript
   import { MyComponent } from '@/components/common/MyComponent';

   function ParentComponent() {
     return <MyComponent data="Hello" onAction={() => alert('Clicked')} />;
   }
   ```

#### Adding a New Analytics Function

1. Add to `utils/analytics.ts`:

   ```typescript
   import type { HeatmapData, DateRange } from '@/types';

   export function calculateMyMetric(currentData: HeatmapData, avgData: HeatmapData): number {
     // Calculation logic (pure function)
     return result;
   }
   ```

2. Use in Zustand store or component:

   ```typescript
   // In store/useAppStore.ts
   import { calculateMyMetric } from '@/utils/analytics';

   const metric = calculateMyMetric(currentData, avgData);
   set({ myMetric: metric });
   ```

#### Adding State to Zustand Store

1. Update `store/useAppStore.ts`:

   ```typescript
   // Add to state interface
   interface AppState {
     // ... existing state
     myNewState: string | null;
     setMyNewState: (value: string) => void;
   }

   // Add to store
   export const useAppStore = create<AppState>()((set, get) => ({
     // ... existing state
     myNewState: null,

     setMyNewState: (value: string) => {
       set({ myNewState: value });
     },
   }));
   ```

2. Use in component:

   ```typescript
   function MyComponent() {
     const { myNewState, setMyNewState } = useAppStore();

     return (
       <div>
         <p>{myNewState}</p>
         <button onClick={() => setMyNewState('New Value')}>
           Update
         </button>
       </div>
     );
   }
   ```

### Debugging Tips

1. **Enable debug mode** for verbose console logs:

   ```typescript
   // config/constants.ts
   export const DEBUG_MODE = true;
   ```

2. **Check Network tab** for API failures in DevTools

3. **Use React DevTools**:
   - Install React DevTools browser extension
   - Inspect component hierarchy
   - Check component props/state
   - Profile re-renders

4. **Use Zustand DevTools**:
   - Store has devtools middleware enabled
   - Open Redux DevTools extension
   - View state history and time-travel debug

5. **Inspect date handling**:

   ```typescript
   const date = new Date();
   console.log('UTC:', date.toISOString());
   console.log('ET:', getETComponents(date));
   ```

6. **TypeScript type checking**:

   ```bash
   yarn type-check  # Check types without building
   ```

7. **Use browser breakpoints** in DevTools:
   - Source maps enabled for debugging TypeScript
   - Set breakpoints in `.tsx/.ts` files directly

8. **Check Zustand state** via console:

   ```typescript
   // In browser console
   useAppStore.getState();
   ```

9. **Vite HMR debugging**:
   - If HMR breaks, refresh page manually
   - Check terminal for Vite errors
   - Clear Vite cache: `rm -rf node_modules/.vite`

### TypeScript Tips

#### Use Type Imports

```typescript
// Prefer this for types
import type { HeatmapData } from '@/types';

// Over this (imports both type and value)
import { HeatmapData } from '@/types';
```

#### Avoid `any` Type

```typescript
// WRONG
function processTweets(data: any) { ... }

// CORRECT
function processTweets(data: Tweet[]) { ... }
```

#### Use Type Guards

```typescript
function isHeatmapData(data: unknown): data is HeatmapData {
  return typeof data === 'object' && data !== null && 'grid' in data && 'hours' in data;
}
```

## Troubleshooting

### Issue: Heatmap shows wrong days

**Symptoms**: Day labels don't match data distribution

**Diagnosis**:

1. Enable `DEBUG_MODE` in `config/constants.ts`
2. Check console for "DATE RANGE DEBUG" logs
3. Compare `Generated days for range` with expected days

**Fix**: Update `generateDayLabels()` in `utils/processor.ts` to use `getETComponents()`

### Issue: Current time not highlighting

**Symptoms**: Blue border doesn't appear on current hour cell

**Diagnosis**:

1. Check current time logic in `components/heatmap/Heatmap.tsx`
2. Verify it uses `getETComponents()` for current time
3. Console log current ET hour vs. cell hour

**Fix**: Ensure both current time calculation and day labels use ET components

### Issue: API not loading data

**Symptoms**: "Failed to load tweets" error

**Diagnosis**:

1. Check Network tab for CORS errors
2. Check terminal for Vite/API errors
3. Try different CORS proxy in `services/api.ts`
4. Test with manual CSV upload

**Fix**:

- Update proxy URL in `services/api.ts`
- Use CSV fallback upload feature
- Check if API endpoint is still valid

### Issue: Predictions seem wrong

**Symptoms**: Unrealistic prediction numbers

**Diagnosis**:

1. Check prediction weights in `config/constants.ts`
2. Verify 4-week average calculation in `utils/analytics.ts`
3. Console log intermediate calculation steps
4. Use Zustand DevTools to inspect state

**Fix**: Adjust weights or fix calculation logic in `utils/analytics.ts`

### Issue: TypeScript compilation errors

**Symptoms**: Build fails with type errors

**Diagnosis**:

1. Run `yarn type-check` to see all type errors
2. Check for missing type imports
3. Verify interface definitions match usage

**Fix**:

- Add missing type imports: `import type { ... } from '@/types'`
- Update interface definitions in `types/index.ts`
- Use proper TypeScript types instead of `any`

### Issue: Component not re-rendering

**Symptoms**: UI doesn't update when state changes

**Diagnosis**:

1. Check if you're using Zustand store correctly
2. Verify component subscribes to store changes
3. Use React DevTools to inspect props/state

**Fix**:

```typescript
// WRONG - Not subscribing to store
const store = useAppStore.getState();

// CORRECT - Component subscribes and re-renders
const { currentData } = useAppStore();
```

### Issue: Vite HMR not working

**Symptoms**: Changes don't hot-reload

**Diagnosis**:

1. Check terminal for Vite errors
2. Look for syntax errors in modified files
3. Check for circular dependencies

**Fix**:

- Refresh browser manually
- Restart dev server: `yarn dev`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for syntax errors in recent changes
