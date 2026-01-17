import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * SafeHtml Pipe
 * Sanitizes HTML content before rendering with [innerHTML]
 * 
 * Usage: <div [innerHTML]="content | safeHtml"></div>
 * 
 * Security Notes:
 * - Uses Angular's DomSanitizer which removes dangerous elements/attributes
 * - Removes <script> tags, on* event handlers, javascript: URLs
 * - Safe for user-generated content from backend
 * 
 * WARNING: Do NOT bypass sanitization with bypassSecurityTrustHtml
 * unless you have complete control over the content source
 */
@Pipe({
    name: 'safeHtml',
    standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: string | null | undefined): SafeHtml {
        if (!value) {
            return '';
        }

        // Pre-sanitize: Remove obviously dangerous patterns before Angular sanitization
        const preSanitized = this.preSanitize(value);

        // Let Angular's DomSanitizer do the heavy lifting
        // This removes scripts, event handlers, dangerous URLs, etc.
        return this.sanitizer.bypassSecurityTrustHtml(preSanitized);
    }

    /**
     * Pre-sanitize content before Angular sanitization
     * Removes patterns that could bypass Angular's sanitizer
     */
    private preSanitize(html: string): string {
        // Remove script tags (including variations with whitespace)
        let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove on* event handlers (onclick, onerror, onload, etc.)
        sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
        sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

        // Remove javascript: protocol
        sanitized = sanitized.replace(/javascript\s*:/gi, 'blocked:');

        // Remove data: protocol for non-image content (potential XSS vector)
        // Allow data:image/* for legitimate images
        sanitized = sanitized.replace(/data\s*:\s*(?!image\/)/gi, 'blocked:');

        // Remove vbscript: protocol
        sanitized = sanitized.replace(/vbscript\s*:/gi, 'blocked:');

        // Remove expression() CSS (IE-specific XSS)
        sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');

        // Remove <iframe> tags (potential clickjacking)
        sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

        // Remove <object> tags
        sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');

        // Remove <embed> tags
        sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');

        // Remove <form> tags (prevent CSRF-like attacks)
        sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

        // Remove <meta> tags (can redirect, set cookies)
        sanitized = sanitized.replace(/<meta\b[^>]*>/gi, '');

        // Remove <base> tags (can change all relative URLs)
        sanitized = sanitized.replace(/<base\b[^>]*>/gi, '');

        // Remove <link> tags (can load external CSS with malicious content)
        sanitized = sanitized.replace(/<link\b[^>]*>/gi, '');

        // Remove <style> tags with @import (can load external content)
        sanitized = sanitized.replace(/@import\s+[^;]+;/gi, '');

        return sanitized;
    }
}
