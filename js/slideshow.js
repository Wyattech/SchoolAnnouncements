/**
 * @fileoverview Slideshow Module - Dynamic slide presentation management
 * @module slideshow
 * @description Manages slideshow functionality with support for both image-based slides
 * (loaded from JSON) and HTML-based slides. Includes automatic advancement, manual navigation,
 * and graceful error handling for missing images.
 *
 * @example
 * // Module initializes automatically and provides public API
 * window.Slideshow.next(); // Advance to next slide
 * window.Slideshow.previous(); // Go to previous slide
 * window.Slideshow.show(); // Show slideshow
 * window.Slideshow.hide(); // Hide slideshow
 *
 * @requires module:constants - For intervals, folders, and CSS classes
 * @requires module:error-handler - For error notifications
 */

(function() {
    'use strict';

    // Import constants
    const CONSTANTS = window.APP_CONSTANTS;

    // State
    let currentSlide = 0;
    let slides = [];
    let slideshowInterval = null;
    let imageSlides = [];

    /**
     * Loads image slides from the slides folder
     */
    async function loadImageSlides() {
        const slidesFolder = (window.CONFIG && window.CONFIG.SLIDES_FOLDER) || CONSTANTS.SLIDESHOW_DEFAULT_FOLDER;
        const useImageSlides = (window.CONFIG && window.CONFIG.USE_IMAGE_SLIDES) || false;

        if (!useImageSlides) {
            console.log('Using HTML slides');
            return;
        }

        try {
            const response = await fetch(`${slidesFolder}/slides.json`);
            if (!response.ok) {
                window.ErrorHandler.handle('slides.json not found', {
                    level: window.ErrorLevel.WARNING,
                    module: 'Slideshow',
                    showNotification: false, // Don't notify for expected fallback
                    userMessage: 'Slideshow configuration not found. Using default slides.'
                });
                return;
            }

            const data = await response.json();
            imageSlides = data.images || [];

            if (imageSlides.length === 0) {
                window.ErrorHandler.handle('No images in slides.json', {
                    level: window.ErrorLevel.WARNING,
                    module: 'Slideshow',
                    showNotification: false,
                    userMessage: 'No images configured in slides.json. Using default slides.'
                });
                return;
            }

            console.log(`Loaded ${imageSlides.length} image slides from ${slidesFolder}`);
            createImageSlides(slidesFolder, imageSlides);

        } catch (error) {
            window.ErrorHandler.handle(error, {
                level: window.ErrorLevel.WARNING,
                module: 'Slideshow',
                showNotification: true,
                userMessage: 'Failed to load image slides. Using default slides instead.',
                recoverable: false
            });
        }
    }

    /**
     * Creates image slide elements in the DOM
     * @param {string} slidesFolder - Path to slides folder
     * @param {Array} images - Array of image filenames
     */
    function createImageSlides(slidesFolder, images) {
        const slideshowContainer = document.getElementById(CONSTANTS.ELEMENT_IDS.SLIDESHOW_CONTAINER);
        if (!slideshowContainer) {
            window.ErrorHandler.handle('Slideshow container not found', {
                level: window.ErrorLevel.ERROR,
                module: 'Slideshow',
                showNotification: true,
                userMessage: 'Unable to initialize slideshow display.'
            });
            return;
        }

        // Clear existing HTML slides
        slideshowContainer.innerHTML = '';

        // Create image slides with error handling
        images.forEach((imageName, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = CONSTANTS.CSS_CLASSES.SLIDE;
            if (index === 0) slideDiv.classList.add(CONSTANTS.CSS_CLASSES.SLIDE_ACTIVE);

            const img = document.createElement('img');
            img.src = `${slidesFolder}/${imageName}`;
            img.alt = `Slide ${index + 1}`;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';

            // Handle image loading errors
            img.onerror = () => {
                window.ErrorHandler.handle(`Failed to load image: ${imageName}`, {
                    level: window.ErrorLevel.WARNING,
                    module: 'Slideshow',
                    showNotification: false, // Don't spam for each failed image
                    userMessage: `Failed to load slide image: ${imageName}`
                });

                // Replace with error message
                slideDiv.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column;">
                        <h2 style="color: #e74c3c;">⚠️ Image Not Found</h2>
                        <p style="font-size: 2rem;">${imageName}</p>
                    </div>
                `;
            };

            slideDiv.appendChild(img);
            slideshowContainer.appendChild(slideDiv);
        });
    }

    /**
     * Initializes the slideshow
     */
    function initSlideshow() {
        slides = document.querySelectorAll(`.${CONSTANTS.CSS_CLASSES.SLIDE}`);

        if (slides.length > 0) {
            showSlide(0);

            // Auto-advance slides
            const interval = (window.CONFIG && window.CONFIG.SLIDESHOW_INTERVAL) || CONSTANTS.SLIDESHOW_DEFAULT_INTERVAL_MS;
            slideshowInterval = setInterval(nextSlide, interval);
        }
    }

    /**
     * Displays a specific slide by index
     * @param {number} index - Slide index to display
     */
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove(CONSTANTS.CSS_CLASSES.SLIDE_ACTIVE));

        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }

        slides[currentSlide].classList.add(CONSTANTS.CSS_CLASSES.SLIDE_ACTIVE);
    }

    /**
     * Advances to the next slide
     */
    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    /**
     * Goes back to the previous slide
     */
    function previousSlide() {
        showSlide(currentSlide - 1);
    }

    /**
     * Stops the slideshow
     */
    function stopSlideshow() {
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
        }
    }

    /**
     * Restarts the slideshow
     */
    function restartSlideshow() {
        stopSlideshow();
        initSlideshow();
    }

    /**
     * Shows the slideshow container
     */
    function show() {
        const slideshowContainer = document.getElementById(CONSTANTS.ELEMENT_IDS.SLIDESHOW_CONTAINER);
        if (slideshowContainer) {
            slideshowContainer.style.display = 'flex';
        }
        restartSlideshow();
    }

    /**
     * Hides the slideshow container
     */
    function hide() {
        const slideshowContainer = document.getElementById(CONSTANTS.ELEMENT_IDS.SLIDESHOW_CONTAINER);
        if (slideshowContainer) {
            slideshowContainer.style.display = 'none';
        }
        stopSlideshow();
    }

    /**
     * Initializes the slideshow module
     */
    async function init() {
        await loadImageSlides();
        initSlideshow();
        console.log('Slideshow module initialized');
    }

    // Export public API
    window.Slideshow = {
        init,
        next: nextSlide,
        previous: previousSlide,
        show,
        hide,
        restart: restartSlideshow
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
