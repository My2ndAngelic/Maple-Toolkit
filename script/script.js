// script.js - Main script for overview page
import {calculateArcaneForce, calculateArcaneStat} from "./arcane.js";
import {calculateSacredForce, calculateSacredStat} from "./sacred.js";
import {calculateGrandSacredForce, calculateGrandSacredStat, calculateGrandSacredExpBonus, calculateGrandSacredMesoBonus, calculateGrandSacredDropBonus} from "./grandsacred.js";
import {prepareTable, sortByLevelFactionArchetype} from "./tableUtils.js";
import {createDataMap, createSymbolsMap, loadCSV} from "./csvHandling.js";
import {getAbilityDescription} from "./innerability.js";

/**
 * Renders the main overview table
 * This function is specific to the overview page
 */
export async function renderTable() {
    try {
        const [accountData, jobList, arcaneData, sacredData, grandSacredData, innerAbilityData] = await Promise.all([
            loadCSV('data/account.csv'),
            loadCSV('data/joblist.csv'),
            loadCSV('data/arcane.csv'),
            loadCSV('data/sacred.csv'),
            loadCSV('data/grandsacred.csv'),
            loadCSV('data/innerability.csv')
        ]);

        const jobMap = createDataMap(jobList, 'jobName');
        const arcaneMap = createSymbolsMap(arcaneData);
        const sacredMap = createSymbolsMap(sacredData);
        const grandSacredMap = createSymbolsMap(grandSacredData);
        
        // Create inner ability map with IGN as key
        const innerAbilityMap = {};
        
        // Process innerAbilityData to create a map for easy access
        if (innerAbilityData.length > 0) {
            innerAbilityData.forEach(ia => {
                if (ia.IGN) {
                    innerAbilityMap[ia.IGN] = ia;
                }
            });
        }
        
        sortByLevelFactionArchetype(accountData, jobMap);
        const table = document.getElementById('charTable');
        if (!table) return;

        // Set up table headers
        const thead = table.querySelector('thead');
        if (!thead) return;
        
        thead.innerHTML = `
      <tr>
        <th rowspan="2">Character</th>
        <th rowspan="2">Level</th>
        <th colspan="3" class="ia-group-header">Inner Ability</th>
        <th colspan="2" class="arcane-group-header">Arcane</th>
        <th colspan="5" class="sacred-group-header">Sacred</th>
      </tr>
      <tr>
        <th class="preset-header">Preset 1</th>
        <th class="preset-header">Preset 2</th>
        <th class="preset-header">Preset 3</th>
        <th class="arcane-header">Force</th>
        <th class="arcane-header">Stats</th>
        <th class="sacred-header">Force</th>
        <th class="sacred-header">Stats</th>
        <th class="sacred-header">EXP</th>
        <th class="sacred-header">Meso</th>
        <th class="sacred-header">Drop</th>
      </tr>
    `;

        const tbody = prepareTable('charTable');
        if (!tbody) return;

        // Populate table...
        // Table population logic moved to overview.js
    } catch (err) {
        console.error('Error:', err);
    }
}

// Overview page initialization - only runs if the overview page is loaded
if (document.getElementById('charTable')) {
    // Make renderTable available globally so it can be called from theme toggle
    window.renderTable = renderTable;
    
    // Initialize the table
    renderTable();
    
    // Check if navbar already exists to avoid duplication
    if (!document.getElementById('navbar')) {
        import('./ui.js').then(({initializeUI, applyTheme}) => {
            initializeUI();
            
            // Manually initialize theme toggle for overview page
            const darkToggleBtn = document.getElementById('darkModeToggle');
            if (darkToggleBtn) {
                darkToggleBtn.addEventListener('click', () => {
                    const currentTheme = localStorage.getItem('darkMode') === 'true';
                    applyTheme(!currentTheme);
                    
                    // Rerender the table after theme change
                    setTimeout(renderTable, 50);
                });
            }
        }).catch(err => {
            console.error('Error initializing UI:', err);
        });
    }
}
