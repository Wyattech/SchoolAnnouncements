/**
 * DateTime Module
 * Handles clock and date display updates
 */

(function() {
    'use strict';

    // Constants
    const UPDATE_INTERVAL_MS = 1000; // Update every second

    /**
     * Updates the time and date display elements
     */
    function updateDateTime() {
        const now = new Date();

        updateTimeDisplay(now);
        updateDateDisplay(now);
    }

    /**
     * Updates the time display in 12-hour format with AM/PM
     * @param {Date} now - Current date/time
     */
    function updateTimeDisplay(now) {
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        const displayHours = String(hours).padStart(2, '0');

        const timeElement = document.getElementById('timeDisplay');
        if (timeElement) {
            timeElement.textContent = `${displayHours}:${minutes}:${seconds} ${ampm}`;
        }
    }

    /**
     * Updates the date display with full weekday and date
     * @param {Date} now - Current date/time
     */
    function updateDateDisplay(now) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const dateString = now.toLocaleDateString('en-US', options);

        const dateElement = document.getElementById('dateDisplay');
        if (dateElement) {
            dateElement.textContent = dateString;
        }
    }

    /**
     * Initializes the date/time display and starts the update interval
     */
    function init() {
        updateDateTime(); // Initial call
        setInterval(updateDateTime, UPDATE_INTERVAL_MS);
        console.log('DateTime module initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
