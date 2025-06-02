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
const CRYSTAL_LIMIT = 14; // New game limit

// Update the crystal counter and apply visual indicators
function updateCrystalCounter() {
    const crystalCountElement = document.getElementById('crystalCount');
    const crystalCounterContainer = document.querySelector('.crystal-counter');
    const count = selectedBosses.size;
    
    if (crystalCountElement) {
        crystalCountElement.textContent = count;
        
        // Toggle warning style if over limit
        if (crystalCounterContainer) {
            crystalCounterContainer.classList.toggle('limit-reached', count > CRYSTAL_LIMIT);
        }
    }
    
    // Handle visual indicators for exceeding crystal limit
    if (count > CRYSTAL_LIMIT) {
        markLowestCrystals(count - CRYSTAL_LIMIT);
    } else {
        // Clear all crossed-out indicators
        document.querySelectorAll('tr.crossed-out').forEach(row => {
            row.classList.remove('crossed-out');
        });
    }
}

// Mark the N lowest value crystals as "crossed out"
function markLowestCrystals(numberOfLowest) {
    // Clear any existing markings
    document.querySelectorAll('tr.crossed-out').forEach(row => {
        row.classList.remove('crossed-out');
    });
    
    if (numberOfLowest <= 0) return;
    
    // Create an array of selected bosses with their meso values
    const selectedBossesArray = [];
    selectedBosses.forEach((data, bossName) => {
        selectedBossesArray.push({
            boss: bossName,
            difficulty: data.difficulty,
            meso: parseInt(data.meso)
        });
    });
    
    // Sort by meso value (ascending)
    selectedBossesArray.sort((a, b) => a.meso - b.meso);
    
    // Mark the lowest N bosses
    for (let i = 0; i < numberOfLowest && i < selectedBossesArray.length; i++) {
        const boss = selectedBossesArray[i];
        const checkbox = document.querySelector(
            `input[data-boss="${boss.boss}"][data-difficulty="${boss.difficulty}"]`
        );
        
        if (checkbox) {
            // Find the parent row and mark it
            const row = checkbox.closest('tr');
            if (row) {
                row.classList.add('crossed-out');
            }
        }
    }
}

// Calculate and display total meso
function updateTotalMeso() {
    let total = 0;
    
    // If we have more than the limit, only count the top CRYSTAL_LIMIT bosses by meso value
    if (selectedBosses.size > CRYSTAL_LIMIT) {
        // Create an array of selected bosses with their meso values
        const selectedBossesArray = [];
        selectedBosses.forEach((data, bossName) => {
            selectedBossesArray.push({
                boss: bossName,
                meso: parseInt(data.meso)
            });
        });
        
        // Sort by meso value (descending)
        selectedBossesArray.sort((a, b) => b.meso - a.meso);
        
        // Sum up the top CRYSTAL_LIMIT bosses
        for (let i = 0; i < CRYSTAL_LIMIT && i < selectedBossesArray.length; i++) {
            total += selectedBossesArray[i].meso;
        }
    } else {
        // Sum up all selected bosses
        selectedBosses.forEach((difficultyObj) => {
            total += parseInt(difficultyObj.meso);
        });
    }
    
    // Apply heroic mode multiplier if active
    if (heroicModeActive) {
        total *= 5;
    }
    
    // Update the total display
    const totalElement = document.getElementById('totalMeso');
    if (totalElement) {
        totalElement.textContent = formatNumber(total);
    }
    
    // Update the crystal counter
    updateCrystalCounter();
    // Save state after updating
    saveSelectionsToStorage();
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
    
    // Update the total and counter
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
    saveSelectionsToStorage();
}

// Save current selections and heroic mode to localStorage
function saveSelectionsToStorage() {
    const selections = Array.from(selectedBosses.entries()).map(([boss, data]) => ({
        boss,
        difficulty: data.difficulty,
        meso: data.meso
    }));
    localStorage.setItem('bossCrystalSelections', JSON.stringify(selections));
    localStorage.setItem('heroicModeActive', JSON.stringify(heroicModeActive));
}

// Restore selections and heroic mode from localStorage
function restoreSelectionsFromStorage() {
    const selections = JSON.parse(localStorage.getItem('bossCrystalSelections') || '[]');
    const heroic = JSON.parse(localStorage.getItem('heroicModeActive') || 'false');
    selectedBosses.clear();
    selections.forEach(sel => {
        selectedBosses.set(sel.boss, { difficulty: sel.difficulty, meso: sel.meso });
        // Check the corresponding checkbox
        const checkbox = document.querySelector(`input[data-boss="${sel.boss}"][data-difficulty="${sel.difficulty}"]`);
        if (checkbox) checkbox.checked = true;
    });
    heroicModeActive = heroic;
    const heroicCheckbox = document.getElementById('heroicMode');
    if (heroicCheckbox) heroicCheckbox.checked = heroicModeActive;
    updateTotalMeso();
}

async function loadBossCrystalData() {
    try {
        // Load the boss crystal data
        allBossData = await loadCSV('bosscrystal_weekly.csv');
        
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
            mesoCell.classList.add('right-align');
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
    loadBossCrystalData().then(() => {
        // Restore selections after table is built
        restoreSelectionsFromStorage();
    });
    
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
            
            // Clear crossed-out rows
            document.querySelectorAll('tr.crossed-out').forEach(row => {
                row.classList.remove('crossed-out');
            });
            
            // Update total and counter
            updateTotalMeso();
            // Save reset state
            saveSelectionsToStorage();
        });
    }
}

// Export functions that need to be accessed externally
export { initializePage };

// Load data when page loads
document.addEventListener('DOMContentLoaded', initializePage);
