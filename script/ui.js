// Common UI elements and functionality
import { initializeNavbar, setPageTitle } from './navbar.js';

export function initializeUI() {
    // Initialize navbar
    initializeNavbar();
    
    // Set page title
    setPageTitle();

    // Update any existing H1 title, or add one if it doesn't exist
    // const container = document.getElementById('container');
    // const existingTitle = container.querySelector('h1');
    
    // if (existingTitle) {
    //     // Just ensure the title is correct
    //     existingTitle.textContent = formattedPageName;
    // }

    // Initialize theme
    initializeTheme();
}

// Export this function so it can be used separately
export function initializeTheme() {
    const darkToggleBtn = document.getElementById('darkModeToggle');
    const themeLink = document.getElementById('themeStylesheet');
    if (!darkToggleBtn || !themeLink) return;
    
    // Load saved theme preference
    const isDark = localStorage.getItem('darkMode') === 'true';
    applyTheme(isDark);
    
    // Set up theme toggle for all pages except overview (which has its own)
    if (!document.getElementById('charTable')) {
        darkToggleBtn.addEventListener('click', () => {
            const currentTheme = localStorage.getItem('darkMode') === 'true';
            applyTheme(!currentTheme);
        });
    }
}

// Export applyTheme for use in other modules
export function applyTheme(isDark) {
    const themeLink = document.getElementById('themeStylesheet');
    const darkToggleBtn = document.getElementById('darkModeToggle');
    if (!themeLink || !darkToggleBtn) return;
    
    // Set theme
    const basePath = window.location.pathname.includes('/html/') ? '../' : '';
    themeLink.href = `${basePath}style/${isDark ? 'style-dark.css' : 'style.css'}`;
    darkToggleBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Add or remove dark-mode class on body element
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('darkMode', isDark);
    
    // Force a redraw of the page to ensure all styles are updated
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
}