/**
 * Pre-hydration inline script to prevent theme flicker (FOUC).
 * Reads Zustand persist format from localStorage and applies
 * data-theme + color-scheme to <html> before React hydrates.
 */
export const themeInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('app-storage');
    if (raw) {
      var parsed = JSON.parse(raw);
      var theme = parsed && parsed.state && parsed.state.theme;
      if (theme) {
        var isDark = theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        var resolved = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.style.colorScheme = resolved;
      }
    }
  } catch (e) {}
})();
`;
