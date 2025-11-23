import DOMPurify from 'dompurify';

/**
 * DOMPurify Configuration
 * Restrictive default configuration for sanitizing user-generated content
 */
const defaultConfig = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
    'span', 'div', 'pre', 'code', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
  ADD_ATTR: ['target'], // Allow target attribute
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Strict configuration - only basic text formatting
 */
const strictConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true
};

/**
 * Configure DOMPurify hooks for additional security
 */
if (typeof window !== 'undefined') {
  // Force all links to open in new tab with security attributes
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/**
 * Sanitize HTML content with default configuration
 * @param {string} dirty - Untrusted HTML string
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, defaultConfig);
}

/**
 * Sanitize HTML with strict configuration (minimal tags)
 * @param {string} dirty - Untrusted HTML string
 * @returns {string} Sanitized HTML string with minimal formatting
 */
export function sanitizeHTMLStrict(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, strictConfig);
}

/**
 * Sanitize and escape text for plain text display
 * Converts HTML to plain text safely
 * @param {string} text - Untrusted text
 * @returns {string} Escaped text safe for display
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';

  // Create a text node and get its escaped content
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize user input before sending to server
 * Removes potential injection attempts
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';

  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: protocol attacks
 * @param {string} url - Untrusted URL
 * @returns {string|null} Safe URL or null if dangerous
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url, window.location.origin);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch (e) {
    // Invalid URL
    return null;
  }
}

/**
 * React component for safely rendering HTML content
 */
export function SafeHTML({ html, className = '', strict = false }) {
  const clean = strict ? sanitizeHTMLStrict(html) : sanitizeHTML(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/**
 * React hook for sanitized content
 */
export function useSanitizedContent(content, strict = false) {
  if (!content) return '';
  return strict ? sanitizeHTMLStrict(content) : sanitizeHTML(content);
}

export default {
  sanitizeHTML,
  sanitizeHTMLStrict,
  sanitizeText,
  sanitizeInput,
  sanitizeURL,
  SafeHTML,
  useSanitizedContent
};
