/**
 * @fileoverview Cache Module - LocalStorage-based caching for API responses
 * @module cache
 * @description Provides simple key-value caching with TTL (time-to-live) support
 * to reduce unnecessary API calls and improve performance.
 *
 * @example
 * // Store data with 10-minute TTL
 * window.Cache.set('weather-current', weatherData, 600000);
 *
 * // Retrieve cached data
 * const cached = window.Cache.get('weather-current');
 * if (cached) {
 *     // Use cached data
 * }
 */

(function() {
    'use strict';

    /**
     * @typedef {Object} CacheEntry
     * @property {*} data - Cached data
     * @property {number} timestamp - When the data was cached
     * @property {number} ttl - Time-to-live in milliseconds
     */

    /**
     * Cache Manager Class
     */
    class CacheManager {
        /**
         * Stores data in localStorage with TTL
         * @param {string} key - Cache key
         * @param {*} data - Data to cache (will be JSON stringified)
         * @param {number} ttl - Time-to-live in milliseconds
         * @returns {boolean} True if successfully cached
         */
        static set(key, data, ttl) {
            try {
                const entry = {
                    data: data,
                    timestamp: Date.now(),
                    ttl: ttl
                };

                localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
                return true;
            } catch (error) {
                // localStorage might be full or unavailable
                console.warn('Failed to cache data:', error);
                return false;
            }
        }

        /**
         * Retrieves data from cache if not expired
         * @param {string} key - Cache key
         * @returns {*|null} Cached data or null if not found/expired
         */
        static get(key) {
            try {
                const cached = localStorage.getItem(`cache_${key}`);

                if (!cached) {
                    return null;
                }

                const entry = JSON.parse(cached);
                const now = Date.now();

                // Check if cache is expired
                if (now - entry.timestamp > entry.ttl) {
                    this.remove(key);
                    return null;
                }

                return entry.data;
            } catch (error) {
                console.warn('Failed to retrieve cached data:', error);
                this.remove(key);
                return null;
            }
        }

        /**
         * Removes a specific cache entry
         * @param {string} key - Cache key
         */
        static remove(key) {
            try {
                localStorage.removeItem(`cache_${key}`);
            } catch (error) {
                console.warn('Failed to remove cache entry:', error);
            }
        }

        /**
         * Clears all cache entries
         */
        static clear() {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('cache_')) {
                        localStorage.removeItem(key);
                    }
                });
                console.log('Cache cleared');
            } catch (error) {
                console.warn('Failed to clear cache:', error);
            }
        }

        /**
         * Gets cache statistics
         * @returns {Object} Cache statistics
         */
        static getStats() {
            try {
                const keys = Object.keys(localStorage);
                const cacheKeys = keys.filter(key => key.startsWith('cache_'));
                const now = Date.now();

                let totalSize = 0;
                let validEntries = 0;
                let expiredEntries = 0;

                cacheKeys.forEach(key => {
                    const value = localStorage.getItem(key);
                    totalSize += value ? value.length : 0;

                    try {
                        const entry = JSON.parse(value);
                        if (now - entry.timestamp > entry.ttl) {
                            expiredEntries++;
                        } else {
                            validEntries++;
                        }
                    } catch (e) {
                        // Invalid entry
                    }
                });

                return {
                    totalEntries: cacheKeys.length,
                    validEntries: validEntries,
                    expiredEntries: expiredEntries,
                    totalSizeBytes: totalSize,
                    totalSizeKB: (totalSize / 1024).toFixed(2)
                };
            } catch (error) {
                console.warn('Failed to get cache stats:', error);
                return null;
            }
        }

        /**
         * Checks if localStorage is available
         * @returns {boolean} True if localStorage is available
         */
        static isAvailable() {
            try {
                const test = '__cache_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    // Expose to window
    window.Cache = CacheManager;

    // Log cache availability on load
    if (CacheManager.isAvailable()) {
        console.log('Cache system initialized (localStorage available)');

        // Log cache stats if there are cached items
        const stats = CacheManager.getStats();
        if (stats && stats.totalEntries > 0) {
            console.log(`Cache stats: ${stats.validEntries} valid entries, ${stats.expiredEntries} expired (${stats.totalSizeKB} KB)`);
        }
    } else {
        console.warn('Cache system disabled (localStorage not available)');
    }

})();
