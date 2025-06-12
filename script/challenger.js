// Rank thresholds
const RANKS = {
    'None': 0,
    'Bronze': 5000,
    'Silver': 10000,
    'Gold': 15000,
    'Emerald': 20000,
    'Diamond': 30000,
    'Challenger': 40000
};

// Level thresholds in ascending order
const LEVEL_THRESHOLDS = [
    { id: 'level260', level: 260, points: 1000 },
    { id: 'level265', level: 265, points: 2000 },
    { id: 'level270', level: 270, points: 3000 },
    { id: 'level275', level: 275, points: 5000 },
    { id: 'level280', level: 280, points: 7000 }
];

// Event dates
const EVENT_DATES = {
    start: '2025-06-11',
    end: '2025-09-24'
};

// Boss hierarchies - from highest to lowest difficulty
const BOSS_HIERARCHIES = {
    'Lucid': ['hardLucid', 'normalLucid', 'easyLucid'],
    'Will': ['hardWill', 'normalWill', 'easyWill'],
    'Cygnus': ['normalCygnus', 'easyCygnus'],
    'Damien': ['hardDamien', 'normalDamien'],
    'Darknell': ['hardDarknell', 'normalDarknell'],
    'Gloom': ['chaosGloom', 'normalGloom'],
    'Lotus': ['hardLotus', 'normalLotus'],
    'Slime': ['chaosSlime', 'normalSlime'],
    'VerusHilla': ['hardVerusHilla', 'normalVerusHilla']
};

function handleBossCheckboxChange(checkbox) {
    const checkboxId = checkbox.id;
    
    // Find which boss hierarchy this checkbox belongs to
    for (const [, bossVersions] of Object.entries(BOSS_HIERARCHIES)) {
        const index = bossVersions.indexOf(checkboxId);
        if (index !== -1) {
            if (checkbox.checked) {
                // Check all lower difficulty versions
                for (let i = index + 1; i < bossVersions.length; i++) {
                    const lowerDiffCheckbox = document.getElementById(bossVersions[i]);
                    if (lowerDiffCheckbox) {
                        lowerDiffCheckbox.checked = true;
                    }
                }
            } else {
                // Uncheck all higher difficulty versions
                for (let i = 0; i < index; i++) {
                    const higherDiffCheckbox = document.getElementById(bossVersions[i]);
                    if (higherDiffCheckbox) {
                        higherDiffCheckbox.checked = false;
                    }
                }
            }
            break;
        }
    }
}

function updateRanksList() {
    const rankItems = document.querySelector('.rank-items');
    rankItems.innerHTML = '';
    
    const currentRank = getRank(calculateTotalPoints());
    const ranksEntries = Object.entries(RANKS);
    
    for (let i = ranksEntries.length - 1; i >= 0; i--) {
        const [rank, points] = ranksEntries[i];
        const rankItem = document.createElement('div');
        rankItem.className = 'rank-item';
        if (rank === currentRank) {
            rankItem.classList.add('current-rank');
        }
        rankItem.innerHTML = `
            <span class="rank-name">${rank}</span>
            <span class="rank-points">${points.toLocaleString()} points</span>
        `;
        rankItems.appendChild(rankItem);
    }
}

function calculateWeeksBetweenDates(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    if (end < start) return 0;
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
}

function calculateHuntingPoints(weeks) {
    return weeks * 5 * 100; // 5 check-ins per week, 100 points each
}

function calculateTotalPoints() {
    // Get hunting points based on active input mode
    let weeks;
    if (document.getElementById('weekInputGroup').style.display !== 'none') {
        weeks = parseInt(document.getElementById('weekCount').value) || 0;
    } else {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        weeks = calculateWeeksBetweenDates(startDate, endDate);
    }
    let total = calculateHuntingPoints(weeks);
    
    // Add level mission points
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) {
            total += parseInt(checkbox.dataset.points);
        }
    });
    
    return total;
}

function getRank(points) {
    let currentRank = 'None';
    for (const [rank, threshold] of Object.entries(RANKS)) {
        if (points >= threshold) {
            currentRank = rank;
        } else {
            break;
        }
    }
    return currentRank;
}

function handleLevelCheckboxChange(checkbox) {
    const checkboxId = checkbox.id;
    const currentIndex = LEVEL_THRESHOLDS.findIndex(level => level.id === checkboxId);
    
    if (currentIndex === -1) return; // Not a level checkbox
    
    if (checkbox.checked) {
        // Auto-check all lower level checkboxes
        for (let i = 0; i < currentIndex; i++) {
            const lowerCheckbox = document.getElementById(LEVEL_THRESHOLDS[i].id);
            if (lowerCheckbox) {
                lowerCheckbox.checked = true;
            }
        }
    } else {
        // Auto-uncheck all higher level checkboxes
        for (let i = currentIndex + 1; i < LEVEL_THRESHOLDS.length; i++) {
            const higherCheckbox = document.getElementById(LEVEL_THRESHOLDS[i].id);
            if (higherCheckbox) {
                higherCheckbox.checked = false;
            }
        }
    }
}

function saveToLocalStorage() {
    const state = {
        mode: document.getElementById('weekInputGroup').style.display !== 'none' ? 'week' : 'date',
        weekCount: document.getElementById('weekCount').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        checkedBoxes: Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
            .filter(cb => cb.checked)
            .map(cb => cb.id)
    };
    localStorage.setItem('challengerState', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const savedState = localStorage.getItem('challengerState');
    if (!savedState) return;

    const state = JSON.parse(savedState);
    
    // Restore mode
    switchMode(state.mode);
    
    // Restore week count
    document.getElementById('weekCount').value = state.weekCount;
    
    // Restore dates
    document.getElementById('startDate').value = state.startDate;
    document.getElementById('endDate').value = state.endDate;
    
    // Restore checkboxes
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = state.checkedBoxes.includes(checkbox.id);
    });
}

function updateDisplay() {
    const totalPoints = calculateTotalPoints();
    
    // Update total points display
    document.getElementById('totalPoints').textContent = totalPoints.toLocaleString();
    
    // Update ranks list
    updateRanksList();
    
    // Save current state
    saveToLocalStorage();
}

function handleDateChange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const weeks = calculateWeeksBetweenDates(startDate, endDate);
    document.getElementById('weekCalculation').textContent = `Duration: ${weeks} week${weeks !== 1 ? 's' : ''}`;
    updateDisplay();
}

function switchMode(mode) {
    const weekGroup = document.getElementById('weekInputGroup');
    const dateGroup = document.getElementById('dateInputGroup');
    const weekBtn = document.getElementById('weekModeBtn');
    const dateBtn = document.getElementById('dateModeBtn');
    
    if (mode === 'week') {
        weekGroup.style.display = 'block';
        dateGroup.style.display = 'none';
        weekBtn.classList.add('selected');
        dateBtn.classList.remove('selected');
    } else {
        weekGroup.style.display = 'none';
        dateGroup.style.display = 'block';
        weekBtn.classList.remove('selected');
        dateBtn.classList.add('selected');
    }
    updateDisplay();
}

export function initializeChallenger() {
    // Initialize ranks list
    updateRanksList();
    
    // Set default week count if no saved state
    if (!localStorage.getItem('challengerState')) {
        document.getElementById('weekCount').value = 15;
    }
    
    // Initialize input mode buttons
    document.getElementById('weekModeBtn').addEventListener('click', () => switchMode('week'));
    document.getElementById('dateModeBtn').addEventListener('click', () => switchMode('date'));
    
    // Add event listeners to date inputs
    document.getElementById('startDate').addEventListener('change', handleDateChange);
    document.getElementById('endDate').addEventListener('change', handleDateChange);
    
    // Add event listener to week count
    document.getElementById('weekCount').addEventListener('input', updateDisplay);
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (LEVEL_THRESHOLDS.some(level => level.id === checkbox.id)) {
                handleLevelCheckboxChange(checkbox);
            } else {
                handleBossCheckboxChange(checkbox);
            }
            updateDisplay();
        });
    });
    
    // Set event start date as default start date
    document.getElementById('startDate').value = EVENT_DATES.start;
    
    // Set event end date as default end date
    document.getElementById('endDate').value = EVENT_DATES.end;
    
    // Load saved state or set defaults
    if (localStorage.getItem('challengerState')) {
        loadFromLocalStorage();
    } else {
        // Set default dates if no saved state
        document.getElementById('startDate').value = EVENT_DATES.start;
        document.getElementById('endDate').value = EVENT_DATES.end;
    }

    // Initial update
    handleDateChange();
    updateDisplay();
}
