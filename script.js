const timerSettings = {
    DEFAULT_TIME: 25 * 60,
    SHORT_REST_TIME: 5 * 60,
    LONG_REST_TIME: 15 * 60,
    timeLeft: 25 * 60,
    timeGrind: 25 * 60,
    timeShortBreak: 5 * 60,
    timeLongBreak: 15 * 60,
    soundEnabled: true,
};

let isRunning = false;
let timer;

// Open and close the settings modal
function openSettingMenu() {
    document.getElementById('overlay').style.display = 'block';
    const modal = document.getElementById('settings-tab');
    modal.classList.add('show');
    modal.style.display = 'block';
}

function closeSettings() {
    document.getElementById('overlay').style.display = 'none';
    const modal = document.getElementById('settings-tab');
    modal.classList.remove('show');
    setTimeout(() => (modal.style.display = 'none'), 300);
}

// Set custom times from the settings modal
function setCustomTime() {
    const customPomodoro = parseInt(document.getElementById("pomodoroLength").value);
    const customShortBreak = parseInt(document.getElementById("shortBreakLength").value);
    const customLongBreak = parseInt(document.getElementById("longBreakLength").value);

    if (isNaN(customPomodoro) || customPomodoro <= 0 ||
        isNaN(customShortBreak) || customShortBreak <= 0 ||
        isNaN(customLongBreak) || customLongBreak <= 0) {
        alert("Please enter valid times greater than 0.");
        return;
    }

    timerSettings.timeGrind = customPomodoro * 60;
    timerSettings.timeShortBreak = customShortBreak * 60;
    timerSettings.timeLongBreak = customLongBreak * 60;
    const soundToggle = document.getElementById("soundToggle").checked;
    timerSettings.soundEnabled = soundToggle;

    timerSettings.timeLeft = timerSettings.timeGrind;
    closeSettings();
    updateDisplay();
}

// Switch between Pomodoro, Short Break, and Long Break
function switchMode(mode) {
    const modeMapping = {
        grind: timerSettings.timeGrind,
        shortBreak: timerSettings.timeShortBreak,
        longBreak: timerSettings.timeLongBreak,
    };

    // Update timeLeft to the selected mode
    timerSettings.timeLeft = modeMapping[mode] || timerSettings.timeGrind;

    // Update button transparency
    document.querySelectorAll('.mode-button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(`${mode}Mode`).classList.add('active');

    // Update timer display
    updateDisplay();
}


// Update the timer display
function updateDisplay() {
    const min = Math.floor(timerSettings.timeLeft / 60);
    const sec = timerSettings.timeLeft % 60;
    document.getElementById("minutes").textContent = min.toString().padStart(2, '0');
    document.getElementById("seconds").textContent = sec.toString().padStart(2, '0');
}

// Start, pause, and reset the timer
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timer = setInterval(interval, 1000);
    }
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timerSettings.timeLeft = timerSettings.timeGrind;
    updateDisplay();
    
}
function toogleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }

}

// Timer interval logic
function interval() {
    if (timerSettings.timeLeft > 0) {
        timerSettings.timeLeft--;
        updateDisplay();
    } else {
        clearInterval(timer);
        isRunning = false;
        alert("Time's up! Take a break!");
    }
    if (timerSettings.timeLeft === 0 && timerSettings.soundEnabled) {
        const audio = new Audio('alarm-sound.mp3');
        audio.play();
    }
}

// Initialize the timer display on page load
updateDisplay();

