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
