// Daily Activity Planner for Kyu
class ActivityPlanner {
    constructor() {
        this.currentDay = 'monday';
        this.currentTab = 'daily';
        this.activities = this.loadActivities();
        this.completedTasks = this.loadCompletedTasks();
        this.settings = this.loadSettings();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDateDisplay();
        this.setCurrentDay();
        this.applyTheme();
        this.updateProgress();
        this.updateWeeklyOverview();
        this.loadDayData(this.currentDay);
        this.loadSaveSlotDisplays();
        this.loadSaveStatus();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Day selector
        document.querySelectorAll('.day-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchDay(e.target.dataset.day);
            });
        });

        // Activity checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.dataset.activity) {
                this.toggleActivity(e.target.dataset.activity, e.target.checked);
            }
        });

        // Time inputs - Direct event handling
        this.setupTimeInputListeners();

        // Settings
        document.getElementById('add-activity-btn').addEventListener('click', () => {
            this.addCustomActivity();
        });

        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Print functionality
        document.getElementById('print-daily').addEventListener('click', () => {
            this.printDailySchedule();
        });

        document.getElementById('print-weekly').addEventListener('click', () => {
            this.printWeeklyOverview();
        });

        document.getElementById('print-schedule').addEventListener('click', () => {
            this.printFullSchedule();
        });

        // Save data functionality
        document.getElementById('save-data').addEventListener('click', () => {
            this.saveDataManually();
        });

        // Save slot functionality
        document.querySelectorAll('.save-to-slot').forEach(button => {
            button.addEventListener('click', (e) => {
                this.saveToSlot(e.target.dataset.slot);
            });
        });

        document.querySelectorAll('.load-from-slot').forEach(button => {
            button.addEventListener('click', (e) => {
                this.loadFromSlot(e.target.dataset.slot);
            });
        });

        document.querySelectorAll('.delete-slot').forEach(button => {
            button.addEventListener('click', (e) => {
                this.deleteSlot(e.target.dataset.slot);
            });
        });

        // Daily save button (next to print)
        document.getElementById('save-daily').addEventListener('click', () => {
            this.saveDataManually();
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveAllData();
        }, 30000);
    }

    setupTimeInputListeners() {
        console.log('Setting up time input listeners');
        
        // Direct event listeners for each time input
        document.querySelectorAll('.time-input').forEach((timeInput, index) => {
            console.log(`Setting up listener for time input ${index}:`, timeInput);
            
            const timeContainer = timeInput.closest('.time-container');
            const saveIcon = timeContainer.querySelector('.time-save-icon'); // Save icon is within the time-container
            
            // Store original value for comparison
            timeInput.dataset.originalValue = timeInput.value;
            
            // Multiple event types to ensure we catch changes
            ['change', 'input'].forEach(eventType => {
                timeInput.addEventListener(eventType, (e) => {
                    console.log(`Time ${eventType} event:`, e.target.value);
                    this.handleTimeChange(e.target);
                });
            });
            
            // Set up save icon click handler
            if (saveIcon && saveIcon.classList.contains('time-save-icon')) {
                saveIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.saveSpecificTime(timeInput);
                });
            }
        });
        
        console.log('Time input listeners setup complete');
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        if (tabName === 'weekly') {
            this.updateWeeklyOverview();
        }
    }

    switchDay(dayName) {
        this.saveCurrentDayData();
        
        // Update active day button
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-day="${dayName}"]`).classList.add('active');

        // Update current day display
        const dayNames = {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
            sunday: 'Sunday'
        };
        
        document.getElementById('selected-day').textContent = dayNames[dayName];
        this.currentDay = dayName;
        
        this.loadDayData(dayName);
        this.setupTimeInputListeners(); // Reinitialize time listeners
        this.updateProgress();
    }

    setCurrentDay() {
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[today.getDay()];
        
        // Auto-select current day if it's a new day
        const lastActiveDate = localStorage.getItem('lastActiveDate');
        const currentDate = today.toDateString();
        
        if (lastActiveDate !== currentDate) {
            this.resetDailyProgress();
            localStorage.setItem('lastActiveDate', currentDate);
        }
        
        this.switchDay(currentDayName);
    }

    updateDateDisplay() {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);
    }

    toggleActivity(activityId, isChecked) {
        const dayKey = `${this.currentDay}-${activityId}`;
        
        if (isChecked) {
            this.completedTasks.add(dayKey);
        } else {
            this.completedTasks.delete(dayKey);
        }
        
        this.updateProgress();
        this.updateActivityItemStyle(activityId, isChecked);
        this.saveCompletedTasks();
    }

    updateActivityItemStyle(activityId, isCompleted) {
        const activityItem = document.querySelector(`input[data-activity="${activityId}"]`).closest('.activity-item');
        if (isCompleted) {
            activityItem.classList.add('completed');
        } else {
            activityItem.classList.remove('completed');
        }
    }

    updateProgress() {
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-activity]');
        const checkedCheckboxes = Array.from(allCheckboxes).filter(cb => cb.checked);
        
        const percentage = allCheckboxes.length > 0 ? 
            Math.round((checkedCheckboxes.length / allCheckboxes.length) * 100) : 0;
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% Complete`;
        
        // Store daily completion for weekly overview
        this.storeDailyCompletion(this.currentDay, percentage);
    }

    storeDailyCompletion(day, percentage) {
        const completionData = JSON.parse(localStorage.getItem('dailyCompletions') || '{}');
        const today = new Date().toDateString();
        
        if (!completionData[today]) {
            completionData[today] = {};
        }
        
        completionData[today][day] = percentage;
        localStorage.setItem('dailyCompletions', JSON.stringify(completionData));
    }

    updateWeeklyOverview() {
        const completionData = JSON.parse(localStorage.getItem('dailyCompletions') || '{}');
        const today = new Date().toDateString();
        const todayData = completionData[today] || {};
        
        document.querySelectorAll('.daily-completion').forEach(element => {
            const day = element.dataset.day;
            const percentage = todayData[day] || 0;
            element.textContent = `${percentage}%`;
            
            // Color code based on completion
            element.style.color = percentage >= 80 ? '#48bb78' : 
                                 percentage >= 60 ? '#ed8936' : 
                                 percentage >= 30 ? '#f6e05e' : '#e53e3e';
        });
    }

    saveCurrentDayData() {
        console.log('saveCurrentDayData called for day:', this.currentDay);
        const dayData = {};
        
        // Save checkbox states
        document.querySelectorAll('input[type="checkbox"][data-activity]').forEach(checkbox => {
            dayData[checkbox.dataset.activity] = checkbox.checked;
        });
        
        // Save time preferences
        document.querySelectorAll('.time-input').forEach(timeInput => {
            const activityItem = timeInput.closest('.activity-item');
            const checkbox = activityItem.querySelector('input[type="checkbox"]');
            if (checkbox) {
                const timeKey = `${checkbox.dataset.activity}-time`;
                const timeValue = timeInput.value;
                dayData[timeKey] = timeValue;
                console.log('Saving time for', checkbox.dataset.activity, ':', timeValue, 'as key:', timeKey);
            }
        });
        
        console.log('Final dayData object:', dayData);
        const storageKey = `dayData-${this.currentDay}`;
        localStorage.setItem(storageKey, JSON.stringify(dayData));
        console.log('Saved to localStorage with key:', storageKey);
        
        // Verify it was saved
        const verification = localStorage.getItem(storageKey);
        console.log('Verification - retrieved from localStorage:', verification);
    }

    loadDayData(day) {
        console.log('loadDayData called for day:', day);
        const dayData = JSON.parse(localStorage.getItem(`dayData-${day}`) || '{}');
        const globalTimes = JSON.parse(localStorage.getItem('globalTimePreferences') || '{}');
        
        console.log('Day data loaded:', dayData);
        console.log('Global times loaded:', globalTimes);
        
        // Load checkbox states
        document.querySelectorAll('input[type="checkbox"][data-activity]').forEach(checkbox => {
            const isChecked = dayData[checkbox.dataset.activity] || false;
            checkbox.checked = isChecked;
            this.updateActivityItemStyle(checkbox.dataset.activity, isChecked);
        });
        
        // Load time preferences (day-specific first, then global fallback)
        document.querySelectorAll('.time-input').forEach(timeInput => {
            const activityItem = timeInput.closest('.activity-item');
            const checkbox = activityItem.querySelector('input[type="checkbox"]');
            if (checkbox) {
                const activityId = checkbox.dataset.activity;
                const savedDayTime = dayData[`${activityId}-time`];
                const globalTime = globalTimes[activityId];
                
                console.log(`Loading time for ${activityId}: day-specific=${savedDayTime}, global=${globalTime}`);
                
                if (savedDayTime) {
                    timeInput.value = savedDayTime;
                    console.log(`Set ${activityId} time to day-specific: ${savedDayTime}`);
                } else if (globalTime) {
                    timeInput.value = globalTime;
                    console.log(`Set ${activityId} time to global: ${globalTime}`);
                    // Save the global time as day-specific time
                    dayData[`${activityId}-time`] = globalTime;
                    localStorage.setItem(`dayData-${day}`, JSON.stringify(dayData));
                } else {
                    console.log(`No saved time found for ${activityId}, keeping default: ${timeInput.value}`);
                }
            }
        });
    }

    saveTimePreference(timeInput) {
        console.log('=== saveTimePreference START ===');
        console.log('Time input value:', timeInput.value);
        console.log('Current day:', this.currentDay);
        
        try {
            // Get activity info
            const activityItem = timeInput.closest('.activity-item');
            const checkbox = activityItem ? activityItem.querySelector('input[type="checkbox"]') : null;
            
            if (!checkbox) {
                console.error('No checkbox found for time input');
                return;
            }
            
            const activityId = checkbox.dataset.activity;
            const timeValue = timeInput.value;
            
            console.log('Activity ID:', activityId);
            console.log('Time value:', timeValue);
            
            // Save day-specific time immediately
            const dayKey = `dayData-${this.currentDay}`;
            const dayData = JSON.parse(localStorage.getItem(dayKey) || '{}');
            const timeKey = `${activityId}-time`;
            
            console.log('Day key:', dayKey);
            console.log('Time key:', timeKey);
            console.log('Existing day data:', dayData);
            
            dayData[timeKey] = timeValue;
            localStorage.setItem(dayKey, JSON.stringify(dayData));
            
            console.log('Updated day data:', dayData);
            console.log('Saved to localStorage with key:', dayKey);
            
            // Verify day save
            const verifyDay = localStorage.getItem(dayKey);
            console.log('Day save verification:', verifyDay);
            
            // Save global time preference
            const globalTimes = JSON.parse(localStorage.getItem('globalTimePreferences') || '{}');
            globalTimes[activityId] = timeValue;
            localStorage.setItem('globalTimePreferences', JSON.stringify(globalTimes));
            
            console.log('Global times saved:', globalTimes);
            
            // Verify global save
            const verifyGlobal = localStorage.getItem('globalTimePreferences');
            console.log('Global save verification:', verifyGlobal);
            
            this.updateSaveStatus();
            console.log('=== saveTimePreference SUCCESS ===');
            
        } catch (error) {
            console.error('=== saveTimePreference ERROR ===', error);
        }
    }

    handleTimeChange(timeInput) {
        console.log('handleTimeChange called with:', timeInput.value);
        
        const timeContainer = timeInput.closest('.time-container');
        const saveIcon = timeContainer.querySelector('.time-save-icon'); // Save icon is within the time-container
        const originalValue = timeInput.dataset.originalValue || timeInput.defaultValue;
        
        // Check if time has actually changed
        if (timeInput.value !== originalValue) {
            // Show the save icon
            if (saveIcon && saveIcon.classList.contains('time-save-icon')) {
                saveIcon.style.display = 'flex';
                saveIcon.classList.remove('saved');
            }
            
            // Add visual indicator to time input
            timeInput.classList.add('has-changes');
            
            console.log('Time changed from', originalValue, 'to', timeInput.value);
        } else {
            // Hide the save icon if back to original value
            if (saveIcon && saveIcon.classList.contains('time-save-icon')) {
                saveIcon.style.display = 'none';
            }
            
            timeInput.classList.remove('has-changes');
        }
    }

    saveSpecificTime(timeInput) {
        console.log('saveSpecificTime called for:', timeInput.value);
        
        const timeContainer = timeInput.closest('.time-container');
        const saveIcon = timeContainer.querySelector('.time-save-icon'); // Save icon is within the time-container
        
        // Add saving animation
        if (saveIcon && saveIcon.classList.contains('time-save-icon')) {
            saveIcon.classList.add('saving');
        }
        
        try {
            // Save the time using existing method
            this.saveTimePreference(timeInput);
            
            // Update original value
            timeInput.dataset.originalValue = timeInput.value;
            
            // Remove visual indicators
            timeInput.classList.remove('has-changes');
            
            // Show success animation
            if (saveIcon && saveIcon.classList.contains('time-save-icon')) {
                saveIcon.classList.remove('saving');
                saveIcon.classList.add('saved');
                
                // Hide after success animation
                setTimeout(() => {
                    saveIcon.style.display = 'none';
                    saveIcon.classList.remove('saved');
                }, 1000);
            }
            
            // Show notification
            this.showSaveNotification('💾 Time saved successfully!');
            
        } catch (error) {
            console.error('Error saving time:', error);
            
            // Remove saving animation and show error
            if (saveIcon && saveIcon.classList.contains('time-save-icon')) {
                saveIcon.classList.remove('saving');
            }
            
            this.showSaveNotification('❌ Error saving time', 'error');
        }
    }

    addCustomActivity() {
        const activityInput = document.getElementById('new-activity');
        const categorySelect = document.getElementById('activity-category');
        
        const activityText = activityInput.value.trim();
        const category = categorySelect.value;
        
        if (!activityText) {
            alert('Please enter an activity name');
            return;
        }
        
        const activityId = `custom-${Date.now()}`;
        const categoryContainer = document.querySelector(`[data-category="${category}"]`);
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <input type="checkbox" id="${activityId}" data-activity="${activityId}">
            <label for="${activityId}">${activityText}</label>
            <button class="remove-activity" data-activity="${activityId}">×</button>
        `;
        
        categoryContainer.appendChild(activityItem);
        
        // Add event listener for new checkbox
        activityItem.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            this.toggleActivity(e.target.dataset.activity, e.target.checked);
        });
        
        // Add event listener for remove button
        activityItem.querySelector('.remove-activity').addEventListener('click', (e) => {
            this.removeCustomActivity(e.target.dataset.activity, activityItem);
        });
        
        // Save custom activity
        this.saveCustomActivity(activityId, activityText, category);
        
        // Clear input
        activityInput.value = '';
        
        this.updateProgress();
    }

    removeCustomActivity(activityId, activityElement) {
        if (confirm('Are you sure you want to remove this activity?')) {
            activityElement.remove();
            this.removeFromCustomActivities(activityId);
            this.updateProgress();
        }
    }

    saveCustomActivity(id, text, category) {
        const customActivities = JSON.parse(localStorage.getItem('customActivities') || '[]');
        customActivities.push({ id, text, category });
        localStorage.setItem('customActivities', JSON.stringify(customActivities));
    }

    removeFromCustomActivities(activityId) {
        const customActivities = JSON.parse(localStorage.getItem('customActivities') || '[]');
        const filtered = customActivities.filter(activity => activity.id !== activityId);
        localStorage.setItem('customActivities', JSON.stringify(filtered));
    }

    loadCustomActivities() {
        const customActivities = JSON.parse(localStorage.getItem('customActivities') || '[]');
        
        customActivities.forEach(activity => {
            const categoryContainer = document.querySelector(`[data-category="${activity.category}"]`);
            if (categoryContainer) {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <input type="checkbox" id="${activity.id}" data-activity="${activity.id}">
                    <label for="${activity.id}">${activity.text}</label>
                    <button class="remove-activity" data-activity="${activity.id}">×</button>
                `;
                
                categoryContainer.appendChild(activityItem);
                
                // Add event listeners
                activityItem.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                    this.toggleActivity(e.target.dataset.activity, e.target.checked);
                });
                
                activityItem.querySelector('.remove-activity').addEventListener('click', (e) => {
                    this.removeCustomActivity(e.target.dataset.activity, activityItem);
                });
            }
        });
    }

    changeTheme(theme) {
        document.body.className = theme === 'default' ? '' : `${theme}-theme`;
        this.settings.theme = theme;
        this.saveSettings();
    }

    applyTheme() {
        const theme = this.settings.theme || 'default';
        document.getElementById('theme-select').value = theme;
        this.changeTheme(theme);
    }

    resetDailyProgress() {
        // Reset all checkbox states for new day
        this.completedTasks.clear();
        this.saveCompletedTasks();
    }

    exportData() {
        const exportData = {
            completedTasks: Array.from(this.completedTasks),
            customActivities: JSON.parse(localStorage.getItem('customActivities') || '[]'),
            dailyCompletions: JSON.parse(localStorage.getItem('dailyCompletions') || '{}'),
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `kyu-activity-planner-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (confirm('This will replace all current data. Are you sure?')) {
                    // Import data
                    this.completedTasks = new Set(importData.completedTasks || []);
                    this.settings = importData.settings || {};
                    
                    localStorage.setItem('customActivities', JSON.stringify(importData.customActivities || []));
                    localStorage.setItem('dailyCompletions', JSON.stringify(importData.dailyCompletions || {}));
                    
                    this.saveAllData();
                    
                    // Refresh interface
                    location.reload();
                }
            } catch (error) {
                alert('Invalid file format. Please select a valid backup file.');
            }
        };
        reader.readAsText(file);
    }

    loadActivities() {
        // Default activities are in HTML, custom activities loaded separately
        return {};
    }

    loadCompletedTasks() {
        const saved = localStorage.getItem('completedTasks');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    }

    loadSettings() {
        const saved = localStorage.getItem('plannerSettings');
        return saved ? JSON.parse(saved) : {};
    }

    saveCompletedTasks() {
        localStorage.setItem('completedTasks', JSON.stringify(Array.from(this.completedTasks)));
    }

    saveSettings() {
        localStorage.setItem('plannerSettings', JSON.stringify(this.settings));
    }

    saveAllData() {
        this.saveCurrentDayData();
        this.saveCompletedTasks();
        this.saveSettings();
        this.updateSaveStatus();
    }

    // Enhanced Save Data Functionality
    saveDataManually() {
        this.showSaveNotification('⏳ Saving data...', 'saving');
        
        try {
            // First save current day data (including current time changes)
            this.saveCurrentDayData();
            
            // Save all other data
            this.saveCompletedTasks();
            this.saveSettings();
            
            // Save global time preferences from current form state
            this.saveCurrentGlobalTimePreferences();
            
            this.showSaveNotification('✅ Data saved successfully!');
            this.updateSaveStatus();
            
        } catch (error) {
            console.error('Save error:', error);
            this.showSaveNotification('❌ Error saving data', 'error');
        }
    }

    saveCurrentGlobalTimePreferences() {
        const globalTimes = {};
        
        // Get all current time values from the form
        document.querySelectorAll('.time-input').forEach(timeInput => {
            const activityItem = timeInput.closest('.activity-item');
            const checkbox = activityItem.querySelector('input[type="checkbox"]');
            if (checkbox && timeInput.value) {
                const activityId = checkbox.dataset.activity;
                globalTimes[activityId] = timeInput.value;
            }
        });
        
        // Save to localStorage
        localStorage.setItem('globalTimePreferences', JSON.stringify(globalTimes));
    }

    saveToSlot(slotNumber) {
        const slotKey = `saveSlot${slotNumber}`;
        const timestamp = new Date().toLocaleString();
        
        try {
            // First save current data
            this.saveCurrentDayData();
            this.saveCurrentGlobalTimePreferences();
            
            // Gather all data
            const saveData = {
                timestamp: timestamp,
                completedTasks: Array.from(this.completedTasks),
                customActivities: JSON.parse(localStorage.getItem('customActivities') || '[]'),
                dailyCompletions: JSON.parse(localStorage.getItem('dailyCompletions') || '{}'),
                globalTimePreferences: JSON.parse(localStorage.getItem('globalTimePreferences') || '{}'),
                settings: this.settings,
                dayData: {}
            };
            
            // Save data for each day
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            days.forEach(day => {
                const dayData = localStorage.getItem(`dayData-${day}`);
                if (dayData) {
                    saveData.dayData[day] = JSON.parse(dayData);
                }
            });
            
            // Save to slot
            localStorage.setItem(slotKey, JSON.stringify(saveData));
            
            this.showSaveNotification(`💾 Saved to Slot ${slotNumber}!`);
            this.updateSaveSlotDisplay(slotNumber, timestamp);
            
        } catch (error) {
            console.error('Slot save error:', error);
            this.showSaveNotification('❌ Error saving to slot', 'error');
        }
    }

    loadFromSlot(slotNumber) {
        const slotKey = `saveSlot${slotNumber}`;
        const savedData = localStorage.getItem(slotKey);
        
        if (!savedData) {
            this.showSaveNotification('❌ No data in this slot', 'warning');
            return;
        }
        
        try {
            const saveData = JSON.parse(savedData);
            const confirmMessage = `Load data from Slot ${slotNumber}?\n\nSaved: ${saveData.timestamp}\n\nThis will replace your current progress.`;
            
            if (confirm(confirmMessage)) {
                // Restore data
                this.completedTasks = new Set(saveData.completedTasks || []);
                this.settings = saveData.settings || {};
                
                localStorage.setItem('customActivities', JSON.stringify(saveData.customActivities || []));
                localStorage.setItem('dailyCompletions', JSON.stringify(saveData.dailyCompletions || '{}'));
                localStorage.setItem('globalTimePreferences', JSON.stringify(saveData.globalTimePreferences || '{}'));
                
                // Restore day data
                Object.keys(saveData.dayData || {}).forEach(day => {
                    localStorage.setItem(`dayData-${day}`, JSON.stringify(saveData.dayData[day]));
                });
                
                this.saveAllData();
                this.showSaveNotification(`📂 Loaded from Slot ${slotNumber}!`);
                
                // Refresh the interface
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
            
        } catch (error) {
            console.error('Slot load error:', error);
            this.showSaveNotification('❌ Error loading from slot', 'error');
        }
    }

    deleteSlot(slotNumber) {
        const slotKey = `saveSlot${slotNumber}`;
        const savedData = localStorage.getItem(slotKey);
        
        if (!savedData) {
            this.showSaveNotification('❌ No data to delete', 'warning');
            return;
        }
        
        try {
            const saveData = JSON.parse(savedData);
            const confirmMessage = `Delete Slot ${slotNumber}?\n\nSaved: ${saveData.timestamp}\n\nThis action cannot be undone.`;
            
            if (confirm(confirmMessage)) {
                localStorage.removeItem(slotKey);
                this.showSaveNotification(`🗑️ Slot ${slotNumber} deleted`);
                this.updateSaveSlotDisplay(slotNumber, null);
            }
            
        } catch (error) {
            console.error('Slot delete error:', error);
            this.showSaveNotification('❌ Error deleting slot', 'error');
        }
    }

    updateSaveSlotDisplay(slotNumber, timestamp) {
        const slotInfo = document.getElementById(`slot-${slotNumber}-info`);
        const loadButton = document.querySelector(`[data-slot="${slotNumber}"].load-from-slot`);
        const deleteButton = document.querySelector(`[data-slot="${slotNumber}"].delete-slot`);
        const slotContainer = loadButton.closest('.save-slot');
        
        if (timestamp) {
            slotInfo.textContent = `Saved: ${timestamp}`;
            loadButton.disabled = false;
            deleteButton.disabled = false;
            slotContainer.classList.add('has-data');
        } else {
            slotInfo.textContent = 'Empty';
            loadButton.disabled = true;
            deleteButton.disabled = true;
            slotContainer.classList.remove('has-data');
        }
    }

    loadSaveSlotDisplays() {
        for (let i = 1; i <= 3; i++) {
            const slotKey = `saveSlot${i}`;
            const savedData = localStorage.getItem(slotKey);
            
            if (savedData) {
                try {
                    const saveData = JSON.parse(savedData);
                    this.updateSaveSlotDisplay(i, saveData.timestamp);
                } catch (error) {
                    console.error(`Error loading slot ${i} display:`, error);
                    this.updateSaveSlotDisplay(i, null);
                }
            } else {
                this.updateSaveSlotDisplay(i, null);
            }
        }
    }

    updateSaveStatus() {
        const saveIndicator = document.querySelector('.save-indicator');
        const lastSaveTime = document.getElementById('last-save-time');
        const now = new Date();
        
        saveIndicator.textContent = '✅ Data saved automatically';
        saveIndicator.className = 'save-indicator';
        lastSaveTime.textContent = now.toLocaleString();
        
        localStorage.setItem('lastSaveTime', now.toISOString());
    }

    loadSaveStatus() {
        const lastSaveTime = document.getElementById('last-save-time');
        const savedTime = localStorage.getItem('lastSaveTime');
        
        if (savedTime) {
            const saveDate = new Date(savedTime);
            lastSaveTime.textContent = saveDate.toLocaleString();
        } else {
            lastSaveTime.textContent = 'Never';
        }
    }

    showSaveNotification(message, type = 'success') {
        // Remove existing notification
        const existingNotification = document.querySelector('.save-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `save-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Print functionality methods
    printDailySchedule() {
        this.saveCurrentDayData();
        
        // Store current tab and switch to daily
        const originalTab = this.currentTab;
        this.switchTab('daily');
        
        // Create print-optimized content
        const printContent = this.generateDailyPrintContent();
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        
        // Restore original tab
        this.switchTab(originalTab);
    }

    printWeeklyOverview() {
        // Store current tab and switch to weekly
        const originalTab = this.currentTab;
        this.switchTab('weekly');
        this.updateWeeklyOverview();
        
        // Create print-optimized content
        const printContent = this.generateWeeklyPrintContent();
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        
        // Restore original tab
        this.switchTab(originalTab);
    }

    printFullSchedule() {
        // Save current state
        this.saveAllData();
        
        // Create comprehensive print content
        const printContent = this.generateFullSchedulePrintContent();
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    }

    generateDailyPrintContent() {
        const today = new Date();
        const dayNames = {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
            sunday: 'Sunday'
        };
        
        const currentDayName = dayNames[this.currentDay];
        const dateStr = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Get current progress
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-activity]');
        const checkedCheckboxes = Array.from(allCheckboxes).filter(cb => cb.checked);
        const percentage = allCheckboxes.length > 0 ? 
            Math.round((checkedCheckboxes.length / allCheckboxes.length) * 100) : 0;
        
        // Generate activities HTML
        let activitiesHTML = '';
        document.querySelectorAll('.category').forEach(category => {
            const categoryTitle = category.querySelector('h3').textContent;
            activitiesHTML += `<div class="category">
                <h3>${categoryTitle}</h3>
                <div class="activity-list">`;
            
            category.querySelectorAll('.activity-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                const label = item.querySelector('label');
                const timeInput = item.querySelector('.time-input');
                
                const checked = checkbox.checked ? 'checked' : '';
                const completedClass = checkbox.checked ? 'completed' : '';
                const timeText = timeInput ? ` (${formatTime(timeInput.value)})` : '';
                
                activitiesHTML += `
                    <div class="activity-item ${completedClass}">
                        <input type="checkbox" ${checked} disabled>
                        <label>${label.textContent}${timeText}</label>
                    </div>`;
            });
            
            activitiesHTML += '</div></div>';
        });
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Kyu's Daily Plan - ${currentDayName}</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>🌟 Kyu's Daily Activity Planner 🌟</h1>
                        <div class="date-display">${dateStr}</div>
                    </header>
                    
                    <div class="current-day">
                        <h2>${currentDayName}'s Plan</h2>
                    </div>
                    
                    <div class="activity-categories">
                        ${activitiesHTML}
                    </div>
                    
                    <div class="progress-section">
                        <div class="progress-text">${percentage}% Complete</div>
                        <p class="print-date">Printed on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateWeeklyPrintContent() {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const completionData = JSON.parse(localStorage.getItem('dailyCompletions') || '{}');
        const todayData = completionData[today.toDateString()] || {};
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
            sunday: 'Sunday'
        };
        
        let weeklyHTML = '';
        days.forEach(day => {
            const percentage = todayData[day] || 0;
            const dayName = dayNames[day];
            
            weeklyHTML += `
                <div class="week-day">
                    <h4>${dayName}</h4>
                    <div class="daily-completion">${percentage}%</div>
                </div>`;
        });
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Kyu's Weekly Overview</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>🌟 Kyu's Weekly Activity Overview 🌟</h1>
                        <div class="date-display">Week of ${dateStr}</div>
                    </header>
                    
                    <div class="weekly-header">
                        <h2>Weekly Completion Summary</h2>
                    </div>
                    
                    <div class="weekly-grid">
                        ${weeklyHTML}
                    </div>
                    
                    <div class="progress-section">
                        <p class="print-date">Printed on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateFullSchedulePrintContent() {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = {
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
            sunday: 'Sunday'
        };
        
        let fullScheduleHTML = '';
        
        days.forEach(day => {
            const dayData = JSON.parse(localStorage.getItem(`dayData-${day}`) || '{}');
            const dayName = dayNames[day];
            
            fullScheduleHTML += `
                <div class="print-page-break">
                    <div class="current-day">
                        <h2>${dayName}'s Schedule</h2>
                    </div>
                    
                    <div class="activity-categories">`;
            
            // Generate activities for this day
            document.querySelectorAll('.category').forEach(category => {
                const categoryTitle = category.querySelector('h3').textContent;
                fullScheduleHTML += `<div class="category">
                    <h3>${categoryTitle}</h3>
                    <div class="activity-list">`;
                
                category.querySelectorAll('.activity-item').forEach(item => {
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    const label = item.querySelector('label');
                    const timeInput = item.querySelector('.time-input');
                    
                    const activityId = checkbox.dataset.activity;
                    const isChecked = dayData[activityId] || false;
                    const checked = isChecked ? 'checked' : '';
                    const completedClass = isChecked ? 'completed' : '';
                    
                    const savedTime = dayData[`${activityId}-time`];
                    const timeText = (timeInput && savedTime) ? ` (${formatTime(savedTime)})` : 
                                    timeInput ? ` (${formatTime(timeInput.value)})` : '';
                    
                    fullScheduleHTML += `
                        <div class="activity-item ${completedClass}">
                            <input type="checkbox" ${checked} disabled>
                            <label>${label.textContent}${timeText}</label>
                        </div>`;
                });
                
                fullScheduleHTML += '</div></div>';
            });
            
            fullScheduleHTML += '</div></div>';
        });
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Kyu's Complete Weekly Schedule</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>🌟 Kyu's Complete Weekly Schedule 🌟</h1>
                        <div class="date-display">Week of ${dateStr}</div>
                    </header>
                    
                    ${fullScheduleHTML}
                    
                    <div class="progress-section">
                        <p class="print-date">Printed on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getPrintStyles() {
        return `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Poppins', sans-serif; background: white; color: black; font-size: 12pt; line-height: 1.4; }
            .container { max-width: none; margin: 0; padding: 20px; }
            header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 30px; padding: 20px 0; }
            header h1 { color: #333; font-size: 24pt; margin-bottom: 10px; }
            .date-display { color: #666; font-size: 14pt; }
            .current-day h2 { color: #333; font-size: 20pt; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #333; padding-bottom: 10px; }
            .category { border: 1px solid #ddd; border-left: 4px solid #333; margin-bottom: 25px; padding: 15px; page-break-inside: avoid; }
            .category h3 { color: #333; font-size: 16pt; margin-bottom: 15px; font-weight: bold; }
            .activity-item { padding: 8px 0; margin-bottom: 5px; display: flex; align-items: flex-start; gap: 10px; page-break-inside: avoid; }
            .activity-item input[type="checkbox"] { width: 16px; height: 16px; margin-right: 8px; flex-shrink: 0; }
            .activity-item label { color: #333; font-size: 11pt; line-height: 1.3; font-weight: normal; }
            .activity-item.completed label { text-decoration: line-through; color: #666; }
            .progress-section { margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
            .progress-text { color: #333; font-size: 14pt; font-weight: bold; }
            .weekly-header h2 { color: #333; font-size: 20pt; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #333; padding-bottom: 10px; }
            .weekly-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
            .week-day { border: 1px solid #ddd; padding: 15px; text-align: center; page-break-inside: avoid; }
            .week-day h4 { color: #333; font-size: 14pt; margin-bottom: 10px; font-weight: bold; }
            .daily-completion { color: #333; font-size: 18pt; font-weight: bold; }
            .print-page-break { page-break-before: always; }
            .print-date { font-size: 12pt; color: #666; margin-top: 10px; }
            @page { margin: 0.75in; size: letter; }
        `;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const planner = new ActivityPlanner();
    
    // Load custom activities after initialization
    planner.loadCustomActivities();
    
    // Setup periodic auto-save
    window.addEventListener('beforeunload', () => {
        planner.saveAllData();
    });
});

// Additional utility functions
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour12 = ((parseInt(hours) + 11) % 12) + 1;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
}

function getMotivationalMessage(percentage) {
    if (percentage === 100) return "🎉 Amazing! You completed everything!";
    if (percentage >= 80) return "🌟 Great job! You're almost there!";
    if (percentage >= 60) return "👍 Good progress! Keep it up!";
    if (percentage >= 40) return "💪 You're doing well! Don't give up!";
    if (percentage >= 20) return "🌱 Good start! Every step counts!";
    return "✨ Ready to start your day? You've got this!";
}

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
