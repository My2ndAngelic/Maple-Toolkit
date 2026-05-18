// csvHandling.js

// Function to get base path for data files
function getDataPath() {
    // If URL contains /html/, we need to go up one level
    const path = window.location.pathname;
    return path.includes('/html/') ? '../data/' :
        path.startsWith('/data/') ? '' :  // Already in data path
            'data/';  // Root path
}

/**
 * Parse CSV string data into an array of objects
 * @param {string} text - CSV data as string
 * @returns {Array} - Array of objects with headers as keys
 */
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = [];
        let inQuote = false;
        let currentValue = '';

        // Handle quoted values that may contain commas
        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"' && !inQuote) {
                inQuote = true;
            } else if (char === '"' && inQuote) {
                // Check if this is an escaped quote
                if (i + 1 < line.length && line[i + 1] === '"') {
                    currentValue += '"';
                    i++; // Skip the next quote
                } else {
                    inQuote = false;
                }
            } else if (char === ',' && !inQuote) {
                values.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }

        // Push the last value
        values.push(currentValue);

        // Create object from headers and values
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] !== undefined ? values[index] : '';
        });

        return obj;
    });
}

/**
 * Load and parse a CSV file
 * @param {string} url - URL of the CSV file to load
 * @returns {Promise<Array>} - Promise resolving to array of objects
 */
export async function loadCSV(filename) {
    const basePath = getDataPath();
    // Remove any extra 'data/' from the filename if it exists
    const cleanFilename = filename.replace(/^data\//, '');
    const url = `${basePath}${cleanFilename}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const text = await res.text();
    return parseCSV(text);
}
