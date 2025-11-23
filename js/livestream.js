/**
 * Livestream Module
 * Handles livestream toggle and auto-detection functionality
 */

(function() {
    'use strict';

    // Constants
    const DEFAULT_CHECK_INTERVAL_MS = 60000; // 1 minute
    const STREAM_CHECK_TIMEOUT_MS = 5000; // 5 seconds

    // State
    let livestreamMonitorInterval = null;
    let isLivestreamActive = false;

    /**
     * Shows or hides the livestream
     * @param {string|null} url - Livestream URL or null to hide
     */
    function showLivestream(url) {
        const livestreamFrame = document.getElementById('livestreamFrame');
        if (!livestreamFrame) {
            console.error('Livestream frame element not found');
            return;
        }

        if (url) {
            activateLivestream(livestreamFrame, url);
        } else {
            deactivateLivestream(livestreamFrame);
        }
    }

    /**
     * Activates the livestream display
     * @param {HTMLElement} livestreamFrame - Livestream iframe element
     * @param {string} url - Livestream URL
     */
    function activateLivestream(livestreamFrame, url) {
        // Stop slideshow
        if (window.Slideshow) {
            window.Slideshow.hide();
        }

        // Show livestream
        livestreamFrame.src = url;
        livestreamFrame.style.display = 'block';
        isLivestreamActive = true;
        console.log('Switched to livestream:', url);
    }

    /**
     * Deactivates the livestream display
     * @param {HTMLElement} livestreamFrame - Livestream iframe element
     */
    function deactivateLivestream(livestreamFrame) {
        // Hide livestream
        livestreamFrame.style.display = 'none';
        livestreamFrame.src = '';
        isLivestreamActive = false;

        // Restart slideshow
        if (window.Slideshow) {
            window.Slideshow.show();
        }
        console.log('Switched to slideshow');
    }

    /**
     * Checks if a livestream URL is accessible
     * @param {string} url - Livestream URL to check
     * @returns {Promise<boolean>} True if stream is available
     */
    async function checkLivestreamStatus(url) {
        if (!url) return false;

        try {
            // For YouTube embeds, assume available (iframe will handle errors)
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                return true;
            }

            // For other streams (OBS, RTMP, HLS, etc.), try to fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), STREAM_CHECK_TIMEOUT_MS);

            await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors', // Avoid CORS issues
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return true; // If we get here, stream is likely available

        } catch (error) {
            console.log('Livestream not available:', error.message);
            return false;
        }
    }

    /**
     * Checks livestream status and switches display accordingly
     */
    async function checkAndSwitch() {
        const livestreamUrl = window.CONFIG && window.CONFIG.LIVESTREAM_URL;
        if (!livestreamUrl) return;

        const isOnline = await checkLivestreamStatus(livestreamUrl);

        if (isOnline && !isLivestreamActive) {
            console.log('Livestream detected online, switching...');
            showLivestream(livestreamUrl);
        } else if (!isOnline && isLivestreamActive) {
            console.log('Livestream went offline, switching to slideshow...');
            showLivestream(null);
        }
    }

    /**
     * Starts monitoring livestream status
     */
    function startLivestreamMonitoring() {
        const livestreamUrl = window.CONFIG && window.CONFIG.LIVESTREAM_URL;
        const checkInterval = (window.CONFIG && window.CONFIG.LIVESTREAM_CHECK_INTERVAL) || DEFAULT_CHECK_INTERVAL_MS;

        if (!livestreamUrl) {
            console.log('No livestream URL configured, auto-detection disabled');
            return;
        }

        console.log('Livestream auto-detection enabled. Checking every', checkInterval / 1000, 'seconds');

        // Initial check
        checkAndSwitch();

        // Periodic checks
        livestreamMonitorInterval = setInterval(checkAndSwitch, checkInterval);
    }

    /**
     * Stops monitoring livestream status
     */
    function stopLivestreamMonitoring() {
        if (livestreamMonitorInterval) {
            clearInterval(livestreamMonitorInterval);
            livestreamMonitorInterval = null;
        }
    }

    /**
     * Toggles between livestream and slideshow
     */
    function toggleLivestream() {
        const livestreamUrl = window.CONFIG && window.CONFIG.LIVESTREAM_URL;

        if (!livestreamUrl) {
            console.log('No livestream URL configured. Set LIVESTREAM_URL in config.js');
            return;
        }

        if (isLivestreamActive) {
            showLivestream(null);
        } else {
            showLivestream(livestreamUrl);
        }
    }

    /**
     * Initializes the livestream module
     */
    function init() {
        if (window.CONFIG && window.CONFIG.AUTO_DETECT_LIVESTREAM) {
            startLivestreamMonitoring();
        }
        console.log('Livestream module initialized');
    }

    // Export public API
    window.Livestream = {
        show: showLivestream,
        toggle: toggleLivestream,
        startMonitoring: startLivestreamMonitoring,
        stopMonitoring: stopLivestreamMonitoring,
        isActive: () => isLivestreamActive
    };

    // Expose showLivestream globally for backwards compatibility
    window.showLivestream = showLivestream;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
