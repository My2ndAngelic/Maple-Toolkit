/**
 * Prepare the table by clearing its body and returning the tbody element
 * @param {string} tableId - The ID of the table to prepare
 * @returns {HTMLElement} - The tbody element
 */
export function prepareTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID ${tableId} not found`);
        return null;
    }

    const tbody = table.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = ''; // Clear existing rows
        return tbody;
    } else {
        console.error(`Tbody not found in table with ID ${tableId}`);
        return null;
    }
}

/**
 * Sort accounts by level in descending order
 * @param {Array} accountData - Array of account objects
 * @returns {Array} - Sorted array of account objects
 */
export function sortAccountsByLevel(accountData) {
    return accountData.sort((a, b) => {
        const levelA = parseInt(a.level) || 0;
        const levelB = parseInt(b.level) || 0;
        return levelB - levelA; // Sort in descending order
    });
}

/**
 * Creates and returns a table cell element with the given text content
 * @param {string} text - The text content for the cell
 * @param {string} [className] - Optional CSS class to add to the cell
 * @returns {HTMLTableCellElement} - The created td element
 */
export function createTableCell(text, className) {
    const td = document.createElement('td');
    td.textContent = text !== undefined && text !== null ? text : '';
    if (className) {
        td.classList.add(className);
    }
    return td;
}

/**
 * Sorts an array of character/account data by level (desc), then faction (asc), then archetype (custom order)
 * @param {Array} data - Array of character/account objects
 * @param {Object} [jobMap] - Optional map of jobName to job info (for faction/archetype)
 * @returns {Array} Sorted array
 */
export function sortByLevelFactionArchetype(data, jobMap) {
    // Archetype order: warrior, magician, archer, thief, pirate
    const archetypeOrder = ['warrior', 'magician', 'archer', 'thief', 'pirate'];
    return data.sort((a, b) => {
        // Level (desc)
        const levelA = Number(a.level) || 0;
        const levelB = Number(b.level) || 0;
        if (levelB !== levelA) return levelB - levelA;
        // Faction (asc, alphabetical for now)
        let factionA = '', factionB = '';
        let archetypeA = '', archetypeB = '';
        if (jobMap) {
            const jobA = jobMap[a.jobName] || {};
            const jobB = jobMap[b.jobName] || {};
            factionA = (jobA.faction || '').toLowerCase();
            factionB = (jobB.faction || '').toLowerCase();
            archetypeA = (jobA.archetype || '').toLowerCase();
            archetypeB = (jobB.archetype || '').toLowerCase();
        }
        if (factionA !== factionB) return factionA.localeCompare(factionB);
        // Archetype (custom order)
        const idxA = archetypeOrder.indexOf(archetypeA);
        const idxB = archetypeOrder.indexOf(archetypeB);
        if (idxA !== idxB) {
            if (idxA === -1 && idxB === -1) return archetypeA.localeCompare(archetypeB);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        }
        // Fallback: IGN alphabetical
        return (a.IGN || '').localeCompare(b.IGN || '');
    });
}

