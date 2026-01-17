/**
 * Security Utilities for Unides Frontend
 * Provides JWT validation, token handling, and input sanitization
 */

export interface JwtPayload {
    sub?: string;
    email?: string;
    role?: string;
    roleName?: string;
    RoleName?: string;
    exp?: number;
    iat?: number;
    nbf?: number;
    jti?: string;
    [key: string]: any;
}

/**
 * Decode a JWT token without verification (client-side only)
 * Note: This does NOT verify the signature - that must be done server-side
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJwtToken(token: string): JwtPayload | null {
    try {
        if (!token || typeof token !== 'string') {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        // Decode the payload (second part)
        const payload = parts[1];
        // Handle base64url encoding
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload) as JwtPayload;
    } catch (error) {
        // Invalid token format - don't log to prevent information disclosure
        return null;
    }
}

/**
 * Check if a JWT token is expired
 * @param token JWT token string
 * @returns true if expired or invalid, false if still valid
 */
export function isTokenExpired(token: string): boolean {
    const payload = decodeJwtToken(token);
    if (!payload || !payload.exp) {
        return true; // Treat invalid or missing exp as expired
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    // Add 30 second buffer for network latency
    return currentTime >= expirationTime - 30000;
}

/**
 * Extract role from JWT token
 * @param token JWT token string
 * @returns Role string or null if not found
 */
export function getRoleFromToken(token: string): string | null {
    const payload = decodeJwtToken(token);
    if (!payload) {
        return null;
    }

    // Check various possible role claim names
    return (
        payload.role ||
        payload.roleName ||
        payload.RoleName ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        null
    );
}

/**
 * Check if token role matches expected role
 * @param token JWT token string
 * @param expectedRole Expected role to match
 * @returns true if role matches, false otherwise
 */
export function validateTokenRole(token: string, expectedRole: string): boolean {
    const tokenRole = getRoleFromToken(token);
    if (!tokenRole) {
        return false;
    }

    // Case-insensitive comparison
    return tokenRole.toLowerCase() === expectedRole.toLowerCase();
}

/**
 * Sanitize user input to prevent XSS
 * Note: Angular's built-in sanitization handles most cases,
 * this is for additional protection in specific scenarios
 * @param input User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove script tags and event handlers
    let sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, 'data_blocked:');

    // Encode HTML entities for remaining content
    const htmlEntities: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
    };

    sanitized = sanitized.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);

    return sanitized;
}

/**
 * Validate email format
 * @param email Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Get remaining token validity time in seconds
 * @param token JWT token string
 * @returns Remaining seconds or 0 if expired/invalid
 */
export function getTokenRemainingTime(token: string): number {
    const payload = decodeJwtToken(token);
    if (!payload || !payload.exp) {
        return 0;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const remaining = Math.max(0, Math.floor((expirationTime - currentTime) / 1000));

    return remaining;
}
