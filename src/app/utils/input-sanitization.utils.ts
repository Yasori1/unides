/**
 * Input Sanitization Utility
 * Sanitizes user input to prevent XSS and injection attacks
 */

/**
 * Sanitize text input by escaping HTML entities
 */
export function sanitizeTextInput(input: string | null | undefined): string {
    if (!input) return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Strip all HTML tags from input
 */
export function stripHtmlTags(input: string | null | undefined): string {
    if (!input) return '';

    return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string | null | undefined): string {
    if (!email) return '';

    // Remove any HTML/script tags
    let sanitized = stripHtmlTags(email);

    // Trim whitespace
    sanitized = sanitized.trim();

    // Convert to lowercase
    sanitized = sanitized.toLowerCase();

    // Remove any characters that shouldn't be in email
    // Valid email chars: a-z, 0-9, @, ., _, -, +
    sanitized = sanitized.replace(/[^a-z0-9@._\-+]/g, '');

    return sanitized;
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string | null | undefined): string {
    if (!url) return '';

    // Trim whitespace
    let sanitized = url.trim();

    // Block dangerous protocols
    const dangerousProtocols = [
        'javascript:',
        'data:',
        'vbscript:',
        'file:',
    ];

    const lowerUrl = sanitized.toLowerCase();
    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            return '';
        }
    }

    // Ensure it starts with http:// or https:// or is a relative path
    if (!sanitized.startsWith('http://') &&
        !sanitized.startsWith('https://') &&
        !sanitized.startsWith('/') &&
        !sanitized.startsWith('./') &&
        !sanitized.startsWith('../')) {
        // If it looks like a domain, add https://
        if (sanitized.includes('.') && !sanitized.includes(' ')) {
            sanitized = 'https://' + sanitized;
        }
    }

    return sanitized;
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';

    // Keep only digits and + sign
    return phone.replace(/[^\d+]/g, '');
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
    if (!query) return '';

    // Strip HTML
    let sanitized = stripHtmlTags(query);

    // Trim and limit length
    sanitized = sanitized.trim().slice(0, 200);

    // Remove special regex characters that could cause issues
    sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '');

    return sanitized;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string | null | undefined): string {
    if (!filename) return '';

    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[\/\\]/g, '');

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');

    // Trim and limit length
    sanitized = sanitized.trim().slice(0, 255);

    return sanitized;
}

/**
 * Remove ASCII Art and Block characters (░, ▒, ▓, █, etc.)
 */
export function removeBlockCharacters(input: string): string {
    if (!input) return '';
    // Block Elements (U+2580 - U+259F) and Geometric Shapes (U+25A0 - U+25FF)
    // and some other common ASCII art symbols
    return input.replace(/[\u2580-\u259F\u25A0-\u25FF\u2800-\u28FF]/g, '');
}

/**
 * Sanitize general user input (for forms, comments, etc.)
 * Restricts to English/Turkish characters, numbers, and standard punctuation.
 */
export function sanitizeUserInput(input: string | null | undefined): string {
    if (!input) return '';

    // Strip HTML tags
    let sanitized = stripHtmlTags(input);

    // Remove Block ASCII Art characters
    sanitized = removeBlockCharacters(sanitized);

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Strict Filtering: Allow only English/Turkish characters, 
    // numbers, spaces, and standard punctuation.
    // TR: a-z, A-Z, 0-9, ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü
    // Symbols: space, ., ,, !, ?, @, #, $, %, &, *, (, ), -, _, +, =, :, ;, ', ", /, \, |, ~, `, ^
    const allowedRegex = /[^a-zA-Z0-9çğışöüÇĞİŞÖÜ\s.,!?;:()\[\]{}'\"\-=_+@#$%^&*\/\\|~`^]/g;
    sanitized = sanitized.replace(allowedRegex, '');

    // Normalize whitespace (multiple spaces to single)
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
}

/**
 * Check if input contains potential XSS patterns
 */
export function containsXssPatterns(input: string | null | undefined): boolean {
    if (!input) return false;

    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
        /data:text\/html/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /expression\(/i,
        /vbscript:/i,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate if string is a valid email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
    if (!email) return false;

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate Turkish phone number
 */
export function isValidTurkishPhone(phone: string | null | undefined): boolean {
    if (!phone) return false;

    // Remove non-digits
    const digits = phone.replace(/\D/g, '');

    // Turkish phone: 10 digits starting with 5 (mobile) or 11 digits starting with 90
    if (digits.length === 10 && digits.startsWith('5')) {
        return true;
    }
    if (digits.length === 11 && digits.startsWith('05')) {
        return true;
    }
    if (digits.length === 12 && digits.startsWith('905')) {
        return true;
    }

    return false;
}
