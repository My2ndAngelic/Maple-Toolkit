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

// Refactored config for daily/weekly
const DEFAULT_CONFIG = {
    mode: 'weekly',
    csv: 'bosscrystal_weekly.csv',
    limit: 14
};

let config = { ...DEFAULT_CONFIG };

// Update the crystal counter and apply visual indicators
function updateCrystalCounter() {
    const crystalCountElement = document.getElementById('crystalCount');
    const crystalCounterContainer = document.querySelector('.crystal-counter');
    const count = selectedBosses.size;
    
    if (crystalCountElement) {
        crystalCountElement.textContent = count;
    }
    
    if (config.limit && crystalCounterContainer) {
        crystalCounterContainer.classList.toggle('limit-reached', count > config.limit);
    }
    
    if (config.limit && count > config.limit) {
        markLowestCrystals(count - config.limit);
    } else {
        document.querySelectorAll('tr.crossed-out').forEach(row => {
            row.classList.remove('crossed-out');
        });
    }
}

// Mark the N lowest value crystals as "crossed out"
function markLowestCrystals(numberOfLowest) {
    if (!config.limit) return; // No marking for daily
    document.querySelectorAll('tr.crossed-out').forEach(row => {
        row.classList.remove('crossed-out');
    });
    if (numberOfLowest <= 0) return;
    const selectedBossesArray = [];
    selectedBosses.forEach((data, bossName) => {
        selectedBossesArray.push({
            boss: bossName,
            difficulty: data.difficulty,
            meso: parseInt(data.meso)
        });
    });
    selectedBossesArray.sort((a, b) => a.meso - b.meso);
    for (let i = 0; i < numberOfLowest && i < selectedBossesArray.length; i++) {
        const boss = selectedBossesArray[i];
        const checkbox = document.querySelector(
            `input[data-boss="${boss.boss}"][data-difficulty="${boss.difficulty}"]`
        );
        if (checkbox) {
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
    if (config.limit && selectedBosses.size > config.limit) {
        const selectedBossesArray = [];
        selectedBosses.forEach((data, bossName) => {
            selectedBossesArray.push({
                boss: bossName,
                meso: parseInt(data.meso)
            });
        });
        selectedBossesArray.sort((a, b) => b.meso - a.meso);
        for (let i = 0; i < config.limit && i < selectedBossesArray.length; i++) {
            total += selectedBossesArray[i].meso;
        }
    } else {
        selectedBosses.forEach((difficultyObj) => {
            total += parseInt(difficultyObj.meso);
        });
    }
    if (heroicModeActive) {
        total *= 5;
    }
    const totalElement = document.getElementById('totalMeso');
    if (totalElement) {
        totalElement.textContent = formatNumber(total);
    }
    updateCrystalCounter();
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

// Handle crystal limit change
function handleCrystalLimitChange(selectElement) {
    config.limit = parseInt(selectElement.value);
    updateCrystalCounter();
    updateTotalMeso();
    saveSelectionsToStorage();
}

// Save current selections and heroic mode to localStorage
function saveSelectionsToStorage() {
    const selections = Array.from(selectedBosses.entries()).map(([boss, data]) => ({
        boss,
        difficulty: data.difficulty,
        meso: data.meso
    }));
    localStorage.setItem(`bossCrystalSelections_${config.mode}`, JSON.stringify(selections));
    localStorage.setItem(`heroicModeActive_${config.mode}`, JSON.stringify(heroicModeActive));
    localStorage.setItem(`crystalLimit_${config.mode}`, JSON.stringify(config.limit));
}

// Restore selections and heroic mode from localStorage
function restoreSelectionsFromStorage() {
    const selections = JSON.parse(localStorage.getItem(`bossCrystalSelections_${config.mode}`) || '[]');
    const heroic = JSON.parse(localStorage.getItem(`heroicModeActive_${config.mode}`) || 'false');
    const crystalLimit = JSON.parse(localStorage.getItem(`crystalLimit_${config.mode}`) || config.limit.toString());
    
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
    
    // Restore crystal limit
    config.limit = crystalLimit;
    const crystalLimitSelect = document.getElementById('crystalLimit');
    if (crystalLimitSelect) crystalLimitSelect.value = crystalLimit;
    
    updateTotalMeso();
}

async function loadBossCrystalData() {
    try {
        // Load the boss crystal data
        allBossData = await loadCSV(config.csv);
        
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
        
        // Create crystal limit selector
        const crystalLimitSelect = document.getElementById('crystalLimit');
        if (crystalLimitSelect) {
            crystalLimitSelect.addEventListener('change', (e) => {
                handleCrystalLimitChange(e.target);
            });
        }
        
    } catch (error) {
        console.error('Error loading boss crystal data:', error);
        document.getElementById('errorMessage').textContent = 
            `Error loading data: ${error.message}`;
    }
}

// Initialize the page when DOM content is loaded
function initializePage(userConfig) {
    config = { ...DEFAULT_CONFIG, ...userConfig };
    loadBossCrystalData().then(() => {
        restoreSelectionsFromStorage();
    });
    const resetButton = document.getElementById('resetSelections');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            document.querySelectorAll('input[data-boss]').forEach(checkbox => {
                checkbox.checked = false;
            });
            selectedBosses.clear();
            document.querySelectorAll('tr.crossed-out').forEach(row => {
                row.classList.remove('crossed-out');
            });
            updateTotalMeso();
            saveSelectionsToStorage();
        });
    }
}

// Export functions that need to be accessed externally
export { initializePage };

// Load data when page loads
document.addEventListener('DOMContentLoaded', initializePage);
