/**
 * Initialization Module
 * Handles app initialization, keyboard controls, and utilities
 */

(function() {
    'use strict';

    // Constants
    const AUTO_REFRESH_HOUR = 3; // 3 AM
    const DEFAULT_SCHOOL_NAME = 'School Name';

    /**
     * Initializes the school name across all display elements
     */
    function initializeSchoolName() {
        const schoolName = (window.CONFIG && window.CONFIG.SCHOOL_NAME) || DEFAULT_SCHOOL_NAME;

        // Update bottom panel school name
        const schoolNameElement = document.getElementById('schoolName');
        if (schoolNameElement) {
            schoolNameElement.textContent = schoolName;
        }

        // Update welcome message
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome to ${schoolName}`;
        }

        // Update page title
        document.title = `School Announcements - ${schoolName}`;
    }

    /**
     * Sets up keyboard event listeners for navigation and controls
     */
    function initializeKeyboardControls() {
        document.addEventListener('keydown', handleKeyPress);
        console.log('Keyboard controls initialized');
    }

    /**
     * Handles keyboard events
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyPress(e) {
        switch(e.key) {
            case 'ArrowRight':
                if (window.Slideshow) {
                    window.Slideshow.next();
                }
                break;

            case 'ArrowLeft':
                if (window.Slideshow) {
                    window.Slideshow.previous();
                }
                break;

            case 'l':
            case 'L':
                handleLivestreamToggle();
                break;

            case 'f':
            case 'F':
                toggleFullscreen();
                break;
        }
    }

    /**
     * Handles livestream toggle key press
     */
    function handleLivestreamToggle() {
        const livestreamUrl = window.CONFIG && window.CONFIG.LIVESTREAM_URL;

        if (!livestreamUrl) {
            console.log('Press L to toggle livestream. Configure URL in config.js');
            console.log('Set LIVESTREAM_URL in your config.js file');
            return;
        }

        if (window.Livestream) {
            window.Livestream.toggle();
        }
    }

    /**
     * Toggles fullscreen mode
     */
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Schedules a daily refresh at 3 AM to prevent memory leaks
     */
    function scheduleDaily3AMRefresh() {
        const now = new Date();
        const next3AM = new Date();
        next3AM.setHours(AUTO_REFRESH_HOUR, 0, 0, 0);

        // If 3 AM has already passed today, schedule for tomorrow
        if (now >= next3AM) {
            next3AM.setDate(next3AM.getDate() + 1);
        }

        const timeUntil3AM = next3AM - now;
        const hoursUntil = Math.floor(timeUntil3AM / (1000 * 60 * 60));

        console.log(`Auto-refresh scheduled in ${hoursUntil} hours (at 3:00 AM)`);

        setTimeout(() => {
            console.log('Performing scheduled refresh...');
            location.reload();
        }, timeUntil3AM);
    }

    /**
     * Logs welcome message and keyboard shortcuts to console
     */
    function logWelcomeMessage() {
        console.log('School Announcements Display - Ready');
        console.log('Keyboard shortcuts:');
        console.log('  Arrow keys: Navigate slides');
        console.log('  F: Toggle fullscreen');
        console.log('  L: Toggle livestream (configure URL first)');
    }

    /**
     * Initializes the application
     */
    function init() {
        initializeSchoolName();
        initializeKeyboardControls();
        scheduleDaily3AMRefresh();
        logWelcomeMessage();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
