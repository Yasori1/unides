/**
 * Password Strength Utility
 * Validates password strength and provides feedback
 */

export interface PasswordStrength {
    score: number; // 0-4 (0: very weak, 4: very strong)
    label: string;
    color: string;
    feedback: string[];
    isValid: boolean;
}

export interface PasswordRequirements {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false, // Optional but adds to score
};

/**
 * Check password strength
 */
export function checkPasswordStrength(
    password: string,
    requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
): PasswordStrength {
    const reqs = { ...DEFAULT_REQUIREMENTS, ...requirements };
    const feedback: string[] = [];
    let score = 0;

    // Empty password
    if (!password) {
        return {
            score: 0,
            label: '',
            color: '#cbd5e1',
            feedback: [],
            isValid: false,
        };
    }

    // Check minimum length
    if (password.length >= (reqs.minLength || 8)) {
        score++;
    } else {
        feedback.push(`En az ${reqs.minLength} karakter olmalı`);
    }

    // Check for uppercase letters
    const hasUppercase = /[A-Z]/.test(password);
    if (hasUppercase) {
        score++;
    } else if (reqs.requireUppercase) {
        feedback.push('Büyük harf içermeli');
    }

    // Check for lowercase letters
    const hasLowercase = /[a-z]/.test(password);
    if (hasLowercase) {
        score++;
    } else if (reqs.requireLowercase) {
        feedback.push('Küçük harf içermeli');
    }

    // Check for numbers
    const hasNumbers = /[0-9]/.test(password);
    if (hasNumbers) {
        score++;
    } else if (reqs.requireNumbers) {
        feedback.push('Rakam içermeli');
    }

    // Check for special characters (bonus)
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password);
    if (hasSpecialChars) {
        score++;
    } else if (reqs.requireSpecialChars) {
        feedback.push('Özel karakter içermeli (!@#$%...)');
    }

    // Extra points for length
    if (password.length >= 12) {
        score++;
    }
    if (password.length >= 16) {
        score++;
    }

    // Normalize score to 0-4
    const normalizedScore = Math.min(4, Math.floor(score * 4 / 7));

    // Check if meets minimum requirements
    const isValid =
        password.length >= (reqs.minLength || 8) &&
        (!reqs.requireUppercase || hasUppercase) &&
        (!reqs.requireLowercase || hasLowercase) &&
        (!reqs.requireNumbers || hasNumbers) &&
        (!reqs.requireSpecialChars || hasSpecialChars);

    // Get label and color based on score
    const { label, color } = getScoreInfo(normalizedScore);

    return {
        score: normalizedScore,
        label,
        color,
        feedback,
        isValid,
    };
}

/**
 * Get label and color for score
 */
function getScoreInfo(score: number): { label: string; color: string } {
    switch (score) {
        case 0:
            return { label: 'Çok Zayıf', color: '#dc2626' };
        case 1:
            return { label: 'Zayıf', color: '#f97316' };
        case 2:
            return { label: 'Orta', color: '#eab308' };
        case 3:
            return { label: 'Güçlü', color: '#22c55e' };
        case 4:
            return { label: 'Çok Güçlü', color: '#16a34a' };
        default:
            return { label: '', color: '#cbd5e1' };
    }
}

/**
 * Check if passwords match
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword && password.length > 0;
}

/**
 * Generate a random strong password
 */
export function generateStrongPassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + special;

    let password = '';

    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}
