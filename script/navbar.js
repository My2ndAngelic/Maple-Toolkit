// Navbar component and functionality

export const navbar = `
  <div id="navbar">    
    <div class="dropdown">
      <button class="dropdownBtn">Boss Crystal ▼</button>
      <div class="dropdown-content">
        <a href="bosscrystal_daily.html">Daily</a>
        <a href="bosscrystal_weekly.html">Weekly</a>
      </div>
    </div>
    <button onclick="window.location.href='challenger.html'">Challenger World</button>
    <div class="dropdown">
    <button class="dropdownBtn">External Resource ▼</button>
    <div class="dropdown-content">
        <a href="https://google.com">Placeholder 1</a>
        <a href="https://yahoo.com">Placeholder 2</a>
      </div>
    </div>
    <button id="darkModeToggle">🌙 Dark Mode</button>
  </div>
`;

/**
 * Initialize and insert the navbar into the page
 * Only inserts if navbar doesn't already exist
 */
export function initializeNavbar() {
    // Only insert navbar if it doesn't already exist
    if (!document.getElementById('navbar')) {
        // Insert navbar at the start of the body
        document.body.insertAdjacentHTML('afterbegin', navbar);
    }
}

/**
 * Set up page title based on current page
 */
export function setPageTitle() {
    // Get the current page name from the HTML filename
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    // Convert first letter to uppercase and replace dashes with spaces
    const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');

    // Set the page title in the browser tab
    document.title = `MapleStory Tracker - ${formattedPageName}`;
}
