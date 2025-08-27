// src/script/navbar.js

/**
 * Load navbar.html and insert into the page
 * Only inserts if navbar doesn't already exist
 */
import * as navbarHTML from "../html/navbar.html"

export async function initializeNavbar() {
    if (!document.getElementById('navbar')) {
        try {
            // Fetch relative to script folder → html folder
            const response = await fetch("../html/navbar.html");
            if (!response.ok) throw new Error("Failed to load navbar.html");

            const navbarHTML = await response.text();

            // Insert navbar at the start of the body
            document.body.insertAdjacentHTML('afterbegin', navbarHTML);
        } catch (err) {
            console.error("Error loading navbar:", err);
        }
    }
}

/**
 * Set up page title based on current page
 */
export function setPageTitle() {
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');
    document.title = `MapleStory Tracker - ${formattedPageName}`;
}
