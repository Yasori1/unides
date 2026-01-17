import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, of } from 'rxjs';

/**
 * Client-side Error Logging Service
 * Sends frontend errors to backend for centralized logging
 * 
 * Backend endpoint required: POST /api/Logs/client-error
 * Expected payload: { level, message, context, timestamp, userAgent, url }
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface ClientLog {
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    timestamp: string;
    userAgent: string;
    url: string;
    userId?: string;
    cookies?: string;
}

@Injectable({
    providedIn: 'root',
})
export class ClientLoggingService {
    private apiUrl = `${environment.apiUrl}/Logs/client-error`;
    private logQueue: ClientLog[] = [];
    private isSending = false;
    private readonly BATCH_SIZE = 10;
    private readonly FLUSH_INTERVAL = 30000; // 30 seconds

    constructor(private http: HttpClient) {
        // Flush logs periodically
        if (typeof window !== 'undefined') {
            setInterval(() => this.flushLogs(), this.FLUSH_INTERVAL);

            // Flush on page unload
            window.addEventListener('beforeunload', () => this.flushLogsSync());
        }
    }

    /**
     * Log an error to the backend
     */
    logError(message: string, context?: Record<string, any>): void {
        this.addToQueue('error', message, context);
    }

    /**
     * Log a warning to the backend
     */
    logWarn(message: string, context?: Record<string, any>): void {
        this.addToQueue('warn', message, context);
    }

    /**
     * Log info to the backend (only in production for important events)
     */
    logInfo(message: string, context?: Record<string, any>): void {
        if (environment.production) {
            this.addToQueue('info', message, context);
        }
    }

    /**
     * Add log to queue
     */
    private addToQueue(level: LogLevel, message: string, context?: Record<string, any>): void {
        // Only send logs in production to avoid spamming during development
        if (!environment.production) {
            // In development, still log to console
            const consoleMethod = level === 'error' ? console.error :
                level === 'warn' ? console.warn : console.log;
            consoleMethod(`[${level.toUpperCase()}]`, message, context || '');
            return;
        }

        // Sanitize context - remove sensitive data
        const sanitizedContext = this.sanitizeContext(context);

        const log: ClientLog = {
            level,
            message,
            context: sanitizedContext,
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
            url: typeof window !== 'undefined' ? window.location.href : 'SSR',
            userId: this.getUserId(),
            cookies: this.getSanitizedCookies(),
        };

        this.logQueue.push(log);

        // Flush if queue is full
        if (this.logQueue.length >= this.BATCH_SIZE) {
            this.flushLogs();
        }
    }

    /**
     * Send queued logs to backend
     */
    private flushLogs(): void {
        if (this.isSending || this.logQueue.length === 0) {
            return;
        }

        this.isSending = true;
        const logsToSend = [...this.logQueue];
        this.logQueue = [];

        this.http.post(this.apiUrl, { logs: logsToSend }).pipe(
            catchError(() => {
                // If sending fails, put logs back in queue (limited to avoid memory issues)
                const remainingCapacity = this.BATCH_SIZE * 3 - this.logQueue.length;
                if (remainingCapacity > 0) {
                    this.logQueue.unshift(...logsToSend.slice(0, remainingCapacity));
                }
                return of(null);
            })
        ).subscribe(() => {
            this.isSending = false;
        });
    }

    /**
     * Synchronous flush for page unload
     */
    private flushLogsSync(): void {
        if (this.logQueue.length === 0 || typeof navigator === 'undefined') {
            return;
        }

        // Use sendBeacon for reliable delivery on page unload
        const data = JSON.stringify({ logs: this.logQueue });
        navigator.sendBeacon(this.apiUrl, data);
        this.logQueue = [];
    }

    /**
     * Get current user ID if available
     */
    /**
     * Get sanitized cookies string
     */
    private getSanitizedCookies(): string | undefined {
        if (typeof document === 'undefined') {
            return undefined;
        }

        const cookies = document.cookie;
        if (!cookies) return undefined;

        const sensitiveKeys = ['auth_token', 'refresh_token', 'session', 'jwt', 'cookie', 'token'];

        return cookies.split(';').map(cookie => {
            const [key, value] = cookie.trim().split('=');
            const lowerKey = key.toLowerCase();

            if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                return `${key}=[REDACTED]`;
            }
            return `${key}=${value}`;
        }).join('; ');
    }

    private getUserId(): string | undefined {
        if (typeof localStorage === 'undefined') {
            return undefined;
        }

        try {
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
                const parsed = JSON.parse(userInfo);
                return parsed.id?.toString();
            }
        } catch {
            // Ignore parsing errors
        }
        return undefined;
    }

    /**
     * Remove sensitive data from context before sending
     */
    private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
        if (!context) {
            return undefined;
        }

        const sensitiveKeys = ['password', 'token', 'accesstoken', 'refreshtoken', 'email', 'phone', 'credit', 'card'];
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(context)) {
            const lowerKey = key.toLowerCase();

            // Check if key contains sensitive data
            if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                // Recursively sanitize nested objects (max 1 level deep)
                sanitized[key] = this.sanitizeContext(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }
}
