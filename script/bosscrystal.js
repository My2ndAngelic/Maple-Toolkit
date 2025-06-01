// bosscrystal.js - Script for the boss crystal page
import { loadCSV } from "./csvHandling.js";
import { prepareTable } from "./tableUtils.js";
import { initializeTheme } from "./ui.js";

// Function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Global variables to track state
let allBossData = [];
let selectedBosses = new Map(); // Maps boss name to selected difficulty
let heroicModeActive = false;

// Calculate and display total meso
function updateTotalMeso() {
    let total = 0;
    
    // Sum up the meso values of all selected bosses
    selectedBosses.forEach((difficultyObj) => {
        total += parseInt(difficultyObj.meso);
    });
    
    // Apply heroic mode multiplier if active
    if (heroicModeActive) {
        total *= 5;
    }
    
    // Update the total display
    const totalElement = document.getElementById('totalMeso');
    if (totalElement) {
        totalElement.textContent = formatNumber(total);
    }
}

// Handle boss selection
function handleBossSelection(bossName, difficulty, meso, checkbox) {
    // If this boss is already selected with a different difficulty, uncheck that one
    if (selectedBosses.has(bossName)) {
        const previousDifficulty = selectedBosses.get(bossName).difficulty;
        if (previousDifficulty !== difficulty) {
            // Find and uncheck the previous checkbox
            const previousCheckbox = document.querySelector(`input[data-boss="${bossName}"][data-difficulty="${previousDifficulty}"]`);
            if (previousCheckbox) {
                previousCheckbox.checked = false;
            }
        }
    }
    
    if (checkbox.checked) {
        // Add or update this boss in the selected bosses map
        selectedBosses.set(bossName, { difficulty, meso });
    } else {
        // Remove this boss from selected bosses if unchecked
        selectedBosses.delete(bossName);
    }
    
    // Update the total
    updateTotalMeso();
}

// Toggle heroic mode
function toggleHeroicMode(checkbox) {
    heroicModeActive = checkbox.checked;
    updateTotalMeso();
    
    // Update individual meso values display
    document.querySelectorAll('.meso-value').forEach(element => {
        const baseMeso = parseInt(element.dataset.baseMeso);
        element.textContent = formatNumber(heroicModeActive ? baseMeso * 5 : baseMeso);
    });
}

async function loadBossCrystalData() {
    try {
        // Load the boss crystal data
        allBossData = await loadCSV('bosscrystal.csv');
        
        // Get the table body
        const tbody = prepareTable('bossTable');
        if (!tbody) return;
        
        // Create rows for each boss (keep original CSV order)
        allBossData.forEach(boss => {
            const tr = document.createElement('tr');
            
            // Create checkbox cell
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.boss = boss.Boss;
            checkbox.dataset.difficulty = boss.Difficulty;
            checkbox.dataset.meso = boss.Meso;
            checkbox.addEventListener('change', () => {
                handleBossSelection(boss.Boss, boss.Difficulty, boss.Meso, checkbox);
            });
            checkboxCell.appendChild(checkbox);
            
            // Create cells for each column
            const bossNameCell = document.createElement('td');
            bossNameCell.textContent = boss.Boss;
            
            const difficultyCell = document.createElement('td');
            difficultyCell.textContent = boss.Difficulty;
            
            const mesoCell = document.createElement('td');
            const mesoSpan = document.createElement('span');
            mesoSpan.textContent = formatNumber(boss.Meso);
            mesoSpan.classList.add('numeric', 'meso-value');
            mesoSpan.dataset.baseMeso = boss.Meso;
            mesoCell.appendChild(mesoSpan);
            
            // Add cells to row
            tr.appendChild(checkboxCell);
            tr.appendChild(bossNameCell);
            tr.appendChild(difficultyCell);
            tr.appendChild(mesoCell);
            
            // Add row to table
            tbody.appendChild(tr);
        });
        
        // Create heroic mode checkbox
        const heroicCheckbox = document.getElementById('heroicMode');
        if (heroicCheckbox) {
            heroicCheckbox.addEventListener('change', (e) => {
                toggleHeroicMode(e.target);
            });
        }
        
    } catch (error) {
        console.error('Error loading boss crystal data:', error);
        document.getElementById('errorMessage').textContent = 
            `Error loading data: ${error.message}`;
    }
}

// Initialize the page when DOM content is loaded
function initializePage() {
    loadBossCrystalData();
    initializeTheme();
    
    // Reset button event listener
    const resetButton = document.getElementById('resetSelections');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Uncheck all boss checkboxes
            document.querySelectorAll('input[data-boss]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Clear selected bosses
            selectedBosses.clear();
            
            // Update total
            updateTotalMeso();
        });
    }
}

// Export functions that need to be accessed externally
export { initializePage };

// Load data when page loads
document.addEventListener('DOMContentLoaded', initializePage);
