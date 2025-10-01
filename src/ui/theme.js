/**
 * Theme management - Dark mode toggle and initialization
 */

/**
 * Toggle between light and dark mode
 */
export function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");

  if (isDark) {
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
    document.getElementById("darkModeIcon").textContent = "🌙";
  } else {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
    document.getElementById("darkModeIcon").textContent = "☀️";
  }
}

/**
 * Initialize theme based on saved preference or system preference
 */
export function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
    document.getElementById("darkModeIcon").textContent = "☀️";
  }
}
