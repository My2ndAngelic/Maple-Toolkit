// Common UI elements and functionality
export const navbar = `
  <div id="navbar">    
    <div class="dropdown">
      <button id="bosscrystalDropdownBtn">Boss Crystal ▼</button>
      <div class="dropdown-content">
        <a href="bosscrystal_daily.html">Daily</a>
        <a href="bosscrystal_weekly.html">Weekly</a>
      </div>
    </div>
    <button onclick="window.location.href='challenger.html'">Challenger World</button>
    <button id="darkModeToggle">🌙 Dark Mode</button>
  </div>
`;

export function initializeUI() {
    // Only insert navbar if it doesn't already exist
    if (!document.getElementById('navbar')) {
        // Insert navbar at the start of the body
        document.body.insertAdjacentHTML('afterbegin', navbar);
    }

    // Get the current page name from the HTML filename
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    // Convert first letter to uppercase and replace dashes with spaces
    const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');

    // Set the page title in the browser tab
    document.title = `MapleStory Tracker - ${formattedPageName}`;

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