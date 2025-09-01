// dogong.js - Script for Do Gong's Mystic Bond Calculator
import { loadCSV } from "./csvHandling.js";

// Global variables
let levelExpData = [];

// EXP distribution rates based on level ranges
const EXP_RATES = {
    200: { min: 200, max: 210, rate: 1.5 },
    211: { min: 211, max: 220, rate: 3.0 },
    221: { min: 221, max: 230, rate: 6.0 },
    231: { min: 231, max: 240, rate: 9.0 },
    241: { min: 241, max: 250, rate: 12.0 },
    251: { min: 251, max: 259, rate: 15.0 }
};

// Function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to get EXP rate for a given level
function getExpRate(level) {
    for (const range of Object.values(EXP_RATES)) {
        if (level >= range.min && level <= range.max) {
            return range.rate;
        }
    }
    return 0; // Level 260+ gets no EXP
}

// Function to get EXP needed to reach next level
function getExpToNextLevel(level) {
    if (level < 200 || level > 299) return 0;
    
    const levelData = levelExpData.find(data => parseInt(data.Level) === level);
    return levelData ? parseInt(levelData['EXP to next level']) : 0;
}

// Function to calculate absolute EXP value for a level and percentage
function calculateAbsoluteExp(level, percent) {
    if (level >= 300) return 0; // Beyond our data
    
    let totalExp = 0;
    
    // Sum up all EXP from level 200 to current level
    for (let i = 200; i < level; i++) {
        totalExp += getExpToNextLevel(i);
    }
    
    // Add partial EXP for current level
    if (level < 300) {
        const expToNextLevel = getExpToNextLevel(level);
        totalExp += Math.floor((expToNextLevel * percent) / 100);
    }
    
    return totalExp;
}

// Function to calculate final level and EXP from base EXP gained
function calculateExpProgression(startLevel, startPercent, baseExpGained, isHyperBurning = false) {
    const results = {
        startLevel,
        startPercent,
        baseExpGained,
        isHyperBurning,
        progression: [],
        finalLevel: startLevel,
        finalPercent: startPercent,
        totalExpReceived: 0,
        levelsGained: 0
    };

    let currentLevel = startLevel;
    let currentPercent = startPercent;
    let remainingBaseExp = baseExpGained;

    // If level is 260 or higher, no EXP is gained
    if (currentLevel >= 260) {
        results.finalLevel = currentLevel;
        results.finalPercent = currentPercent;
        return results;
    }

    while (remainingBaseExp > 0 && currentLevel < 260) {
        const expRate = getExpRate(currentLevel);
        const expToNextLevel = getExpToNextLevel(currentLevel);
        
        if (expToNextLevel === 0) break; // Safety check
        
        // Calculate current EXP based on percentage
        const currentExp = Math.floor((expToNextLevel * currentPercent) / 100);
        const expNeededToLevel = expToNextLevel - currentExp;
        
        // Calculate how much base EXP is needed to level up
        const baseExpNeededToLevel = Math.ceil(expNeededToLevel / expRate);
        
        const progressionStep = {
            level: currentLevel,
            startPercent: currentPercent,
            multiplier: expRate,
            expNeededToLevel: expNeededToLevel,
            baseExpNeededToLevel: baseExpNeededToLevel
        };

        if (remainingBaseExp >= baseExpNeededToLevel) {
            // Can level up
            remainingBaseExp -= baseExpNeededToLevel;
            results.totalExpReceived += expNeededToLevel;
            
            // Handle hyper burning level gains
            if (isHyperBurning) {
                // Calculate how many levels to gain (5 total, but cap at 260)
                const levelsToGain = Math.min(5, 260 - currentLevel);
                currentLevel += levelsToGain;
                results.levelsGained += levelsToGain;
                
                progressionStep.levelsGained = levelsToGain;
                progressionStep.hyperBurning = true;
            } else {
                currentLevel++;
                results.levelsGained++;
                progressionStep.levelsGained = 1;
                progressionStep.hyperBurning = false;
            }
            
            currentPercent = 0;
            
            progressionStep.baseExpUsed = baseExpNeededToLevel;
            progressionStep.expApplied = expNeededToLevel;
            progressionStep.leveledUp = true;
        } else {
            // Partial level
            const expApplied = Math.floor(remainingBaseExp * expRate);
            const newCurrentExp = currentExp + expApplied;
            currentPercent = (newCurrentExp / expToNextLevel) * 100;
            results.totalExpReceived += expApplied;
            
            progressionStep.baseExpUsed = remainingBaseExp;
            progressionStep.expApplied = expApplied;
            progressionStep.leveledUp = false;
            progressionStep.levelsGained = 0;
            
            remainingBaseExp = 0;
        }
        
        progressionStep.endPercent = currentPercent;
        progressionStep.finalLevel = currentLevel;
        results.progression.push(progressionStep);
        
        // Stop if reached level 260
        if (currentLevel >= 260) break;
    }

    results.finalLevel = currentLevel;
    results.finalPercent = currentPercent;
    
    return results;
}

// Function to calculate base EXP needed to reach target level
function calculateBaseExpNeeded(startLevel, startPercent, targetLevel, targetPercent = 0, isHyperBurning = false) {
    if (startLevel >= targetLevel && startPercent >= targetPercent) {
        return 0; // Already at or past target
    }
    
    if (targetLevel > 260) {
        targetLevel = 260;
        targetPercent = 0;
    }
    
    // Calculate absolute EXP for start and target positions
    const startAbsoluteExp = calculateAbsoluteExp(startLevel, startPercent);
    const targetAbsoluteExp = calculateAbsoluteExp(targetLevel, targetPercent);
    
    let totalBaseExpNeeded = 0;
    let currentLevel = startLevel;
    let currentPercent = startPercent;
    let remainingExpNeeded = targetAbsoluteExp - startAbsoluteExp;
    
    while (remainingExpNeeded > 0 && currentLevel < targetLevel) {
        const expRate = getExpRate(currentLevel);
        if (expRate === 0) break; // Level 260+ gets no EXP
        
        const expToNextLevel = getExpToNextLevel(currentLevel);
        const currentExp = Math.floor((expToNextLevel * currentPercent) / 100);
        const expNeededToLevel = expToNextLevel - currentExp;
        
        if (remainingExpNeeded >= expNeededToLevel) {
            // Need to level up
            const baseExpForThisLevel = Math.ceil(expNeededToLevel / expRate);
            totalBaseExpNeeded += baseExpForThisLevel;
            remainingExpNeeded -= expNeededToLevel;
            
            // Handle hyper burning
            if (isHyperBurning) {
                const levelsToGain = Math.min(5, targetLevel - currentLevel);
                currentLevel += levelsToGain;
            } else {
                currentLevel++;
            }
            currentPercent = 0;
        } else {
            // Partial level needed
            const baseExpForPartial = Math.ceil(remainingExpNeeded / expRate);
            totalBaseExpNeeded += baseExpForPartial;
            remainingExpNeeded = 0;
        }
        
        // Safety check
        if (currentLevel >= targetLevel) {
            break;
        }
    }
    
    return totalBaseExpNeeded;
}

// Function to handle mode switching
function switchMode(mode) {
    const expInputs = document.getElementById('expInputs');
    const monsterInputs = document.getElementById('monsterInputs');
    const targetInputs = document.getElementById('targetInputs');
    
    // Hide all mode inputs first
    expInputs.style.display = 'none';
    monsterInputs.style.display = 'none';
    targetInputs.style.display = 'none';
    
    // Show the selected mode
    if (mode === 'exp') {
        expInputs.style.display = 'block';
    } else if (mode === 'monster') {
        monsterInputs.style.display = 'block';
    } else if (mode === 'target') {
        targetInputs.style.display = 'block';
    }
    
    // Re-validate current level based on new mode
    const levelInput = document.getElementById('currentLevel');
    const levelValidation = document.getElementById('levelValidation');
    if (mode === 'target') {
        validateLevelForTargetMode(levelInput, levelValidation);
    } else {
        validateLevel(levelInput, levelValidation);
    }
    
    // Hide results when switching modes
    document.getElementById('resultsSection').style.display = 'none';
}

// Function to get current mode
function getCurrentMode() {
    const modeRadios = document.querySelectorAll('input[name="calculatorMode"]');
    for (const radio of modeRadios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return 'target'; // default
}

// Function to get current inputs based on mode
function getCurrentInputs() {
    const mode = getCurrentMode();
    
    const currentLevel = parseInt(document.getElementById('currentLevel').value);
    const currentPercent = parseFloat(document.getElementById('currentPercent').value);
    
    if (mode === 'exp') {
        const gainedExp = parseInt(document.getElementById('gainedExp').value);
        return { currentLevel, currentPercent, baseExp: gainedExp };
    } else if (mode === 'monster') {
        const monsterBaseExp = parseInt(document.getElementById('monsterBaseExp').value);
        const monsterCount = parseInt(document.getElementById('monsterCount').value);
        const totalBaseExp = monsterBaseExp * monsterCount;
        return { currentLevel, currentPercent, baseExp: totalBaseExp };
    } else if (mode === 'target') {
        const targetLevel = parseInt(document.getElementById('targetLevel').value);
        const targetPercent = parseFloat(document.getElementById('targetPercent').value) || 0;
        const targetMonsterBaseExp = parseInt(document.getElementById('targetMonsterBaseExp').value) || 0;
        return { currentLevel, currentPercent, targetLevel, targetPercent, targetMonsterBaseExp, mode: 'target' };
    }
}

// Function to handle calculation
function handleCalculation() {
    const inputs = getCurrentInputs();
    const mode = getCurrentMode();
    
    // Validate inputs using the validation functions
    const levelInput = document.getElementById('currentLevel');
    const percentInput = document.getElementById('currentPercent');
    const levelValidation = document.getElementById('levelValidation');
    const percentValidation = document.getElementById('percentValidation');
    
    const isLevelValid = validateLevel(levelInput, levelValidation);
    const isPercentValid = validatePercent(percentInput, percentValidation);
    
    // Additional validation for target mode
    if (mode === 'target') {
        const targetLevelInput = document.getElementById('targetLevel');
        const targetPercentInput = document.getElementById('targetPercent');
        const targetMonsterExpInput = document.getElementById('targetMonsterBaseExp');
        const targetLevelValidation = document.getElementById('targetLevelValidation');
        const targetPercentValidation = document.getElementById('targetPercentValidation');
        const targetMonsterExpValidation = document.getElementById('targetMonsterExpValidation');
        
        // Use target mode specific validation for current level
        const isLevelValidForTarget = validateLevelForTargetMode(levelInput, levelValidation);
        const isPercentValidForTarget = validatePercent(percentInput, percentValidation);
        const isTargetLevelValid = validateTargetLevel(targetLevelInput, targetLevelValidation, inputs.currentLevel);
        const isTargetPercentValid = validateTargetPercent(
            targetPercentInput, 
            targetPercentValidation, 
            inputs.targetLevel, 
            inputs.currentLevel, 
            inputs.currentPercent
        );
        const isTargetMonsterExpValid = validateTargetMonsterExp(targetMonsterExpInput, targetMonsterExpValidation);
        
        if (!isLevelValidForTarget || !isPercentValidForTarget || !isTargetLevelValid || !isTargetPercentValid || !isTargetMonsterExpValid) {
            return; // Don't calculate if validation fails
        }
        
        // Check if hyper burning is enabled
        const isHyperBurning = document.getElementById('hyperBurning').checked;
        
        // Calculate base EXP needed for target level mode
        const baseExpNeeded = calculateBaseExpNeeded(
            inputs.currentLevel, 
            inputs.currentPercent, 
            inputs.targetLevel, 
            inputs.targetPercent, 
            isHyperBurning
        );
        
        // Calculate monsters needed if monster base EXP is provided
        let monstersNeeded = null;
        if (inputs.targetMonsterBaseExp > 0) {
            monstersNeeded = Math.ceil(baseExpNeeded / inputs.targetMonsterBaseExp);
        }
        
        // Create results object for target mode
        const results = calculateExpProgression(inputs.currentLevel, inputs.currentPercent, baseExpNeeded, isHyperBurning);
        results.baseExpNeeded = baseExpNeeded;
        results.targetLevel = inputs.targetLevel;
        results.targetPercent = inputs.targetPercent;
        results.monstersNeeded = monstersNeeded;
        results.targetMonsterBaseExp = inputs.targetMonsterBaseExp;
        
        displayResults(results, mode);
        return;
    }
    
    if (!isLevelValid || !isPercentValid) {
        return; // Don't calculate if validation fails
    }
    
    if (inputs.baseExp < 0) {
        alert('EXP values must be positive');
        return;
    }
    
    // Check if hyper burning is enabled
    const isHyperBurning = document.getElementById('hyperBurning').checked;
    
    const results = calculateExpProgression(inputs.currentLevel, inputs.currentPercent, inputs.baseExp, isHyperBurning);
    displayResults(results, mode);
}

// Function to display results
function displayResults(results, mode) {
    const resultsSection = document.getElementById('resultsSection');
    
    // Calculate absolute EXP values
    const startingAbsoluteExp = calculateAbsoluteExp(results.startLevel, results.startPercent);
    const endingAbsoluteExp = calculateAbsoluteExp(results.finalLevel, results.finalPercent);
    
    // Format starting and ending information
    const startingText = `${results.startLevel} | ${results.startPercent.toFixed(2)}% | ${formatNumber(startingAbsoluteExp)}`;
    
    let endingText;
    if (mode === 'target') {
        // For target mode, show the target level
        const targetAbsoluteExp = calculateAbsoluteExp(results.targetLevel, results.targetPercent);
        endingText = `${results.targetLevel} | ${results.targetPercent.toFixed(2)}% | ${formatNumber(targetAbsoluteExp)}`;
    } else {
        endingText = `${results.finalLevel} | ${results.finalPercent.toFixed(2)}% | ${formatNumber(endingAbsoluteExp)}`;
    }
    
    document.getElementById('resultStarting').textContent = startingText;
    document.getElementById('resultEnding').textContent = endingText;
    
    if (mode === 'target') {
        // For target mode, show the base EXP needed
        document.getElementById('resultBaseExp').textContent = formatNumber(results.baseExpNeeded);
        document.getElementById('resultTotalExp').textContent = formatNumber(Math.floor(results.totalExpReceived));
        
        // Show the "Base EXP Needed" result item
        const targetBaseExpNeeded = document.getElementById('targetBaseExpNeeded');
        document.getElementById('resultBaseExpNeeded').textContent = formatNumber(results.baseExpNeeded);
        targetBaseExpNeeded.style.display = 'flex';
        
        // Show/hide monsters needed result
        const targetMonstersNeeded = document.getElementById('targetMonstersNeeded');
        if (results.monstersNeeded !== null && results.targetMonsterBaseExp > 0) {
            document.getElementById('resultMonstersNeeded').textContent = formatNumber(results.monstersNeeded);
            targetMonstersNeeded.style.display = 'flex';
        } else {
            targetMonstersNeeded.style.display = 'none';
        }
    } else {
        // For other modes, show the base EXP gained
        document.getElementById('resultBaseExp').textContent = formatNumber(results.baseExpGained);
        document.getElementById('resultTotalExp').textContent = formatNumber(Math.floor(results.totalExpReceived));
        
        // Hide the target-specific result items
        const targetBaseExpNeeded = document.getElementById('targetBaseExpNeeded');
        const targetMonstersNeeded = document.getElementById('targetMonstersNeeded');
        targetBaseExpNeeded.style.display = 'none';
        targetMonstersNeeded.style.display = 'none';
    }
    
    // Show/hide hyper burning indicator
    const hyperBurningResult = document.getElementById('hyperBurningResult');
    if (results.isHyperBurning) {
        hyperBurningResult.style.display = 'flex';
    } else {
        hyperBurningResult.style.display = 'none';
    }
    
    resultsSection.style.display = 'block';
}

// Function to handle EXP mode calculation
function handleExpModeCalculation() {
    // This function is deprecated - using unified handleCalculation instead
    handleCalculation();
}

// Function to handle monster mode calculation
function handleMonsterModeCalculation() {
    // This function is deprecated - using unified handleCalculation instead
    handleCalculation();
}

// Function to validate input limits
function validateInput(input, min, max) {
    // This function is deprecated - using real-time validation instead
}

// Function to validate level input
function validateLevel(levelInput, validationSpan) {
    const level = parseInt(levelInput.value);
    
    if (isNaN(level) || level < 200 || level > 260) {
        validationSpan.textContent = 'Level must be between 200 and 260';
        levelInput.style.borderColor = '#dc3545';
        return false;
    } else {
        validationSpan.textContent = '';
        levelInput.style.borderColor = '#ddd';
        return true;
    }
}

// Function to validate level input specifically for target mode
function validateLevelForTargetMode(levelInput, validationSpan) {
    const level = parseInt(levelInput.value);
    
    if (isNaN(level) || level < 200 || level > 260) {
        validationSpan.textContent = 'Level must be between 200 and 260';
        levelInput.style.borderColor = '#dc3545';
        return false;
    } else if (level >= 260) {
        validationSpan.textContent = 'Level 260+ characters cannot gain EXP (already at cap)';
        levelInput.style.borderColor = '#dc3545';
        return false;
    } else {
        validationSpan.textContent = '';
        levelInput.style.borderColor = '#ddd';
        return true;
    }
}

// Function to validate EXP percentage input
function validatePercent(percentInput, validationSpan) {
    const percent = parseFloat(percentInput.value);
    
    if (isNaN(percent) || percent < 0 || percent >= 100) {
        validationSpan.textContent = 'EXP % must be between 0 and 99.99';
        percentInput.style.borderColor = '#dc3545';
        return false;
    } else {
        validationSpan.textContent = '';
        percentInput.style.borderColor = '#ddd';
        return true;
    }
}

// Function to validate target level input
function validateTargetLevel(targetLevelInput, validationSpan, currentLevel) {
    const targetLevel = parseInt(targetLevelInput.value);
    
    if (isNaN(targetLevel) || targetLevel < 201 || targetLevel > 260) {
        validationSpan.textContent = 'Target level must be between 201 and 260';
        targetLevelInput.style.borderColor = '#dc3545';
        return false;
    } else if (targetLevel <= currentLevel) {
        validationSpan.textContent = 'Target level must be higher than current level';
        targetLevelInput.style.borderColor = '#dc3545';
        return false;
    } else {
        validationSpan.textContent = '';
        targetLevelInput.style.borderColor = '#ddd';
        return true;
    }
}

// Function to validate target EXP percentage input
function validateTargetPercent(targetPercentInput, validationSpan, targetLevel, currentLevel, currentPercent) {
    const targetPercent = parseFloat(targetPercentInput.value);
    
    if (isNaN(targetPercent) || targetPercent < 0 || targetPercent >= 100) {
        validationSpan.textContent = 'Target EXP % must be between 0 and 99.99';
        targetPercentInput.style.borderColor = '#dc3545';
        return false;
    }
    
    // Special validation for level 260
    if (targetLevel === 260 && targetPercent > 0) {
        validationSpan.textContent = 'Level 260 target must have 0% EXP (EXP stops at 260)';
        targetPercentInput.style.borderColor = '#dc3545';
        return false;
    }
    
    // Check if target is actually reachable
    if (targetLevel === currentLevel && targetPercent <= currentPercent) {
        validationSpan.textContent = 'Target EXP % must be higher than current EXP %';
        targetPercentInput.style.borderColor = '#dc3545';
        return false;
    }
    
    validationSpan.textContent = '';
    targetPercentInput.style.borderColor = '#ddd';
    return true;
}

// Function to validate target monster base EXP input
function validateTargetMonsterExp(targetMonsterExpInput, validationSpan) {
    const value = targetMonsterExpInput.value.trim();
    
    // Allow empty value (optional field)
    if (value === '') {
        validationSpan.textContent = '';
        targetMonsterExpInput.style.borderColor = '#ddd';
        return true;
    }
    
    const targetMonsterExp = parseInt(value);
    
    if (isNaN(targetMonsterExp) || targetMonsterExp < 0) {
        validationSpan.textContent = 'Base Monster EXP must be a positive number or empty';
        targetMonsterExpInput.style.borderColor = '#dc3545';
        return false;
    } else {
        validationSpan.textContent = '';
        targetMonsterExpInput.style.borderColor = '#ddd';
        return true;
    }
}

// Function to load level EXP data
async function loadLevelExpData() {
    try {
        levelExpData = await loadCSV('../data/level_exp.csv');
        console.log('Loaded level EXP data:', levelExpData.length, 'entries');
    } catch (error) {
        console.error('Error loading level EXP data:', error);
        alert('Error loading level EXP data. Please check that level_exp.csv exists.');
    }
}

// Initialize the Do Gong calculator
async function initializeDogong() {
    await loadLevelExpData();
    
    // Mode switching with radio buttons
    const modeRadios = document.querySelectorAll('input[name="calculatorMode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchMode(e.target.value);
        });
    });
    
    // Calculate button (unified)
    document.getElementById('calculateResult').addEventListener('click', handleCalculation);
    
    // Real-time input validation
    const levelInput = document.getElementById('currentLevel');
    const percentInput = document.getElementById('currentPercent');
    const levelValidation = document.getElementById('levelValidation');
    const percentValidation = document.getElementById('percentValidation');
    
    // Target level validation elements
    const targetLevelInput = document.getElementById('targetLevel');
    const targetPercentInput = document.getElementById('targetPercent');
    const targetMonsterExpInput = document.getElementById('targetMonsterBaseExp');
    const targetLevelValidation = document.getElementById('targetLevelValidation');
    const targetPercentValidation = document.getElementById('targetPercentValidation');
    const targetMonsterExpValidation = document.getElementById('targetMonsterExpValidation');
    
    levelInput.addEventListener('input', () => {
        const mode = getCurrentMode();
        if (mode === 'target') {
            validateLevelForTargetMode(levelInput, levelValidation);
        } else {
            validateLevel(levelInput, levelValidation);
        }
        
        // Re-validate target fields when current level changes
        const currentLevel = parseInt(levelInput.value);
        if (!isNaN(currentLevel)) {
            validateTargetLevel(targetLevelInput, targetLevelValidation, currentLevel);
            // Also re-validate target percent
            const targetLevel = parseInt(targetLevelInput.value);
            const currentPercent = parseFloat(document.getElementById('currentPercent').value);
            validateTargetPercent(targetPercentInput, targetPercentValidation, targetLevel, currentLevel, currentPercent);
        }
    });
    
    levelInput.addEventListener('blur', () => {
        const mode = getCurrentMode();
        if (mode === 'target') {
            validateLevelForTargetMode(levelInput, levelValidation);
        } else {
            validateLevel(levelInput, levelValidation);
        }
    });
    
    percentInput.addEventListener('input', () => {
        validatePercent(percentInput, percentValidation);
        // Re-validate target percent when current percent changes
        const targetLevel = parseInt(targetLevelInput.value);
        const currentLevel = parseInt(levelInput.value);
        const currentPercent = parseFloat(percentInput.value);
        validateTargetPercent(targetPercentInput, targetPercentValidation, targetLevel, currentLevel, currentPercent);
    });
    
    percentInput.addEventListener('blur', () => {
        validatePercent(percentInput, percentValidation);
    });
    
    targetLevelInput.addEventListener('input', () => {
        const currentLevel = parseInt(document.getElementById('currentLevel').value);
        validateTargetLevel(targetLevelInput, targetLevelValidation, currentLevel);
        // Re-validate target percent when target level changes
        const targetLevel = parseInt(targetLevelInput.value);
        const currentPercent = parseFloat(document.getElementById('currentPercent').value);
        validateTargetPercent(targetPercentInput, targetPercentValidation, targetLevel, currentLevel, currentPercent);
    });
    
    targetLevelInput.addEventListener('blur', () => {
        const currentLevel = parseInt(document.getElementById('currentLevel').value);
        validateTargetLevel(targetLevelInput, targetLevelValidation, currentLevel);
        // Re-validate target percent when target level changes
        const targetLevel = parseInt(targetLevelInput.value);
        const currentPercent = parseFloat(document.getElementById('currentPercent').value);
        validateTargetPercent(targetPercentInput, targetPercentValidation, targetLevel, currentLevel, currentPercent);
    });
    
    targetPercentInput.addEventListener('input', () => {
        const targetLevel = parseInt(targetLevelInput.value);
        const currentLevel = parseInt(document.getElementById('currentLevel').value);
        const currentPercent = parseFloat(document.getElementById('currentPercent').value);
        validateTargetPercent(targetPercentInput, targetPercentValidation, targetLevel, currentLevel, currentPercent);
    });
    
    targetPercentInput.addEventListener('blur', () => {
        const targetLevel = parseInt(targetLevelInput.value);
        const currentLevel = parseInt(document.getElementById('currentLevel').value);
        const currentPercent = parseFloat(document.getElementById('currentPercent').value);
        validateTargetPercent(targetPercentInput, targetPercentValidation, targetLevel, currentLevel, currentPercent);
    });
    
    targetMonsterExpInput.addEventListener('input', () => {
        validateTargetMonsterExp(targetMonsterExpInput, targetMonsterExpValidation);
    });
    
    targetMonsterExpInput.addEventListener('blur', () => {
        validateTargetMonsterExp(targetMonsterExpInput, targetMonsterExpValidation);
    });
    
    // Prevent negative values for EXP inputs
    ['gainedExp', 'monsterBaseExp', 'monsterCount', 'targetLevel', 'targetPercent', 'targetMonsterBaseExp'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', (e) => {
                if (parseFloat(e.target.value) < 0) e.target.value = 0;
            });
        }
    });
    
    // Initialize with Target Level mode
    switchMode('target');
    
    console.log('Do Gong calculator initialized');
}

// Export the initialization function
export { initializeDogong };
