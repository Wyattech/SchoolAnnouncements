/**
 * @fileoverview Initialization Module - Application bootstrap and global controls
 * @module init
 * @description Handles application initialization, keyboard shortcuts, school name setup,
 * and automatic 3 AM refresh scheduling. Coordinates startup of all other modules.
 *
 * @example
 * // Module initializes automatically on DOM ready
 * // Keyboard shortcuts available:
 * // - Arrow Left/Right: Navigate slides
 * // - F: Toggle fullscreen
 * // - L: Toggle livestream
 *
 * @requires module:constants - For keyboard mappings and configuration
 * @requires module:slideshow - For keyboard navigation
 * @requires module:livestream - For livestream toggle
 */

(function() {
    'use strict';

    // Import constants
    const CONSTANTS = window.APP_CONSTANTS;

    /**
     * Initializes the school name across all display elements
     */
    function initializeSchoolName() {
        const schoolName = (window.CONFIG && window.CONFIG.SCHOOL_NAME) || CONSTANTS.DEFAULT_SCHOOL_NAME;

        // Update bottom panel school name
        const schoolNameElement = document.getElementById(CONSTANTS.ELEMENT_IDS.SCHOOL_NAME);
        if (schoolNameElement) {
            schoolNameElement.textContent = schoolName;
        }

        // Update welcome message
        const welcomeElement = document.getElementById(CONSTANTS.ELEMENT_IDS.WELCOME_MESSAGE);
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
            case CONSTANTS.KEYBOARD.ARROW_RIGHT:
                if (window.Slideshow) {
                    window.Slideshow.next();
                }
                break;

            case CONSTANTS.KEYBOARD.ARROW_LEFT:
                if (window.Slideshow) {
                    window.Slideshow.previous();
                }
                break;

            case CONSTANTS.KEYBOARD.LIVESTREAM_TOGGLE:
            case CONSTANTS.KEYBOARD.LIVESTREAM_TOGGLE_UPPER:
                handleLivestreamToggle();
                break;

            case CONSTANTS.KEYBOARD.FULLSCREEN:
            case CONSTANTS.KEYBOARD.FULLSCREEN_UPPER:
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
        next3AM.setHours(CONSTANTS.AUTO_REFRESH_HOUR, 0, 0, 0);

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
        // Validate configuration before proceeding
        if (!window.ConfigValidator.validateAndDisplay()) {
            console.error('Application cannot start due to configuration errors');
            return; // Stop initialization if config is invalid
        }

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
