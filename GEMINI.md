# Elon Tracker - Important Development Notes

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

The `getETComponents()` function is already implemented and returns:
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

1. **Cell Data Mapping** (`processData` function)
   - Ensure tweets are mapped to correct day columns based on ET time
   - Check date range filtering uses ET dates
   - Verify noon filtering (first Friday before noon, last Friday after noon)

2. **Day Labels** (header row)
   - Current week heatmap: Must show correct ET day names
   - 4-week average heatmap: Must match current week's day pattern
   - Both should show FRI-SAT-SUN-MON-TUE-WED-THU-FRI for Friday ranges

3. **Current Time Highlighting**
   - Must highlight cell based on ET current time
   - Check both current week AND 4-week average heatmaps
   - Verify same day-of-week + hour logic uses ET

4. **4-Week Average Calculation** (`calculate4WeekAverage` function)
   - Must use same ET date handling as current week
   - Week boundaries must align with ET noon transitions
   - Past week calculations must use ET dates

### Common Issues When Not Updating All Components:

- **Symptom**: Labels show FRI-FRI but data appears shifted by a day
  - **Cause**: Labels updated but cell mapping still uses local timezone

- **Symptom**: Current time highlights wrong cell
  - **Cause**: Current time check not using ET components

- **Symptom**: 4-week average shows different days than current week
  - **Cause**: 4-week calculation not updated to match current week logic

### Quick Verification Steps:

1. Check console logs for date debug output
2. Verify current hour highlights correct cell (ET hour)
3. Confirm day labels match actual data distribution
4. Compare current week and 4-week average alignment

**Remember**: ANY date operation should use `getETComponents()` or create dates at ET noon using UTC hours (16 for EDT, 17 for EST).