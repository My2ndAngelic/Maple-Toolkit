// Rank thresholds for Season 2
const RANKS = {
    'None': 0,
    'Bronze': 5000,
    'Silver': 10000,
    'Gold': 15000,
    'Platinum': 20000,
    'Emerald': 30000,
    'Diamond': 40000,
    'Master': 60000,
    'Challenger': 75000
};

// Level thresholds in ascending order for Season 2
const LEVEL_THRESHOLDS = [
    { id: 'level260', level: 260, points: 3000 },
    { id: 'level270', level: 270, points: 3000 },
    { id: 'level275', level: 275, points: 5000 },
    { id: 'level280', level: 280, points: 7000 },
    { id: 'level285', level: 285, points: 9000 }
];

// Event dates for Season 2 (placeholder dates - you can update these later)
const EVENT_DATES = {
    start: '2025-12-01',
    end: '2026-03-31'
};

// Unified double points configuration
let doublePoints = {
    enabled: false,
    // Week mode config
    doubleWeeks: 4,
    // Date mode config  
    start: '',
    end: ''
};

// Boss hierarchies - from highest to lowest difficulty for Season 2
const BOSS_HIERARCHIES = {
    'Cygnus': ['normalCygnus', 'easyCygnus'],
    'Lucid': ['hardLucid', 'normalLucid', 'easyLucid'],
    'Will': ['hardWill', 'normalWill', 'easyWill'],
    'Lotus': ['hardLotus', 'normalLotus'],
    'Damien': ['hardDamien', 'normalDamien'],
    'Gloom': ['chaosGloom', 'normalGloom'],
    'Slime': ['chaosSlime', 'normalSlime'], // Guardian Angel Slime
    'VerusHilla': ['hardVerusHilla', 'normalVerusHilla'],
    'Darknell': ['hardDarknell', 'normalDarknell'],
    'ChosenSeren': ['hardChosenSeren', 'normalChosenSeren'],
    'KalosTheGuardian': ['normalKalosTheGuardian', 'easyKalosTheGuardian']
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

function handleLevelCheckboxChange(checkbox) {
    const checkboxLevel = LEVEL_THRESHOLDS.find(level => level.id === checkbox.id)?.level;
    
    if (checkbox.checked) {
        // Auto-check all lower level checkboxes
        LEVEL_THRESHOLDS.forEach(level => {
            if (level.level < checkboxLevel) {
                const lowerCheckbox = document.getElementById(level.id);
                if (lowerCheckbox) {
                    lowerCheckbox.checked = true;
                }
            }
        });
    } else {
        // Auto-uncheck all higher level checkboxes
        LEVEL_THRESHOLDS.forEach(level => {
            if (level.level > checkboxLevel) {
                const higherCheckbox = document.getElementById(level.id);
                if (higherCheckbox) {
                    higherCheckbox.checked = false;
                }
            }
        });
    }
}

function getRank(totalPoints) {
    let currentRank = 'None';
    for (const [rank, threshold] of Object.entries(RANKS)) {
        if (totalPoints >= threshold) {
            currentRank = rank;
        }
    }
    return currentRank;
}

function getWeeksInDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
}

function calculateHuntingPoints() {
    const mode = document.querySelector('.mode-button.selected').id === 'weekModeBtn' ? 'week' : 'date';
    
    if (mode === 'week') {
        const weekCount = parseInt(document.getElementById('weekCount').value) || 0;
        const maxPointsPerWeek = 500; // 5 check-ins * 100 points each
        let totalHuntingPoints = weekCount * maxPointsPerWeek;
        
        // Apply double points if enabled
        if (doublePoints.enabled) {
            const doubleWeekCount = Math.min(doublePoints.doubleWeeks, weekCount);
            const regularWeeks = weekCount - doubleWeekCount;
            totalHuntingPoints = (regularWeeks * maxPointsPerWeek) + (doubleWeekCount * maxPointsPerWeek * 2);
        }
        
        return totalHuntingPoints;
    } else {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) return 0;
        
        const weekCount = getWeeksInDateRange(startDate, endDate);
        const maxPointsPerWeek = 500;
        let totalHuntingPoints = weekCount * maxPointsPerWeek;
        
        // Apply double points if enabled and dates are set
        if (doublePoints.enabled && doublePoints.start && doublePoints.end) {
            const doubleWeeks = getWeeksInDateRange(doublePoints.start, doublePoints.end);
            const actualDoubleWeeks = Math.min(doubleWeeks, weekCount);
            const regularWeeks = weekCount - actualDoubleWeeks;
            totalHuntingPoints = (regularWeeks * maxPointsPerWeek) + (actualDoubleWeeks * maxPointsPerWeek * 2);
        }
        
        return totalHuntingPoints;
    }
}

function calculateTotalPoints() {
    let totalPoints = 0;
    
    // Add hunting points
    totalPoints += calculateHuntingPoints();
    
    // Add points from checked checkboxes
    document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked').forEach(checkbox => {
        const points = parseInt(checkbox.getAttribute('data-points')) || 0;
        totalPoints += points;
    });
    
    return totalPoints;
}

function updateDisplay() {
    const totalPoints = calculateTotalPoints();
    document.getElementById('totalPoints').textContent = totalPoints.toLocaleString();
    updateRanksList();
    
    // Save state
    saveToLocalStorage();
}

function updateWeekCalculation() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const weekCalculation = document.getElementById('weekCalculation');
    
    if (startDate && endDate) {
        const weeks = getWeeksInDateRange(startDate, endDate);
        weekCalculation.textContent = `Duration: ${weeks} weeks`;
    } else {
        weekCalculation.textContent = 'Duration: 0 weeks';
    }
}

function handleDateChange() {
    updateWeekCalculation();
    updateDoublePointsUI();
    updateDisplay();
}

function toggleDoublePoints() {
    const mode = document.querySelector('.mode-button.selected').id === 'weekModeBtn' ? 'week' : 'date';
    
    if (mode === 'week') {
        const enableCheckbox = document.getElementById('enableDoublePoints');
        doublePoints.enabled = enableCheckbox.checked;
        
        const config = document.getElementById('doublePointsConfig');
        config.style.display = doublePoints.enabled ? 'block' : 'none';
        
        if (doublePoints.enabled) {
            updateWeekModeDoublePeriodInfo();
        }
    } else {
        const enableCheckbox = document.getElementById('enableDoublePointsDate');
        doublePoints.enabled = enableCheckbox.checked;
        
        const config = document.getElementById('doublePointsDateConfig');
        config.style.display = doublePoints.enabled ? 'block' : 'none';
        
        if (doublePoints.enabled) {
            updateDoublePeriodInfo();
        }
    }
    
    updateDisplay();
}

function updateDoublePointsWeeks() {
    const weekCount = parseInt(document.getElementById('doubleWeekCount').value) || 0;
    doublePoints.doubleWeeks = weekCount;
    updateWeekModeDoublePeriodInfo();
    updateDisplay();
}

function updateDoublePointsDate(type, value) {
    doublePoints[type] = value;
    updateDoublePeriodInfo();
    updateDisplay();
}

function updateWeekModeDoublePeriodInfo() {
    const info = document.getElementById('weekModeDoublePeriodInfo');
    if (doublePoints.enabled) {
        const totalWeeks = parseInt(document.getElementById('weekCount').value) || 0;
        const doubleWeeks = Math.min(doublePoints.doubleWeeks, totalWeeks);
        const regularWeeks = totalWeeks - doubleWeeks;
        const doublePoints_calc = doubleWeeks * 1000; // 1000 points per week during 2x
        const regularPoints = regularWeeks * 500; // 500 points per week normally
        
        info.innerHTML = `
            <strong>2x Period Calculation:</strong><br>
            Regular weeks: ${regularWeeks} × 500 = ${regularPoints.toLocaleString()} points<br>
            2x weeks: ${doubleWeeks} × 1,000 = ${doublePoints_calc.toLocaleString()} points<br>
            <strong>Total: ${(regularPoints + doublePoints_calc).toLocaleString()} points</strong>
        `;
        info.style.display = 'block';
    } else {
        info.style.display = 'none';
    }
}

function updateDoublePeriodInfo() {
    const info = document.getElementById('doublePeriodInfo');
    if (doublePoints.enabled && doublePoints.start && doublePoints.end) {
        const doubleWeeks = getWeeksInDateRange(doublePoints.start, doublePoints.end);
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate) {
            const totalWeeks = getWeeksInDateRange(startDate, endDate);
            const actualDoubleWeeks = Math.min(doubleWeeks, totalWeeks);
            const regularWeeks = totalWeeks - actualDoubleWeeks;
            const doublePoints_calc = actualDoubleWeeks * 1000;
            const regularPoints = regularWeeks * 500;
            
            info.innerHTML = `
                <strong>2x Period: ${doubleWeeks} weeks</strong><br>
                Regular weeks: ${regularWeeks} × 500 = ${regularPoints.toLocaleString()} points<br>
                2x weeks: ${actualDoubleWeeks} × 1,000 = ${doublePoints_calc.toLocaleString()} points<br>
                <strong>Total: ${(regularPoints + doublePoints_calc).toLocaleString()} points</strong>
            `;
        } else {
            info.innerHTML = `<strong>2x Period: ${doubleWeeks} weeks</strong>`;
        }
        info.style.display = 'block';
    } else {
        info.style.display = 'none';
    }
}

function updateDoublePointsUI() {
    const mode = document.querySelector('.mode-button.selected').id === 'weekModeBtn' ? 'week' : 'date';
    
    if (mode === 'week') {
        updateWeekModeDoublePeriodInfo();
    } else {
        updateDoublePeriodInfo();
    }
}

function saveToLocalStorage() {
    const state = {
        // Input values
        weekCount: document.getElementById('weekCount').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        
        // Mode
        mode: document.querySelector('.mode-button.selected').id === 'weekModeBtn' ? 'week' : 'date',
        
        // Double points configuration
        doublePoints: doublePoints,
        
        // Checkbox states
        checkboxes: {}
    };
    
    // Save all checkbox states
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
        state.checkboxes[checkbox.id] = checkbox.checked;
    });
    
    localStorage.setItem('challengerS2State', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const savedState = localStorage.getItem('challengerS2State');
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        
        // Restore input values
        if (state.weekCount !== undefined) {
            document.getElementById('weekCount').value = state.weekCount;
        }
        if (state.startDate) {
            document.getElementById('startDate').value = state.startDate;
        }
        if (state.endDate) {
            document.getElementById('endDate').value = state.endDate;
        }
        
        // Restore mode
        if (state.mode) {
            switchMode(state.mode);
        }
        
        // Restore double points configuration
        if (state.doublePoints) {
            doublePoints = { ...doublePoints, ...state.doublePoints };
            
            // Update UI elements
            const enableCheckbox = document.getElementById('enableDoublePoints');
            const enableDateCheckbox = document.getElementById('enableDoublePointsDate');
            const doubleWeekCountInput = document.getElementById('doubleWeekCount');
            const doubleStartDateInput = document.getElementById('doubleStartDate');
            const doubleEndDateInput = document.getElementById('doubleEndDate');
            
            if (enableCheckbox) enableCheckbox.checked = doublePoints.enabled;
            if (enableDateCheckbox) enableDateCheckbox.checked = doublePoints.enabled;
            if (doubleWeekCountInput) doubleWeekCountInput.value = doublePoints.doubleWeeks;
            if (doubleStartDateInput) doubleStartDateInput.value = doublePoints.start;
            if (doubleEndDateInput) doubleEndDateInput.value = doublePoints.end;
        }
        
        // Restore checkbox states
        if (state.checkboxes) {
            Object.entries(state.checkboxes).forEach(([checkboxId, checked]) => {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) {
                    checkbox.checked = checked;
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading saved state:', error);
    }
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
    
    // Update the 2x period UI for the current mode
    updateDoublePointsUI();
    updateDisplay();
}

export function initializeChallengerS2() {
    // Initialize ranks list
    updateRanksList();
    
    // Set default week count if no saved state
    if (!localStorage.getItem('challengerS2State')) {
        document.getElementById('weekCount').value = 15;
    }
    
    // Initialize input mode buttons
    document.getElementById('weekModeBtn').addEventListener('click', () => switchMode('week'));
    document.getElementById('dateModeBtn').addEventListener('click', () => switchMode('date'));
    
    // Add event listeners to date inputs
    document.getElementById('startDate').addEventListener('change', handleDateChange);
    document.getElementById('endDate').addEventListener('change', handleDateChange);
    
    // Add event listener to week count
    document.getElementById('weekCount').addEventListener('input', () => {
        updateWeekModeDoublePeriodInfo();
        updateDisplay();
    });
    
    // Add event listeners for unified double points
    const enableCheckbox = document.getElementById('enableDoublePoints');
    if (enableCheckbox) {
        enableCheckbox.addEventListener('change', toggleDoublePoints);
    }
    
    const enableDateCheckbox = document.getElementById('enableDoublePointsDate');
    if (enableDateCheckbox) {
        enableDateCheckbox.addEventListener('change', toggleDoublePoints);
    }
    
    const startDateInput = document.getElementById('doubleStartDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', (e) => updateDoublePointsDate('start', e.target.value));
    }
    
    const endDateInput = document.getElementById('doubleEndDate');
    if (endDateInput) {
        endDateInput.addEventListener('change', (e) => updateDoublePointsDate('end', e.target.value));
    }
    
    const doubleWeekCountInput = document.getElementById('doubleWeekCount');
    if (doubleWeekCountInput) {
        doubleWeekCountInput.addEventListener('input', updateDoublePointsWeeks);
    }
    
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
    if (localStorage.getItem('challengerS2State')) {
        loadFromLocalStorage();
    } else {
        // Set default dates if no saved state
        document.getElementById('startDate').value = EVENT_DATES.start;
        document.getElementById('endDate').value = EVENT_DATES.end;
    }

    // Initialize double points period display
    updateDoublePointsUI();
    
    // Initial update
    handleDateChange();
    updateDisplay();
}
