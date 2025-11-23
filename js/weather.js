/**
 * Weather Module
 * Handles weather API integration for current conditions and forecast
 */

(function() {
    'use strict';

    // Constants
    const UPDATE_INTERVAL_MS = 600000; // Update every 10 minutes
    const MAX_FORECAST_DAYS = 5;

    /**
     * Fetches weather data from OpenWeatherMap API
     */
    async function fetchWeather() {
        if (!validateConfig()) {
            return;
        }

        const { WEATHER_API_KEY, LOCATION, CITY_ID } = window.CONFIG;
        const locationParam = buildLocationParam(LOCATION, CITY_ID);

        if (!locationParam) {
            displayError('currentDesc', 'Location Not Set');
            console.error('No location configured - set either LOCATION or CITY_ID in config.js');
            return;
        }

        try {
            await fetchCurrentWeather(locationParam, WEATHER_API_KEY);
            await fetchWeatherForecast(locationParam, WEATHER_API_KEY);
        } catch (error) {
            console.error('Weather fetch error:', error);
            if (!document.getElementById('currentDesc').textContent.startsWith('Error:')) {
                displayError('currentDesc', 'Error Loading Weather');
            }
        }
    }

    /**
     * Validates weather API configuration
     * @returns {boolean} True if config is valid
     */
    function validateConfig() {
        if (!window.CONFIG || !window.CONFIG.WEATHER_API_KEY) {
            console.error('Weather API key not configured');
            displayError('currentDesc', 'API Key Missing');
            return false;
        }

        // Check if API key is still the placeholder
        if (window.CONFIG.WEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
            console.error('Weather API key not configured - still using placeholder value');
            displayError('currentDesc', 'Configure API Key');
            displayError('currentTemp', '--°F');
            displayError('feelsLike', '--°F');
            displayError('humidity', '--%');
            return false;
        }

        return true;
    }

    /**
     * Builds location parameter for API requests
     * @param {string} location - City name location string
     * @param {number|null} cityId - OpenWeatherMap city ID
     * @returns {string|null} Location parameter string or null
     */
    function buildLocationParam(location, cityId) {
        if (cityId) {
            console.log('Using city ID:', cityId);
            return `id=${cityId}`;
        } else if (location) {
            console.log('Using city name:', location);
            return `q=${location}`;
        }
        return null;
    }

    /**
     * Fetches current weather conditions
     * @param {string} locationParam - Location parameter for API
     * @param {string} apiKey - OpenWeatherMap API key
     */
    async function fetchCurrentWeather(locationParam, apiKey) {
        const url = `https://api.openweathermap.org/data/2.5/weather?${locationParam}&appid=${apiKey}&units=imperial`;
        console.log('Fetching weather from:', url.replace(apiKey, 'API_KEY_HIDDEN'));

        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 200) {
            updateCurrentWeather(data);
        } else {
            const errorMsg = data.message || 'Failed to fetch current weather';
            console.error('Weather API error:', errorMsg, '(Code:', data.cod, ')');
            displayError('currentDesc', `Error: ${errorMsg}`);
            throw new Error(errorMsg);
        }
    }

    /**
     * Fetches weather forecast
     * @param {string} locationParam - Location parameter for API
     * @param {string} apiKey - OpenWeatherMap API key
     */
    async function fetchWeatherForecast(locationParam, apiKey) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?${locationParam}&appid=${apiKey}&units=imperial`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === "200") {
            updateWeekForecast(data);
        } else {
            throw new Error(data.message || 'Failed to fetch forecast');
        }
    }

    /**
     * Updates the current weather display
     * @param {Object} data - Weather data from API
     */
    function updateCurrentWeather(data) {
        const temp = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const humidity = data.main.humidity;
        const description = data.weather[0].description;
        const icon = data.weather[0].icon;

        setElementText('currentTemp', `${temp}°F`);
        setElementText('currentDesc', description);
        setElementText('feelsLike', `${feelsLike}°F`);
        setElementText('humidity', `${humidity}%`);

        const iconElement = document.getElementById('currentIcon');
        if (iconElement) {
            iconElement.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
            iconElement.alt = description;
        }
    }

    /**
     * Updates the week forecast display
     * @param {Object} data - Forecast data from API
     */
    function updateWeekForecast(data) {
        const forecastContainer = document.getElementById('weekForecast');
        if (!forecastContainer) return;

        forecastContainer.innerHTML = '';

        const dailyForecasts = aggregateDailyForecasts(data.list);
        const days = Object.entries(dailyForecasts).slice(0, MAX_FORECAST_DAYS);

        days.forEach(([day, forecast]) => {
            const forecastElement = createForecastElement(day, forecast);
            forecastContainer.appendChild(forecastElement);
        });
    }

    /**
     * Aggregates hourly forecast data into daily forecasts
     * @param {Array} forecastList - List of forecast items from API
     * @returns {Object} Daily forecasts keyed by date string
     */
    function aggregateDailyForecasts(forecastList) {
        const dailyForecasts = {};

        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            // Use the 12:00 PM forecast for each day, or first available
            if (!dailyForecasts[dateKey]) {
                dailyForecasts[dateKey] = {
                    temp_max: item.main.temp_max,
                    temp_min: item.main.temp_min,
                    icon: item.weather[0].icon,
                    description: item.weather[0].description
                };
            } else {
                // Update min/max temps
                dailyForecasts[dateKey].temp_max = Math.max(
                    dailyForecasts[dateKey].temp_max,
                    item.main.temp_max
                );
                dailyForecasts[dateKey].temp_min = Math.min(
                    dailyForecasts[dateKey].temp_min,
                    item.main.temp_min
                );
            }
        });

        return dailyForecasts;
    }

    /**
     * Creates a forecast day DOM element
     * @param {string} day - Day label
     * @param {Object} forecast - Forecast data
     * @returns {HTMLElement} Forecast element
     */
    function createForecastElement(day, forecast) {
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';

        forecastDay.innerHTML = `
            <div class="forecast-day-name">${day}</div>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${forecast.icon}.png"
                     alt="${forecast.description}">
            </div>
            <div class="forecast-temps">
                <span class="forecast-high">${Math.round(forecast.temp_max)}°</span>
                <span class="forecast-low">${Math.round(forecast.temp_min)}°</span>
            </div>
        `;

        return forecastDay;
    }

    /**
     * Sets text content of an element by ID
     * @param {string} elementId - Element ID
     * @param {string} text - Text to set
     */
    function setElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Displays an error message in a specific element
     * @param {string} elementId - Element ID
     * @param {string} message - Error message
     */
    function displayError(elementId, message) {
        setElementText(elementId, message);
    }

    /**
     * Initializes weather module
     */
    function init() {
        if (window.CONFIG && window.CONFIG.WEATHER_API_KEY) {
            fetchWeather();
            setInterval(fetchWeather, UPDATE_INTERVAL_MS);
            console.log('Weather module initialized');
        } else {
            console.warn('Weather module not initialized - no API key configured');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
