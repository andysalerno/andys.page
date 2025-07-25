// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function () {
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleText = document.getElementById('theme-toggle-text');
    const html = document.documentElement;

    // Get saved theme preference or determine from system
    let currentTheme = localStorage.getItem('theme');

    // If no saved preference, detect system preference
    if (!currentTheme) {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Function to update theme toggle text and aria-label
    function updateToggleText(theme) {
        if (theme === 'dark') {
            themeToggleText.textContent = '☀️';
            themeToggle.setAttribute('aria-label', 'Switch to light theme');
        } else {
            themeToggleText.textContent = '🌙';
            themeToggle.setAttribute('aria-label', 'Switch to dark theme');
        }
    }

    // Function to apply theme
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        updateToggleText(theme);
        localStorage.setItem('theme', theme);
    }

    // Apply current theme on load
    applyTheme(currentTheme);

    // Simple toggle between light and dark
    themeToggle.addEventListener('click', function () {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
    });
});