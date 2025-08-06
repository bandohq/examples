/**
 * Simple in-memory cache for API responses
 */
class CacheManager {
    constructor(defaultTtl = 300000) { // 5 minutes default
        this.cache = new Map();
        this.defaultTtl = defaultTtl;
    }
    
    /**
     * Get value from cache
     */
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }
        
        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    /**
     * Set value in cache
     */
    set(key, value, ttl = null) {
        const expiry = Date.now() + (ttl || this.defaultTtl);
        
        this.cache.set(key, {
            value,
            expiry
        });
    }
    
    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }
    
    /**
     * Remove expired entries
     */
    cleanup() {
        const now = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        let expired = 0;
        let active = 0;
        const now = Date.now();
        
        for (const item of this.cache.values()) {
            if (now > item.expiry) {
                expired++;
            } else {
                active++;
            }
        }
        
        return {
            total: this.cache.size,
            active,
            expired
        };
    }
}

module.exports = {
    CacheManager
};
