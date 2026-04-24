export class TTLCache {
    constructor({ ttlMs = 10 * 60 * 1000, maxEntries = 200 } = {}) {
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;
        this.store = new Map();
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }

        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }

        this.store.delete(key);
        this.store.set(key, entry);
        return entry.value;
    }

    set(key, value) {
        this.cleanupExpired();

        if (this.store.size >= this.maxEntries) {
            const oldestKey = this.store.keys().next().value;
            if (oldestKey !== undefined) {
                this.store.delete(oldestKey);
            }
        }

        this.store.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs
        });

        return value;
    }

    cleanupExpired() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.expiresAt <= now) {
                this.store.delete(key);
            }
        }
    }

    stats() {
        this.cleanupExpired();
        return {
            ttlMs: this.ttlMs,
            maxEntries: this.maxEntries,
            entries: this.store.size
        };
    }
}
