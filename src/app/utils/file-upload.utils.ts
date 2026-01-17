/**
 * File Upload Security Utility
 * Validates uploaded files to prevent malicious uploads
 * 
 * Security checks:
 * 1. File extension whitelist
 * 2. MIME type validation
 * 3. File size limits
 * 4. Magic bytes (file signature) verification
 * 5. Filename sanitization
 */

export interface FileValidationResult {
    valid: boolean;
    error?: string;
    sanitizedFileName?: string;
}

export interface FileValidationOptions {
    maxSizeBytes?: number;
    allowedExtensions?: string[];
    allowedMimeTypes?: string[];
    validateMagicBytes?: boolean;
}

// Default options for image uploads
const DEFAULT_IMAGE_OPTIONS: FileValidationOptions = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ],
    validateMagicBytes: true,
};

// Magic bytes (file signatures) for common image formats
const MAGIC_BYTES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP starts with RIFF)
    // SVG is text-based, so we check for XML/SVG patterns instead
};

/**
 * Validate an uploaded file for security
 */
export async function validateFile(
    file: File,
    options: FileValidationOptions = DEFAULT_IMAGE_OPTIONS
): Promise<FileValidationResult> {
    const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };

    // 1. Check file size
    if (opts.maxSizeBytes && file.size > opts.maxSizeBytes) {
        const maxSizeMB = (opts.maxSizeBytes / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `Dosya boyutu çok büyük. Maksimum ${maxSizeMB}MB izin veriliyor.`,
        };
    }

    // 2. Check file extension
    const extension = getFileExtension(file.name).toLowerCase();
    if (opts.allowedExtensions && !opts.allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `Geçersiz dosya formatı. İzin verilen formatlar: ${opts.allowedExtensions.join(', ')}`,
        };
    }

    // 3. Check MIME type
    if (opts.allowedMimeTypes && !opts.allowedMimeTypes.includes(file.type)) {
        // Allow empty MIME type for SVG in some browsers
        if (extension !== 'svg' || file.type !== '') {
            return {
                valid: false,
                error: `Geçersiz dosya tipi. İzin verilen tipler: ${opts.allowedMimeTypes.join(', ')}`,
            };
        }
    }

    // 4. Validate magic bytes (file signature)
    if (opts.validateMagicBytes && extension !== 'svg') {
        const isValidSignature = await validateMagicBytes(file);
        if (!isValidSignature) {
            return {
                valid: false,
                error: 'Dosya içeriği uzantısıyla uyuşmuyor. Dosya bozuk veya değiştirilmiş olabilir.',
            };
        }
    }

    // 5. For SVG, check for malicious content
    if (extension === 'svg') {
        const svgValidation = await validateSvgContent(file);
        if (!svgValidation.valid) {
            return svgValidation;
        }
    }

    // 6. Sanitize filename
    const sanitizedFileName = sanitizeFileName(file.name);

    return {
        valid: true,
        sanitizedFileName,
    };
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Validate file magic bytes (file signature)
 */
async function validateMagicBytes(file: File): Promise<boolean> {
    const mimeType = file.type;
    const signatures = MAGIC_BYTES[mimeType];

    if (!signatures) {
        // Unknown MIME type, skip magic byte validation
        return true;
    }

    try {
        const buffer = await file.slice(0, 12).arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // Check if file starts with any of the valid signatures
        return signatures.some((signature) => {
            if (bytes.length < signature.length) return false;
            return signature.every((byte, index) => bytes[index] === byte);
        });
    } catch {
        // If we can't read the file, fail safe
        return false;
    }
}

/**
 * Validate SVG content for malicious code
 * SVG files can contain JavaScript and other dangerous content
 */
async function validateSvgContent(file: File): Promise<FileValidationResult> {
    try {
        const text = await file.text();
        const lowerText = text.toLowerCase();

        // Check for dangerous SVG elements and attributes
        const dangerousPatterns = [
            /<script/i,           // Script tags
            /javascript:/i,       // JavaScript protocol
            /on\w+\s*=/i,         // Event handlers (onclick, onerror, etc.)
            /<foreignobject/i,    // ForeignObject can embed HTML
            /data:text\/html/i,   // Data URIs with HTML
            /<iframe/i,           // Iframe elements
            /<embed/i,            // Embed elements
            /<object/i,           // Object elements
            /xlink:href\s*=\s*["']javascript:/i, // XLink JavaScript
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(lowerText)) {
                return {
                    valid: false,
                    error: 'SVG dosyası güvenlik riski içeriyor ve yüklenemez.',
                };
            }
        }

        // Check if it's actually an SVG
        if (!lowerText.includes('<svg')) {
            return {
                valid: false,
                error: 'Geçersiz SVG dosyası.',
            };
        }

        return { valid: true };
    } catch {
        return {
            valid: false,
            error: 'SVG dosyası okunamadı.',
        };
    }
}

/**
 * Sanitize filename to prevent path traversal and other issues
 */
export function sanitizeFileName(filename: string): string {
    // Remove path components
    let sanitized = filename.replace(/^.*[\\/]/, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Replace dangerous characters
    sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

    // Limit filename length
    if (sanitized.length > 200) {
        const ext = getFileExtension(sanitized);
        const name = sanitized.slice(0, 200 - ext.length - 1);
        sanitized = `${name}.${ext}`;
    }

    // If filename is empty after sanitization, generate a random one
    if (!sanitized || sanitized === '') {
        sanitized = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    return sanitized;
}

/**
 * Quick validation for image files with default options
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
    return validateFile(file, DEFAULT_IMAGE_OPTIONS);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if a file is an image based on MIME type
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/**
 * Create a safe object URL for previewing files
 * Remember to revoke it when done!
 */
export function createSafePreviewUrl(file: File): string | null {
    if (!isImageFile(file)) {
        return null;
    }
    return URL.createObjectURL(file);
}
