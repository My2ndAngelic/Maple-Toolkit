import {loadCSV} from "./csvHandling.js";

import {sortByLevelFactionArchetype} from "./tableUtils.js";

export function calculateSymbolForce(levels, baseForce, levelMultiplier) {
    if (!levels) return '';

    // Check if any symbols are above level 0
    const hasSymbols = levels.some(lvl => lvl > 0);
    if (!hasSymbols) return '';

    // Return total symbol value
    return levels.reduce((sum, lvl) => {
        if (lvl === 0) return sum;
        return sum + baseForce + levelMultiplier * (lvl - 1);
    }, 0);
}

/**
 * Utility function to get display value for a symbol level
 * @param {number} level - The symbol level
 * @returns {string|number} - Empty string if level is 0, otherwise the level
 */
export function getSymbolDisplayValue(level) {
    return level === 0 ? '' : level;
}

/**
 * Returns configuration for a specific symbol type
 * @param {string} type - Either 'arcane', 'sacred' or 'grandsacred'
 * @returns {Object} Configuration object with csvFile and tableId
 */
function getSymbolTypeInfo(type) {
    const typeMap = {
        'arcane': {
            csvFile: 'arcane.csv',
            tableId: 'arcaneTable',
            headers: ['Character', 'Level', 'Vanishing Journey', 'Chu Chu Island', 'Lachelein', 'Arcana', 'Morass', 'Esfera']
        },
        'sacred': {
            csvFile: 'sacred.csv',
            tableId: 'sacredTable',
            headers: ['Character', 'Level', 'Cernium', 'Hotel Arcus', 'Odium', 'Shangri-La', 'Arteria', 'Carcion']
        },
        'grandsacred': {
            csvFile: 'grandsacred.csv',
            tableId: 'grandSacredTable',
            headers: ['Character', 'Level', 'Tallahart']
        }
    };
    return typeMap[type] || {};
}

/**
 * Renders the detailed symbol information table in the DOM for a given type of symbol.
 * @param {string} type - The type of symbol to render (e.g., sacred, arcane).
 * @return {Promise<void>} A promise that resolves when the symbol details are successfully rendered.
 */
export async function renderSymbolsDetail(type) {
    try {
        const {csvFile, tableId} = getSymbolTypeInfo(type);
        const [symbolData, accountData, jobList] = await Promise.all([
            loadCSV(`data/${csvFile}`),
            loadCSV('data/account.csv'),
            loadCSV('data/joblist.csv')
        ]);

        // Create level map for quick access
        const levelMap = new Map(accountData.map(char => [char.IGN, char.level]));
        // Create job map for sorting
        const jobMap = {};
        jobList.forEach(j => {
            jobMap[j.jobName] = j;
        });

        // Merge symbolData with accountData for sorting
        const merged = symbolData.map(char => {
            const acc = accountData.find(a => a.IGN === char.IGN) || {};
            return {...char, ...acc};
        });
        sortByLevelFactionArchetype(merged, jobMap);

        // Get symbol names (all column names except IGN)
        const columns = Object.keys(symbolData[0] || {}).filter(key => key !== 'IGN');
        const table = document.getElementById(tableId);
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        // Clear existing content
        thead.innerHTML = '';
        tbody.innerHTML = '';

        // Create header row using predefined headers
        const headerRow = document.createElement('tr');
        const {headers} = getSymbolTypeInfo(type);
        headerRow.innerHTML = headers.map(header => `<th>${header}</th>`).join('');
        thead.appendChild(headerRow);

        // Create a row for each character (now sorted)
        merged.forEach(char => {
            const tr = document.createElement('tr');
            // Add IGN cell
            const ignCell = document.createElement('td');
            ignCell.textContent = char.IGN || '';
            tr.appendChild(ignCell);
            // Add Level cell
            const levelCell = document.createElement('td');
            levelCell.textContent = levelMap.get(char.IGN) || '';
            tr.appendChild(levelCell);
            // Add symbol level cells
            columns.forEach(symbol => {
                const td = document.createElement('td');
                const symbolValue = char[symbol] || '0';
                if (symbolValue === '0' || symbolValue === 0) {
                    td.textContent = '';
                } else {
                    td.textContent = symbolValue;
                    const level = parseInt(symbolValue);
                    if (type === 'arcane' && level === 20) {
                        td.classList.add('symbol-max');
                    } else if (type === 'sacred' && level === 11) {
                        td.classList.add('symbol-max');
                    } else if (type === 'grandsacred' && level === 11) {
                        td.classList.add('symbol-max');
                    }
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(`Error rendering ${type} symbol details:`, err);
    }
}