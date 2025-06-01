import {calculateArcaneForce, calculateArcaneStat} from "./arcane.js";
import {calculateSacredForce, calculateSacredStat} from "./sacred.js";
import {calculateGrandSacredForce, calculateGrandSacredStat, calculateGrandSacredExpBonus, calculateGrandSacredMesoBonus, calculateGrandSacredDropBonus} from "./grandsacred.js";
import {prepareTable, sortByLevelFactionArchetype} from "./tableUtils.js";
import {createDataMap, createSymbolsMap, loadCSV} from "./csvHandling.js";

// Import the getAbilityDescription function from innerability.js
import {getAbilityDescription} from "./innerability.js";

function createTableRow(char, job, arcanePower, arcaneStat, totalSacredForce, sacredStat, expBonus, mesoBonus, dropBonus, innerAbilityData) {
    const tr = document.createElement('tr');
    
    // Get inner ability data for each preset
    const p1ia1 = innerAbilityData?.P1_IA1 || '';
    const p2ia1 = innerAbilityData?.P2_IA1 || '';
    const p3ia1 = innerAbilityData?.P3_IA1 || '';
    
    const cellData = [
        char.IGN || '',
        char.level || '',
        // Inner ability cells (3 columns for P1, P2, P3 - Line 1 only)
        p1ia1,
        p2ia1,
        p3ia1,
        // Other data
        arcanePower,
        arcaneStat,
        totalSacredForce,
        sacredStat,
        expBonus,
        mesoBonus,
        dropBonus
    ];

    cellData.forEach((text, index) => {
        const td = document.createElement('td');

        // Special handling for inner ability columns (index 2, 3, 4)
        if (index >= 2 && index <= 4) {
            if (text) {
                // Convert the short code to the full description
                const fullDescription = getAbilityDescription(text);
                td.textContent = fullDescription;
                
                // Add tooltip for full text on hover
                // td.title = fullDescription;
                
                // Extract ability type for coloring
                const abilityType = text.match(/^([a-z]+)/i)?.[1]?.toLowerCase();
                if (abilityType) {
                    td.classList.add(`ability-${abilityType}`);
                }
                
                // Check if it's a maxed value and make it bold
                // Detect max values by checking the ability type and value
                const match = text.match(/([a-z]+)([+-])(\d+)(?:%)?/i);
                if (match) {
                    const [, type, , value] = match;
                    const typeLC = type.toLowerCase();
                    const numValue = parseInt(value);
                    
                    // Define max values for common abilities (similar to innerability.js)
                    const maxValues = {
                        'as': 1, 'boss': 20, 'cdskip': 20, 'meso': 20, 'item': 20,
                        'buff': 50, 'passive': 1, 'crit': 30, 'att': 30, 'matt': 30
                    };
                    
                    if (maxValues[typeLC] && numValue >= maxValues[typeLC]) {
                        td.style.fontWeight = 'bold';
                    }
                }
            } else {
                td.textContent = '-';
            }
        }
        // Special handling for numerical columns (index 5-11, shifted due to new IA columns)
        else if (index >= 5 && index <= 11) {
            // Hide cell content if it's 0, undefined, null, or empty string
            if (text === 0 || text === '0' || text === undefined || text === null || text === '') {
                td.textContent = '';
            } else {
                td.textContent = text;
                td.classList.add('numeric-cell');
            }
        } else {
            // Default handling for other columns
            td.textContent = text !== undefined && text !== null ? text : '';
        }

        tr.appendChild(td);
    });
    return tr;
}

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

        // Set up table headers
        const thead = table.querySelector('thead');
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

        accountData.forEach(char => {
            const job = jobMap[char.jobName];
            if (!job) {
                console.warn(`Job not found for jobName: "${char.jobName}"`);
                return;
            }

            const arcanePower = calculateArcaneForce(arcaneMap[char.IGN]);
            const arcaneStat = calculateArcaneStat(arcaneMap[char.IGN], char.jobName);
            const sacredForce = calculateSacredForce(sacredMap[char.IGN]);
            const sacredStat = calculateSacredStat(sacredMap[char.IGN], char.jobName);
            const grandSacredForce = calculateGrandSacredForce(grandSacredMap[char.IGN]);
            const expBonus = calculateGrandSacredExpBonus(grandSacredMap[char.IGN]);
            const mesoBonus = calculateGrandSacredMesoBonus(grandSacredMap[char.IGN]);
            const dropBonus = calculateGrandSacredDropBonus(grandSacredMap[char.IGN]);

            // Combine Sacred Force from both Sacred and Grand Sacred symbols
            const totalSacredForce = ((sacredForce === '' || isNaN(sacredForce) ? 0 : sacredForce) + 
                                    (grandSacredForce === '' || isNaN(grandSacredForce) ? 0 : grandSacredForce)) || '';

            // Get inner ability data for this character
            const iaData = innerAbilityMap[char.IGN] || {};
            
            // Process inner ability data for proper display
            const processedIAData = {
                P1_IA1: iaData['P1 IA1'] || '',
                P2_IA1: iaData['P2 IA1'] || '',
                P3_IA1: iaData['P3 IA1'] || ''
            };

            const row = createTableRow(char, job, arcanePower, arcaneStat, totalSacredForce, sacredStat, 
                                      expBonus, mesoBonus, dropBonus, processedIAData);
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

// Overview page initialization
if (document.getElementById('charTable')) {
    // Make renderTable available globally so it can be called from theme toggle
    window.renderTable = renderTable;
    
    // Initialize the table first
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
