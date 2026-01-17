import { Injectable } from '@angular/core';

/**
 * Rate Limiter Service
 * Provides client-side rate limiting for sensitive operations
 * Note: This is a defense-in-depth measure - server-side rate limiting is still required
 */

interface RateLimitEntry {
    count: number;
    firstAttempt: number;
    blocked: boolean;
    blockedUntil: number;
}

@Injectable({
    providedIn: 'root',
})
export class RateLimiterService {
    private limits: Map<string, RateLimitEntry> = new Map();

    // Configuration
    private readonly MAX_ATTEMPTS = 3; // Max attempts before blocking
    private readonly WINDOW_MS = 60000; // Time window in milliseconds (1 minute)
    private readonly BLOCK_DURATION_MS = 1800000; // Block duration (30 minutes)

    constructor() {
        // Clean up old entries periodically
        if (typeof window !== 'undefined') {
            setInterval(() => this.cleanup(), 60000);
        }
    }

    /**
     * Check if an action is allowed (not rate limited)
     * @param key Unique identifier for the action (e.g., 'login:user@email.com')
     * @returns Object with allowed status and remaining attempts/wait time
     */
    checkLimit(key: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
        const now = Date.now();
        const entry = this.limits.get(key);

        // No previous attempts
        if (!entry) {
            return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS, retryAfterSeconds: 0 };
        }

        // Check if currently blocked
        if (entry.blocked && now < entry.blockedUntil) {
            const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
            return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter };
        }

        // Unblock if block period has passed
        if (entry.blocked && now >= entry.blockedUntil) {
            this.limits.delete(key);
            return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS, retryAfterSeconds: 0 };
        }

        // Check if window has expired
        if (now - entry.firstAttempt > this.WINDOW_MS) {
            this.limits.delete(key);
            return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS, retryAfterSeconds: 0 };
        }

        // Check remaining attempts
        const remainingAttempts = Math.max(0, this.MAX_ATTEMPTS - entry.count);
        return { allowed: remainingAttempts > 0, remainingAttempts, retryAfterSeconds: 0 };
    }

    /**
     * Record an attempt for rate limiting
     * @param key Unique identifier for the action
     * @param success Whether the attempt was successful (successful attempts don't count toward limit)
     */
    recordAttempt(key: string, success: boolean = false): void {
        const now = Date.now();

        // Successful attempts reset the counter
        if (success) {
            this.limits.delete(key);
            return;
        }

        const entry = this.limits.get(key);

        if (!entry) {
            // First failed attempt
            this.limits.set(key, {
                count: 1,
                firstAttempt: now,
                blocked: false,
                blockedUntil: 0,
            });
            return;
        }

        // Check if window has expired
        if (now - entry.firstAttempt > this.WINDOW_MS) {
            // Reset window
            this.limits.set(key, {
                count: 1,
                firstAttempt: now,
                blocked: false,
                blockedUntil: 0,
            });
            return;
        }

        // Increment counter
        entry.count++;

        // Check if should block
        if (entry.count >= this.MAX_ATTEMPTS) {
            entry.blocked = true;
            entry.blockedUntil = now + this.BLOCK_DURATION_MS;
        }

        this.limits.set(key, entry);
    }

    /**
     * Get a rate limit key for login attempts
     * @param email User email
     * @returns Rate limit key
     */
    getLoginKey(email: string): string {
        return `login:${email.toLowerCase().trim()}`;
    }

    /**
     * Get a rate limit key for password reset attempts
     * @param email User email
     * @returns Rate limit key
     */
    getPasswordResetKey(email: string): string {
        return `password-reset:${email.toLowerCase().trim()}`;
    }

    /**
     * Get a rate limit key for registration attempts
     * Uses IP-based limiting via a session identifier
     * @returns Rate limit key
     */
    getRegistrationKey(): string {
        // Use a session-based key since we don't have IP on client
        let sessionId = sessionStorage.getItem('rate_limit_session');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
            sessionStorage.setItem('rate_limit_session', sessionId);
        }
        return `register:${sessionId}`;
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.limits.forEach((entry, key) => {
            // Remove unblocked entries that are past their window
            if (!entry.blocked && now - entry.firstAttempt > this.WINDOW_MS) {
                keysToDelete.push(key);
            }
            // Remove blocked entries that are past their block period
            if (entry.blocked && now >= entry.blockedUntil) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach((key) => this.limits.delete(key));
    }

    /**
     * Reset rate limit for a specific key (useful for testing or admin override)
     * @param key Rate limit key to reset
     */
    reset(key: string): void {
        this.limits.delete(key);
    }

    /**
     * Get formatted error message for rate limiting
     * @param retryAfterSeconds Seconds until retry is allowed
     * @returns User-friendly error message in Turkish
     */
    getErrorMessage(retryAfterSeconds: number): string {
        if (retryAfterSeconds > 60) {
            const minutes = Math.ceil(retryAfterSeconds / 60);
            return `Çok fazla deneme yaptınız. Lütfen ${minutes} dakika sonra tekrar deneyin.`;
        }
        return `Çok fazla deneme yaptınız. Lütfen ${retryAfterSeconds} saniye sonra tekrar deneyin.`;
    }
}
