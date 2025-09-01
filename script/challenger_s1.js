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

// Unified double points configuration
let doublePoints = {
    enabled: false,
    // Week mode config
    doubleWeeks: 4,
    // Date mode config  
    start: '',
    end: ''
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

function calculateHuntingPoints(weeks, startDate = null, endDate = null) {
    // Week Mode
    if (!startDate && !endDate) {
        if (doublePoints.enabled && doublePoints.doubleWeeks > 0) {
            const totalWeeks = weeks;
            const doubleWeeks = Math.min(doublePoints.doubleWeeks, totalWeeks);
            const regularWeeks = totalWeeks - doubleWeeks;
            
            return (regularWeeks * 5 * 100) + (doubleWeeks * 5 * 200);
        } else {
            // Simple calculation - no 2x periods
            return weeks * 5 * 100;
        }
    }
    
    // Date Mode - use date-based calculation
    if (doublePoints.enabled && doublePoints.start && doublePoints.end) {
        return calculateHuntingPointsWithDates(new Date(startDate), new Date(endDate));
    }
    
    // Date mode without double points
    const calculatedWeeks = calculateWeeksBetweenDates(startDate, endDate);
    return calculatedWeeks * 5 * 100;
}

function calculateHuntingPointsWithDates(start, end) {
    let totalPoints = 0;
    
    // If no valid date range, return 0
    if (start >= end) return 0;
    
    // Calculate week by week
    let currentDate = new Date(start);
    while (currentDate < end) {
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6); // Add 6 days to get end of week
        
        // Don't go beyond the event end date
        if (weekEnd > end) {
            weekEnd.setTime(end.getTime());
        }
        
        // Check if this week overlaps with the double points period
        let isDoubleWeek = false;
        if (doublePoints.enabled && doublePoints.start && doublePoints.end) {
            const periodStart = new Date(doublePoints.start);
            const periodEnd = new Date(doublePoints.end);
            // Week overlaps if current week start is before period end and week end is after period start
            isDoubleWeek = currentDate <= periodEnd && weekEnd >= periodStart;
        }
        
        // Add points for this week (still max 5 check-ins per week)
        const pointsPerCheckin = isDoubleWeek ? 200 : 100;
        totalPoints += 5 * pointsPerCheckin;
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return totalPoints;
}

function calculateTotalPoints() {
    // Get hunting points based on active input mode
    let total = 0;
    if (document.getElementById('weekInputGroup').style.display !== 'none') {
        const weeks = parseInt(document.getElementById('weekCount').value) || 0;
        total = calculateHuntingPoints(weeks);
    } else {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        total = calculateHuntingPoints(null, startDate, endDate);
    }
    
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
            .map(cb => cb.id),
        doublePoints: doublePoints
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
    
    // Restore unified double points configuration
    if (state.doublePoints) {
        doublePoints = state.doublePoints;
    } else {
        // Migrate from old format if needed
        if (state.doublePointsPeriod) {
            doublePoints.enabled = state.doublePointsPeriod.enabled;
            doublePoints.start = state.doublePointsPeriod.start;
            doublePoints.end = state.doublePointsPeriod.end;
        }
        if (state.weekModeDouble) {
            doublePoints.enabled = doublePoints.enabled || state.weekModeDouble.enabled;
            doublePoints.doubleWeeks = state.weekModeDouble.doubleWeeks;
        }
    }
    
    updateDoublePointsUI();
}

function toggleDoublePoints() {
    const isWeekMode = document.getElementById('weekInputGroup').style.display !== 'none';
    
    if (isWeekMode) {
        doublePoints.enabled = document.getElementById('enableDoublePoints').checked;
        const configDiv = document.getElementById('doublePointsConfig');
        
        if (doublePoints.enabled) {
            configDiv.style.display = 'block';
        } else {
            configDiv.style.display = 'none';
            doublePoints.doubleWeeks = 0;
        }
    } else {
        doublePoints.enabled = document.getElementById('enableDoublePointsDate').checked;
        const configDiv = document.getElementById('doublePointsDateConfig');
        
        if (doublePoints.enabled) {
            configDiv.style.display = 'block';
        } else {
            configDiv.style.display = 'none';
            doublePoints.start = '';
            doublePoints.end = '';
            document.getElementById('doubleStartDate').value = '';
            document.getElementById('doubleEndDate').value = '';
        }
    }
    
    updateDoublePointsInfo();
    updateDisplay();
}

function updateDoublePointsDate(field, value) {
    doublePoints[field] = value;
    updateDoublePointsInfo();
    updateDisplay();
}

function updateDoublePointsWeeks() {
    const doubleWeekCount = parseInt(document.getElementById('doubleWeekCount').value) || 0;
    doublePoints.doubleWeeks = doubleWeekCount;
    updateWeekModeDoublePeriodInfo();
    updateDisplay();
}

function updateDoublePointsUI() {
    const isWeekMode = document.getElementById('weekInputGroup').style.display !== 'none';
    
    if (isWeekMode) {
        // Week Mode UI
        const enableCheckbox = document.getElementById('enableDoublePoints');
        const configDiv = document.getElementById('doublePointsConfig');
        const doubleWeekInput = document.getElementById('doubleWeekCount');
        
        if (enableCheckbox) {
            enableCheckbox.checked = doublePoints.enabled;
        }
        
        if (configDiv) {
            configDiv.style.display = doublePoints.enabled ? 'block' : 'none';
        }
        
        if (doubleWeekInput) {
            doubleWeekInput.value = doublePoints.doubleWeeks || 4;
        }
        
        updateWeekModeDoublePeriodInfo();
    } else {
        // Date Mode UI
        const enableCheckbox = document.getElementById('enableDoublePointsDate');
        const configDiv = document.getElementById('doublePointsDateConfig');
        const startDateInput = document.getElementById('doubleStartDate');
        const endDateInput = document.getElementById('doubleEndDate');
        
        if (enableCheckbox) {
            enableCheckbox.checked = doublePoints.enabled;
        }
        
        if (configDiv) {
            configDiv.style.display = doublePoints.enabled ? 'block' : 'none';
        }
        
        if (startDateInput) {
            startDateInput.value = doublePoints.start || '';
        }
        
        if (endDateInput) {
            endDateInput.value = doublePoints.end || '';
        }
        
        updateDoublePointsInfo();
    }
}

function updateDoublePointsInfo() {
    const infoDiv = document.getElementById('doublePeriodInfo');
    if (!infoDiv) return;
    
    if (doublePoints.enabled && doublePoints.start && doublePoints.end) {
        const startDate = new Date(doublePoints.start);
        const endDate = new Date(doublePoints.end);
        const weeks = calculateWeeksBetweenDates(doublePoints.start, doublePoints.end);
        
        infoDiv.textContent = `2x period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} (${weeks} week${weeks !== 1 ? 's' : ''})`;
        infoDiv.style.display = 'block';
    } else if (doublePoints.enabled) {
        infoDiv.textContent = 'Please set both start and end dates for the 2x period';
        infoDiv.style.display = 'block';
    } else {
        infoDiv.style.display = 'none';
    }
}

function updateWeekModeDoublePeriodInfo() {
    const infoDiv = document.getElementById('weekModeDoublePeriodInfo');
    if (!infoDiv) return;
    
    if (doublePoints.enabled && doublePoints.doubleWeeks > 0) {
        const totalWeeks = parseInt(document.getElementById('weekCount').value) || 0;
        const doubleWeeks = Math.min(doublePoints.doubleWeeks, totalWeeks);
        const regularWeeks = Math.max(0, totalWeeks - doubleWeeks);
        
        const regularPoints = regularWeeks * 500;
        const doublePoints_calc = doubleWeeks * 1000;
        const totalPoints = regularPoints + doublePoints_calc;
        
        infoDiv.textContent = `${regularWeeks} regular weeks (${regularPoints.toLocaleString()}) + ${doubleWeeks} double weeks (${doublePoints_calc.toLocaleString()}) = ${totalPoints.toLocaleString()} hunting points`;
        infoDiv.style.display = 'block';
    } else {
        infoDiv.style.display = 'none';
    }
}

function updateDisplay() {
    const totalPoints = calculateTotalPoints();
    
    // Update total points display
    document.getElementById('totalPoints').textContent = totalPoints.toLocaleString();
    
    // Update ranks list
    updateRanksList();
    
    // Update double points info
    updateWeekModeDoubleInfo();
    updateWeekModeDoublePeriodInfo();
    
    // Save current state
    saveToLocalStorage();
}

function updateWeekModeDoubleInfo() {
    const weekModeInfo = document.getElementById('weekModeDoubleInfo');
    if (!weekModeInfo) return;
    
    if (doublePoints.enabled && doublePoints.doubleWeeks > 0) {
        weekModeInfo.style.display = 'block';
        weekModeInfo.textContent = `2x period enabled: ${doublePoints.doubleWeeks} double weeks configured`;
    } else {
        weekModeInfo.style.display = 'none';
    }
}

function handleDateChange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const weeks = calculateWeeksBetweenDates(startDate, endDate);
    
    // Calculate regular and double weeks
    let regularWeeks = weeks;
    let doubleWeeks = 0;
    
    if (startDate && endDate && doublePoints.enabled && doublePoints.start && doublePoints.end) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        regularWeeks = 0;
        doubleWeeks = 0;
        
        // Calculate week by week
        let currentDate = new Date(start);
        while (currentDate < end) {
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            if (weekEnd > end) {
                weekEnd.setTime(end.getTime());
            }
            
            // Check if this week overlaps with the double points period
            const periodStart = new Date(doublePoints.start);
            const periodEnd = new Date(doublePoints.end);
            const isDoubleWeek = currentDate <= periodEnd && weekEnd >= periodStart;
            
            if (isDoubleWeek) {
                doubleWeeks++;
            } else {
                regularWeeks++;
            }
            
            currentDate.setDate(currentDate.getDate() + 7);
        }
    }
    
    let calculationText = `Duration: ${weeks} week${weeks !== 1 ? 's' : ''}`;
    if (doubleWeeks > 0) {
        calculationText += ` (${regularWeeks} regular + ${doubleWeeks} double points)`;
    }
    
    document.getElementById('weekCalculation').textContent = calculationText;
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
    
    // Update the 2x period UI for the current mode
    updateDoublePointsUI();
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
    if (localStorage.getItem('challengerState')) {
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
