export class StorageManager {
    private prefix: string;

    constructor(prefix: string = 'niid') {
        this.prefix = prefix;
    }

    private getKey(key: string): string {
        return `${this.prefix}_${key}`;
    }

    set(key: string, value: string): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(this.getKey(key), value);
            } catch (error) {
                console.warn('[NIID SDK] Failed to save to localStorage:', error);
            }
        }
    }

    get(key: string): string | null {
        if (typeof window !== 'undefined') {
            try {
                return localStorage.getItem(this.getKey(key));
            } catch (error) {
                console.warn('[NIID SDK] Failed to read from localStorage:', error);
                return null;
            }
        }
        return null;
    }

    remove(key: string): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(this.getKey(key));
            } catch (error) {
                console.warn('[NIID SDK] Failed to remove from localStorage:', error);
            }
        }
    }

    clear(): void {
        if (typeof window !== 'undefined') {
            try {
                // Only clear items with our prefix
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (error) {
                console.warn('[NIID SDK] Failed to clear localStorage:', error);
            }
        }
    }
}
