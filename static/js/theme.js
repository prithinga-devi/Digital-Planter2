/**
 * Theme Toggle Functionality
 * Handles Light/Dark mode switching and persistence
 */

const THEME_KEY = 'digital_planter_theme';

/**
 * Get the current theme from localStorage or system preference
 */
function getStoredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update toggle button icon
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = theme === 'dark' ? "<i class='bx bx-sun'></i>" : "<i class='bx bx-moon'></i>";
        toggleBtn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Night Nursery';
    }
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
}

/**
 * Initialize theme on page load
 */
function initTheme() {
    const theme = getStoredTheme();
    applyTheme(theme);

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// Export for module usage
export { toggleTheme, applyTheme, getStoredTheme };
