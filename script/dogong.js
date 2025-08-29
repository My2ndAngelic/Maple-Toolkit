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

// Function to handle mode switching
function switchMode(mode) {
    const expInputs = document.getElementById('expInputs');
    const monsterInputs = document.getElementById('monsterInputs');
    
    if (mode === 'exp') {
        expInputs.style.display = 'block';
        monsterInputs.style.display = 'none';
    } else {
        expInputs.style.display = 'none';
        monsterInputs.style.display = 'block';
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
    return 'exp'; // default
}

// Function to get current inputs based on mode
function getCurrentInputs() {
    const mode = getCurrentMode();
    
    const currentLevel = parseInt(document.getElementById('currentLevel').value);
    const currentPercent = parseFloat(document.getElementById('currentPercent').value);
    
    if (mode === 'exp') {
        const gainedExp = parseInt(document.getElementById('gainedExp').value);
        return { currentLevel, currentPercent, baseExp: gainedExp };
    } else {
        const monsterBaseExp = parseInt(document.getElementById('monsterBaseExp').value);
        const monsterCount = parseInt(document.getElementById('monsterCount').value);
        const totalBaseExp = monsterBaseExp * monsterCount;
        return { currentLevel, currentPercent, baseExp: totalBaseExp };
    }
}

// Function to handle calculation
function handleCalculation() {
    const inputs = getCurrentInputs();
    
    // Validate inputs using the validation functions
    const levelInput = document.getElementById('currentLevel');
    const percentInput = document.getElementById('currentPercent');
    const levelValidation = document.getElementById('levelValidation');
    const percentValidation = document.getElementById('percentValidation');
    
    const isLevelValid = validateLevel(levelInput, levelValidation);
    const isPercentValid = validatePercent(percentInput, percentValidation);
    
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
    displayResults(results, getCurrentMode());
}

// Function to display results
function displayResults(results, mode) {
    const resultsSection = document.getElementById('resultsSection');
    
    // Calculate absolute EXP values
    const startingAbsoluteExp = calculateAbsoluteExp(results.startLevel, results.startPercent);
    const endingAbsoluteExp = calculateAbsoluteExp(results.finalLevel, results.finalPercent);
    
    // Format starting and ending information
    const startingText = `${results.startLevel} | ${results.startPercent.toFixed(2)}% | ${formatNumber(startingAbsoluteExp)}`;
    const endingText = `${results.finalLevel} | ${results.finalPercent.toFixed(2)}% | ${formatNumber(endingAbsoluteExp)}`;
    
    document.getElementById('resultStarting').textContent = startingText;
    document.getElementById('resultEnding').textContent = endingText;
    document.getElementById('resultBaseExp').textContent = formatNumber(results.baseExpGained);
    document.getElementById('resultTotalExp').textContent = formatNumber(Math.floor(results.totalExpReceived));
    
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
    
    if (isNaN(level) || level < 200 || level > 259) {
        validationSpan.textContent = 'Level must be between 200 and 259';
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
    
    levelInput.addEventListener('input', () => {
        validateLevel(levelInput, levelValidation);
    });
    
    levelInput.addEventListener('blur', () => {
        validateLevel(levelInput, levelValidation);
    });
    
    percentInput.addEventListener('input', () => {
        validatePercent(percentInput, percentValidation);
    });
    
    percentInput.addEventListener('blur', () => {
        validatePercent(percentInput, percentValidation);
    });
    
    // Prevent negative values for EXP inputs
    ['gainedExp', 'monsterBaseExp', 'monsterCount'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', (e) => {
                if (parseFloat(e.target.value) < 0) e.target.value = 0;
            });
        }
    });
    
    // Initialize with EXP mode
    switchMode('exp');
    
    console.log('Do Gong calculator initialized');
}

// Export the initialization function
export { initializeDogong };
