import { environment } from '../../environments/environment';

/**
 * Logger Utility
 * Production-safe logging that only outputs in development mode
 * 
 * Usage:
 * import { Logger } from '../utils/logger.utils';
 * Logger.log('Message');
 * Logger.error('Error', errorObject);
 * Logger.warn('Warning');
 */
export class Logger {
    /**
     * Log informational messages (only in development)
     */
    static log(...args: any[]): void {
        if (!environment.production) {
            console.log(...args);
        }
    }

    /**
     * Log warning messages (only in development)
     */
    static warn(...args: any[]): void {
        if (!environment.production) {
            console.warn(...args);
        }
    }

    /**
     * Log error messages (only in development)
     * In production, errors are silently ignored to prevent information disclosure
     */
    static error(...args: any[]): void {
        if (!environment.production) {
            console.error(...args);
        }
    }

    /**
     * Log debug messages (only in development)
     */
    static debug(...args: any[]): void {
        if (!environment.production) {
            console.debug(...args);
        }
    }

    /**
     * Log info messages (only in development)
     */
    static info(...args: any[]): void {
        if (!environment.production) {
            console.info(...args);
        }
    }

    /**
     * Log a table (only in development)
     */
    static table(data: any, columns?: string[]): void {
        if (!environment.production) {
            console.table(data, columns);
        }
    }

    /**
     * Group log messages (only in development)
     */
    static group(label: string): void {
        if (!environment.production) {
            console.group(label);
        }
    }

    /**
     * End log group (only in development)
     */
    static groupEnd(): void {
        if (!environment.production) {
            console.groupEnd();
        }
    }
}
