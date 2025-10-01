# Elon Tracker - Important Development Notes

## Module Architecture

### Directory Structure

The application follows a modular architecture with clear separation of concerns:

```
src/
├── config/         # Application-wide configuration
├── utils/          # Pure utility functions (date/time, performance)
├── services/       # External API communication
├── data/           # Data processing and analysis logic
├── state/          # Global application state
├── ui/             # UI rendering and user interactions
└── main/           # Application initialization and orchestration
```

### Module Responsibilities

#### `config/constants.js`
- All application constants (thresholds, intervals, weights)
- Debug mode flag
- Centralized debugLog function
- **When to modify**: Adding new configuration values, changing thresholds

#### `utils/dateTime.js`
- ET (Eastern Time) timezone handling
- Date parsing and formatting
- ET component extraction (`getETComponents()`)
- Date caching for performance
- **When to modify**: Date/time logic changes, timezone handling updates

#### `utils/performance.js`
- Memoization utilities
- Debounce/throttle functions
- Performance optimization helpers
- **When to modify**: Adding performance optimizations

#### `services/api.js`
- X Tracker API communication
- CORS proxy handling
- Network error handling
- **When to modify**: API endpoint changes, new data sources

#### `data/parser.js`
- CSV file parsing
- Tweet data extraction from CSV
- Year inference for tweets without year
- **When to modify**: CSV format changes, parsing logic improvements

#### `data/processor.js`
- Raw tweet data → heatmap grid transformation
- Day label generation
- Date range filtering
- Noon boundary handling
- **When to modify**: Heatmap structure changes, filtering logic

#### `data/analytics.js`
- Prediction calculations (Current Pace, Next 24h, End of Range)
- 4-week average computation
- Trend analysis (up/stable/down)
- **When to modify**: New prediction models, analytics features

#### `state/appState.js`
- Global state management
- Current data storage
- Raw tweets caching
- Auto-refresh timers
- **When to modify**: Adding new global state

#### `ui/components.js`
- Reusable UI components (tooltip, buttons)
- Haptic feedback for mobile
- Touch event handlers
- **When to modify**: Adding new UI components

#### `ui/uiHelpers.js`
- DOM element references
- Scroll indicators
- UI utility functions
- **When to modify**: DOM manipulation utilities

#### `ui/heatmap.js`
- Heatmap table rendering
- Color scale application
- Current time highlighting
- Totals/averages row rendering
- **When to modify**: Heatmap visual changes

#### `ui/controls.js`
- Date range dropdown population
- Auto-refresh toggle
- CSV download
- File upload handling
- Last update time display
- **When to modify**: Control panel features

#### `ui/theme.js`
- Dark/light mode toggle
- Theme persistence to localStorage
- **When to modify**: Theme-related features

#### `main/app.js`
- Application initialization
- Module orchestration
- Data loading workflow
- Event listener setup
- **When to modify**: App initialization flow, wiring new modules

### Module Import Guidelines

#### ✅ Allowed Import Patterns

```javascript
// Utilities can import from config only
import { DEBUG_MODE } from '../config/constants.js';

// Data modules can import from config and utils
import { getETComponents } from '../utils/dateTime.js';
import { HOURS_IN_DAY } from '../config/constants.js';

// UI modules can import from config, utils, and data
import { processData } from '../data/processor.js';
import { memoize } from '../utils/performance.js';

// Main app imports from everything
import { API } from '../services/api.js';
import { processData } from '../data/processor.js';
import { renderHeatmap } from '../ui/heatmap.js';
```

#### ❌ Avoid Circular Dependencies

```javascript
// WRONG - Don't import UI from data modules
// data/processor.js
import { renderHeatmap } from '../ui/heatmap.js'; // ❌

// WRONG - Don't import app.js from other modules
// ui/controls.js
import { loadData } from '../main/app.js'; // ❌
```

### Adding New Features

#### Example: Adding a New Prediction Type

1. **Add constants** to `config/constants.js`:
   ```javascript
   export const NEW_PREDICTION_WEIGHT = 0.5;
   ```

2. **Add calculation logic** to `data/analytics.js`:
   ```javascript
   export function calculateNewPrediction(data) { ... }
   ```

3. **Add UI rendering** to `ui/heatmap.js` or create new UI module:
   ```javascript
   export function renderNewPrediction(value) { ... }
   ```

4. **Wire it up** in `main/app.js`:
   ```javascript
   import { calculateNewPrediction } from '../data/analytics.js';
   const prediction = calculateNewPrediction(currentData);
   renderNewPrediction(prediction);
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
  .custom-text { font-size: 11px; }
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
const dayOfWeek = date.getDay();        // ❌ Returns local timezone
const hour = date.getHours();           // ❌ Returns local timezone
const day = date.getDate();             // ❌ Returns local timezone
const month = date.getMonth();          // ❌ Returns local timezone
const year = date.getFullYear();        // ❌ Returns local timezone
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

1. **Cell Data Mapping** (`data/processor.js` → `processData()`)
   - Ensure tweets are mapped to correct day columns based on ET time
   - Check date range filtering uses ET dates
   - Verify noon filtering (first Friday before noon, last Friday after noon)

2. **Day Labels** (`data/processor.js` → `generateDayLabels()`)
   - Current week heatmap: Must show correct ET day names
   - 4-week average heatmap: Must match current week's day pattern
   - Both should show FRI-SAT-SUN-MON-TUE-WED-THU-FRI for Friday ranges

3. **Current Time Highlighting** (`ui/heatmap.js` → `isCurrentHour()`)
   - Must highlight cell based on ET current time
   - Check both current week AND 4-week average heatmaps
   - Verify same day-of-week + hour logic uses ET

4. **4-Week Average Calculation** (`data/analytics.js` → `calculate4WeekAverage()`)
   - Must use same ET date handling as current week
   - Week boundaries must align with ET noon transitions
   - Past week calculations must use ET dates

### Common Issues When Not Updating All Components:

- **Symptom**: Labels show FRI-FRI but data appears shifted by a day
  - **Cause**: Labels updated but cell mapping still uses local timezone
  - **Fix**: Update `processData()` in `data/processor.js`

- **Symptom**: Current time highlights wrong cell
  - **Cause**: Current time check not using ET components
  - **Fix**: Update `isCurrentHour()` in `ui/heatmap.js`

- **Symptom**: 4-week average shows different days than current week
  - **Cause**: 4-week calculation not updated to match current week logic
  - **Fix**: Update `calculate4WeekAverage()` in `data/analytics.js`

### Quick Verification Steps:

1. Enable debug mode: Set `DEBUG_MODE = true` in `config/constants.js`
2. Check console logs for date debug output
3. Verify current hour highlights correct cell (ET hour)
4. Confirm day labels match actual data distribution
5. Compare current week and 4-week average alignment

**Remember**: ANY date operation should use `getETComponents()` from `utils/dateTime.js` or `createETNoonDate()` helper.

## Performance Considerations

### Caching Strategy

The application uses multiple caching layers to optimize performance:

1. **Date Parsing Cache** (`utils/dateTime.js`)
   - Caches parsed Twitter dates to avoid re-parsing
   - LRU eviction when cache exceeds `MAX_CACHE_SIZE` (1000)

2. **ET Components Cache** (`utils/dateTime.js`)
   - Caches ET component extraction results
   - Keyed by timestamp for fast lookup

3. **Memoization** (`utils/performance.js`)
   - Memoizes expensive computation results
   - Use `memoize()` wrapper for pure functions
   - Max cache size: `MEMO_CACHE_MAX` (50)

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

Located in `utils/performance.js`:

```javascript
import { debounce, throttle } from '../utils/performance.js';

// Debounce: Wait for user to stop typing
const handleSearch = debounce((query) => {
  // Search logic
}, 300);

// Throttle: Limit scroll event handling
const handleScroll = throttle(() => {
  // Update scroll indicators
}, 100);
```

## Development Workflow

### Quick Start

1. **Clone/setup**: Just open `index.html` in a browser
2. **Enable debug logs**: Set `DEBUG_MODE = true` in `config/constants.js`
3. **Make changes**: Edit relevant module in `src/`
4. **Test**: Refresh browser, check console logs

### Testing Checklist

Before committing changes:

- [ ] Test in Chrome/Safari/Firefox
- [ ] Test mobile view (< 640px)
- [ ] Test tablet view (640-1024px)
- [ ] Test desktop view (> 1024px)
- [ ] Test dark mode
- [ ] Verify ET timezone handling (if date-related)
- [ ] Check console for errors (F12)
- [ ] Verify auto-refresh works
- [ ] Test with sample CSV upload

### Common Development Tasks

#### Adding a New Configuration

1. Add to `config/constants.js`:
   ```javascript
   export const MY_NEW_SETTING = 42;
   ```

2. Import where needed:
   ```javascript
   import { MY_NEW_SETTING } from '../config/constants.js';
   ```

#### Adding a New Date Utility

1. Add to `utils/dateTime.js`:
   ```javascript
   export function myDateFunction(date) {
     const et = getETComponents(date);
     // Use ET components, not date.get*()
     return result;
   }
   ```

2. Export and import where needed

#### Adding a New UI Component

1. Add to `ui/components.js` (or create new file):
   ```javascript
   export function createMyComponent(data) {
     const element = document.createElement('div');
     // Build component
     return element;
   }
   ```

2. Import in `main/app.js` and wire up

#### Adding a New Analytics Function

1. Add to `data/analytics.js`:
   ```javascript
   export function calculateMyMetric(tweets, dateRange) {
     // Calculation logic
     return result;
   }
   ```

2. Call from `main/app.js` in `loadData()` or `updateUI()`

### Debugging Tips

1. **Enable debug mode** for verbose console logs
2. **Check Network tab** for API failures
3. **Inspect date handling**:
   ```javascript
   const date = new Date();
   console.log('UTC:', date.toISOString());
   console.log('ET:', getETComponents(date));
   ```
4. **Use browser breakpoints** in DevTools
5. **Check state** via console:
   ```javascript
   // In browser console
   window.appState
   ```

## Troubleshooting

### Issue: Heatmap shows wrong days

**Symptoms**: Day labels don't match data distribution

**Diagnosis**:
1. Enable `DEBUG_MODE` in `config/constants.js`
2. Check console for "DATE RANGE DEBUG" logs
3. Compare `Generated days for range` with expected days

**Fix**: Update `generateDayLabels()` in `data/processor.js` to use `getETComponents()`

### Issue: Current time not highlighting

**Symptoms**: Blue border doesn't appear on current hour cell

**Diagnosis**:
1. Check `isCurrentHour()` in `ui/heatmap.js`
2. Verify it uses `getETComponents()` for current time
3. Console log current ET hour vs. cell hour

**Fix**: Ensure both current time and day label use ET components

### Issue: API not loading data

**Symptoms**: "Failed to load tweets" error

**Diagnosis**:
1. Check Network tab for CORS errors
2. Try different CORS proxy in `services/api.js`
3. Test with manual CSV upload

**Fix**: Update proxy URL or use CSV fallback

### Issue: Predictions seem wrong

**Symptoms**: Unrealistic prediction numbers

**Diagnosis**:
1. Check prediction weights in `config/constants.js`
2. Verify 4-week average calculation in `data/analytics.js`
3. Console log intermediate calculation steps

**Fix**: Adjust weights or fix calculation logic